import os
from collections import defaultdict
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload

from database import Base, SessionLocal, engine, get_db
from models import DiningTable, InventoryItem, MenuItem, Order, OrderItem
from schemas import (
    InventoryAdjust,
    InventoryCreate,
    InventoryOut,
    InventoryUpdate,
    KOTStatusUpdate,
    MenuItemCreate,
    MenuItemOut,
    MenuItemUpdate,
    OrderCreate,
    OrderOut,
    OrderSettle,
    TableCreate,
    TableOut,
    TableUpdate,
)
from seed import seed_database


def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    yield


# Ensure DB initializes both under Uvicorn lifespan and Vercel serverless cold starts
init_db()

app = FastAPI(
    title="PetPuja POS API",
    version="1.0.0",
    description="Full-stack Restaurant POS backend with Billing, KOT, Tables, Inventory, and Analytics.",
    lifespan=lifespan,
)

raw_origins = os.getenv("ALLOWED_ORIGINS", "*").strip()
if raw_origins == "*" or not raw_origins:
    allow_origins = ["*"]
else:
    allow_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=False if allow_origins == ["*"] else True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "PetPuja POS API", "status": "running", "docs": "/docs"}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


# ==================== MENU ENDPOINTS ====================
@app.get("/api/menu", response_model=List[MenuItemOut])
def list_menu(
    category: Optional[str] = None,
    veg_only: bool = False,
    available_only: bool = False,
    db: Session = Depends(get_db),
):
    q = db.query(MenuItem)
    if category and category.lower() != "all":
        q = q.filter(MenuItem.category == category)
    if veg_only:
        q = q.filter(MenuItem.is_veg.is_(True))
    if available_only:
        q = q.filter(MenuItem.is_available.is_(True))
    return q.order_by(MenuItem.category, MenuItem.name).all()


@app.post("/api/menu", response_model=MenuItemOut, status_code=201)
def create_menu_item(payload: MenuItemCreate, db: Session = Depends(get_db)):
    item = MenuItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.patch("/api/menu/{item_id}", response_model=MenuItemOut)
def update_menu_item(item_id: int, payload: MenuItemUpdate, db: Session = Depends(get_db)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, val)
    db.commit()
    db.refresh(item)
    return item


@app.delete("/api/menu/{item_id}")
def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    db.delete(item)
    db.commit()
    return {"deleted": True, "id": item_id}


# ==================== TABLE ENDPOINTS ====================
@app.get("/api/tables", response_model=List[TableOut])
def list_tables(db: Session = Depends(get_db)):
    return db.query(DiningTable).order_by(DiningTable.section, DiningTable.table_number).all()


@app.post("/api/tables", response_model=TableOut, status_code=201)
def create_table(payload: TableCreate, db: Session = Depends(get_db)):
    existing = db.query(DiningTable).filter(DiningTable.table_number == payload.table_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Table number already exists")
    table = DiningTable(**payload.model_dump())
    db.add(table)
    db.commit()
    db.refresh(table)
    return table


@app.patch("/api/tables/{table_id}", response_model=TableOut)
def update_table(table_id: int, payload: TableUpdate, db: Session = Depends(get_db)):
    table = db.query(DiningTable).filter(DiningTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    data = payload.model_dump(exclude_unset=True)
    for field, val in data.items():
        setattr(table, field, val)
    if data.get("status") == "available":
        table.active_order_id = None
    db.commit()
    db.refresh(table)
    return table


# ==================== ORDERS & KOT ENDPOINTS ====================
def _next_order_number(db: Session) -> str:
    last_order = db.query(Order).order_by(Order.id.desc()).first()
    next_seq = 1001 if not last_order else 1001 + last_order.id
    return f"PP-{next_seq}"


@app.get("/api/orders", response_model=List[OrderOut])
def list_orders(
    payment_status: Optional[str] = None,
    kot_status: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(Order).options(joinedload(Order.items))
    if payment_status:
        q = q.filter(Order.payment_status == payment_status)
    if kot_status:
        q = q.filter(Order.kot_status == kot_status)
    return q.order_by(Order.created_at.desc()).limit(limit).all()


@app.get("/api/kot", response_model=List[OrderOut])
def list_kot_orders(db: Session = Depends(get_db)):
    return (
        db.query(Order)
        .options(joinedload(Order.items))
        .order_by(Order.created_at.desc())
        .limit(60)
        .all()
    )


@app.get("/api/orders/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.post("/api/orders", response_model=OrderOut, status_code=201)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    table_obj = None
    if payload.order_type == "dine_in" and payload.table_id is not None:
        table_obj = db.query(DiningTable).filter(DiningTable.id == payload.table_id).first()
        if not table_obj:
            raise HTTPException(status_code=404, detail="Selected table not found")

    order_items = []
    subtotal = 0.0

    for item_in in payload.items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item_in.menu_item_id).first()
        if not menu_item:
            raise HTTPException(status_code=404, detail=f"Menu item {item_in.menu_item_id} not found")
        line_total = round(menu_item.price * item_in.quantity, 2)
        subtotal += line_total
        order_items.append(
            OrderItem(
                menu_item_id=menu_item.id,
                item_name=menu_item.name,
                unit_price=menu_item.price,
                quantity=item_in.quantity,
                subtotal=line_total,
                notes=item_in.notes,
            )
        )

    subtotal = round(subtotal, 2)
    discount_amount = round(subtotal * (payload.discount_percent / 100.0), 2)
    taxable = max(0.0, subtotal - discount_amount)
    tax_amount = round(taxable * (payload.tax_rate / 100.0), 2)
    total_amount = round(taxable + tax_amount, 2)

    order = Order(
        order_number=_next_order_number(db),
        order_type=payload.order_type,
        table_id=table_obj.id if table_obj else None,
        table_number=table_obj.table_number if table_obj else None,
        customer_name=payload.customer_name.strip() or "Walk-in Customer",
        customer_phone=payload.customer_phone.strip(),
        subtotal=subtotal,
        discount_percent=payload.discount_percent,
        discount_amount=discount_amount,
        tax_rate=payload.tax_rate,
        tax_amount=tax_amount,
        total_amount=total_amount,
        payment_method=payload.payment_method,
        payment_status=payload.payment_status,
        kot_status="pending",
        notes=payload.notes.strip(),
    )
    db.add(order)
    db.flush()

    for oi in order_items:
        oi.order_id = order.id
        db.add(oi)

    if table_obj:
        if payload.payment_status == "paid":
            table_obj.status = "available"
            table_obj.active_order_id = None
        else:
            table_obj.status = "occupied"
            table_obj.active_order_id = order.id

    db.commit()
    return db.query(Order).options(joinedload(Order.items)).filter(Order.id == order.id).first()


@app.patch("/api/orders/{order_id}/kot-status", response_model=OrderOut)
def update_kot_status(order_id: int, payload: KOTStatusUpdate, db: Session = Depends(get_db)):
    valid = {"pending", "preparing", "ready", "served"}
    if payload.kot_status not in valid:
        raise HTTPException(status_code=400, detail=f"kot_status must be one of {sorted(valid)}")
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.kot_status = payload.kot_status
    db.commit()
    db.refresh(order)
    return order


@app.patch("/api/orders/{order_id}/settle", response_model=OrderOut)
def settle_order(order_id: int, payload: OrderSettle, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if payload.discount_percent is not None:
        order.discount_percent = payload.discount_percent
        order.discount_amount = round(order.subtotal * (payload.discount_percent / 100.0), 2)
        taxable = max(0.0, order.subtotal - order.discount_amount)
        order.tax_amount = round(taxable * (order.tax_rate / 100.0), 2)
        order.total_amount = round(taxable + order.tax_amount, 2)

    order.payment_method = payload.payment_method
    order.payment_status = "paid"

    if order.table_id:
        table_obj = db.query(DiningTable).filter(DiningTable.id == order.table_id).first()
        if table_obj and table_obj.active_order_id == order.id:
            table_obj.status = "available"
            table_obj.active_order_id = None

    db.commit()
    db.refresh(order)
    return order


# ==================== INVENTORY ENDPOINTS ====================
@app.get("/api/inventory", response_model=List[InventoryOut])
def list_inventory(db: Session = Depends(get_db)):
    return db.query(InventoryItem).order_by(InventoryItem.category, InventoryItem.name).all()


@app.post("/api/inventory", response_model=InventoryOut, status_code=201)
def create_inventory_item(payload: InventoryCreate, db: Session = Depends(get_db)):
    existing = db.query(InventoryItem).filter(InventoryItem.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Inventory item already exists")
    item = InventoryItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.patch("/api/inventory/{item_id}", response_model=InventoryOut)
def update_inventory_item(item_id: int, payload: InventoryUpdate, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    for field, val in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, val)
    db.commit()
    db.refresh(item)
    return item


@app.post("/api/inventory/{item_id}/adjust", response_model=InventoryOut)
def adjust_inventory(item_id: int, payload: InventoryAdjust, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    item.quantity = round(max(0.0, item.quantity + payload.delta), 2)
    db.commit()
    db.refresh(item)
    return item


@app.delete("/api/inventory/{item_id}")
def delete_inventory_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    db.delete(item)
    db.commit()
    return {"deleted": True, "id": item_id}


# ==================== ANALYTICS ENDPOINT ====================
@app.get("/api/analytics")
def get_analytics(db: Session = Depends(get_db)):
    orders = db.query(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc()).all()
    tables = db.query(DiningTable).all()
    inventory = db.query(InventoryItem).all()

    paid_orders = [o for o in orders if o.payment_status == "paid"]
    total_revenue = round(sum(o.total_amount for o in paid_orders), 2)
    pending_revenue = round(sum(o.total_amount for o in orders if o.payment_status != "paid"), 2)
    total_orders = len(orders)
    avg_order_value = round(total_revenue / len(paid_orders), 2) if paid_orders else 0.0

    active_kots = sum(1 for o in orders if o.kot_status != "served")
    occupied_tables = sum(1 for t in tables if t.status != "available")
    low_stock_items = [i for i in inventory if i.quantity <= i.min_threshold]

    payment_breakdown = defaultdict(float)
    for o in paid_orders:
        payment_breakdown[o.payment_method] += o.total_amount

    order_type_counts = defaultdict(int)
    for o in orders:
        order_type_counts[o.order_type] += 1

    item_sales = defaultdict(lambda: {"quantity": 0, "revenue": 0.0})
    for o in orders:
        for oi in o.items:
            item_sales[oi.item_name]["quantity"] += oi.quantity
            item_sales[oi.item_name]["revenue"] += oi.subtotal

    top_items = sorted(
        [
            {"name": name, "quantity": data["quantity"], "revenue": round(data["revenue"], 2)}
            for name, data in item_sales.items()
        ],
        key=lambda x: x["revenue"],
        reverse=True,
    )[:8]

    return {
        "total_revenue": total_revenue,
        "pending_revenue": pending_revenue,
        "total_orders": total_orders,
        "paid_orders": len(paid_orders),
        "avg_order_value": avg_order_value,
        "active_kots": active_kots,
        "occupied_tables": occupied_tables,
        "total_tables": len(tables),
        "low_stock_count": len(low_stock_items),
        "payment_breakdown": {k: round(v, 2) for k, v in payment_breakdown.items()},
        "order_type_counts": dict(order_type_counts),
        "top_items": top_items,
    }
