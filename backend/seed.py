from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from models import DiningTable, InventoryItem, MenuItem, Order, OrderItem


def seed_database(db: Session) -> None:
    if db.query(MenuItem).count() == 0:
        menu_items = [
            MenuItem(name="Paneer Tikka", category="Starters", price=260, is_veg=True, description="Char-grilled cottage cheese cubes in spiced yogurt marinade"),
            MenuItem(name="Crispy Veg Manchurian", category="Starters", price=210, is_veg=True, description="Golden veg dumplings tossed in tangy garlic soy sauce"),
            MenuItem(name="Hara Bhara Kabab", category="Starters", price=190, is_veg=True, description="Spinach and green pea patties served with mint chutney"),
            MenuItem(name="Chicken Tandoori (Half)", category="Starters", price=320, is_veg=False, description="Smoky clay-oven roasted chicken with Indian spices"),
            MenuItem(name="Paneer Butter Masala", category="Main Course", price=290, is_veg=True, description="Rich tomato-cashew butter gravy with soft paneer cubes"),
            MenuItem(name="Dal Makhani", category="Main Course", price=240, is_veg=True, description="Slow-simmered black lentils finished with cream and butter"),
            MenuItem(name="Veg Kolhapuri", category="Main Course", price=250, is_veg=True, description="Spicy mixed vegetable curry in roasted coconut-masala gravy"),
            MenuItem(name="Butter Chicken", category="Main Course", price=360, is_veg=False, description="Classic tandoori chicken simmered in velvety makhani sauce"),
            MenuItem(name="Butter Naan", category="Breads", price=55, is_veg=True, description="Soft tandoor-baked flatbread brushed with salted butter"),
            MenuItem(name="Garlic Naan", category="Breads", price=70, is_veg=True, description="Tandoori naan topped with roasted garlic and coriander"),
            MenuItem(name="Tandoori Roti", category="Breads", price=35, is_veg=True, description="Whole-wheat crisp clay-oven roti"),
            MenuItem(name="Hyderabadi Veg Biryani", category="Rice & Biryani", price=260, is_veg=True, description="Fragrant basmati rice dum-cooked with saffron and spices"),
            MenuItem(name="Chicken Dum Biryani", category="Rice & Biryani", price=330, is_veg=False, description="Aromatic long-grain biryani served with raita"),
            MenuItem(name="Jeera Rice", category="Rice & Biryani", price=160, is_veg=True, description="Steamed basmati rice tempered with roasted cumin seeds"),
            MenuItem(name="Fresh Lime Soda", category="Beverages", price=80, is_veg=True, description="Chilled sparkling lime drink (sweet / salted)"),
            MenuItem(name="Mango Lassi", category="Beverages", price=110, is_veg=True, description="Creamy yogurt smoothie blended with Alphonso mango"),
            MenuItem(name="Masala Chai", category="Beverages", price=45, is_veg=True, description="Freshly brewed cardamom and ginger Indian tea"),
            MenuItem(name="Gulab Jamun (2 pcs)", category="Desserts", price=100, is_veg=True, description="Warm khoya dumplings soaked in rose-cardamom syrup"),
        ]
        db.add_all(menu_items)
        db.commit()

    if db.query(DiningTable).count() == 0:
        tables = [
            DiningTable(table_number="T1", section="Main Hall", capacity=4, status="available"),
            DiningTable(table_number="T2", section="Main Hall", capacity=4, status="available"),
            DiningTable(table_number="T3", section="Main Hall", capacity=2, status="available"),
            DiningTable(table_number="T4", section="Main Hall", capacity=6, status="available"),
            DiningTable(table_number="A1", section="AC Hall", capacity=4, status="available"),
            DiningTable(table_number="A2", section="AC Hall", capacity=4, status="available"),
            DiningTable(table_number="A3", section="AC Hall", capacity=6, status="available"),
            DiningTable(table_number="A4", section="AC Hall", capacity=8, status="available"),
            DiningTable(table_number="G1", section="Garden", capacity=4, status="available"),
            DiningTable(table_number="G2", section="Garden", capacity=6, status="available"),
        ]
        db.add_all(tables)
        db.commit()

    if db.query(InventoryItem).count() == 0:
        inventory = [
            InventoryItem(name="Fresh Paneer", category="Dairy", quantity=4.0, unit="kg", min_threshold=5.0, cost_per_unit=340),
            InventoryItem(name="Basmati Rice", category="Grains", quantity=28.0, unit="kg", min_threshold=10.0, cost_per_unit=110),
            InventoryItem(name="Amul Butter", category="Dairy", quantity=2.5, unit="kg", min_threshold=3.0, cost_per_unit=540),
            InventoryItem(name="Refined Sunflower Oil", category="Oils", quantity=18.0, unit="L", min_threshold=8.0, cost_per_unit=145),
            InventoryItem(name="Fresh Chicken", category="Meat", quantity=9.5, unit="kg", min_threshold=5.0, cost_per_unit=240),
            InventoryItem(name="Tomatoes", category="Produce", quantity=14.0, unit="kg", min_threshold=6.0, cost_per_unit=40),
            InventoryItem(name="Onions", category="Produce", quantity=22.0, unit="kg", min_threshold=10.0, cost_per_unit=35),
            InventoryItem(name="Whole Wheat Flour (Atta)", category="Grains", quantity=16.0, unit="kg", min_threshold=8.0, cost_per_unit=48),
            InventoryItem(name="Garam Masala Blend", category="Spices", quantity=1.2, unit="kg", min_threshold=1.5, cost_per_unit=650),
            InventoryItem(name="Fresh Cream", category="Dairy", quantity=6.0, unit="L", min_threshold=3.0, cost_per_unit=220),
        ]
        db.add_all(inventory)
        db.commit()

    if db.query(Order).count() == 0:
        menu_map = {m.name: m for m in db.query(MenuItem).all()}
        t1 = db.query(DiningTable).filter(DiningTable.table_number == "T1").first()
        a1 = db.query(DiningTable).filter(DiningTable.table_number == "A1").first()
        now = datetime.now(timezone.utc)

        # Sample paid order 1
        p1_items = [
            (menu_map["Paneer Butter Masala"], 1),
            (menu_map["Butter Naan"], 3),
            (menu_map["Fresh Lime Soda"], 2),
        ]
        sub1 = sum(m.price * q for m, q in p1_items)
        tax1 = round(sub1 * 0.05, 2)
        ord1 = Order(
            order_number="PP-1001",
            order_type="dine_in",
            table_id=t1.id if t1 else None,
            table_number="T1",
            customer_name="Aarav Deshmukh",
            subtotal=sub1,
            tax_rate=5.0,
            tax_amount=tax1,
            total_amount=round(sub1 + tax1, 2),
            payment_method="upi",
            payment_status="paid",
            kot_status="served",
            created_at=now - timedelta(hours=2, minutes=15),
        )
        db.add(ord1)
        db.flush()
        for m, q in p1_items:
            db.add(OrderItem(order_id=ord1.id, menu_item_id=m.id, item_name=m.name, unit_price=m.price, quantity=q, subtotal=m.price * q))

        # Sample paid takeaway order 2
        p2_items = [
            (menu_map["Chicken Dum Biryani"], 2),
            (menu_map["Gulab Jamun (2 pcs)"], 1),
        ]
        sub2 = sum(m.price * q for m, q in p2_items)
        tax2 = round(sub2 * 0.05, 2)
        ord2 = Order(
            order_number="PP-1002",
            order_type="takeaway",
            customer_name="Sneha Kulkarni",
            subtotal=sub2,
            tax_rate=5.0,
            tax_amount=tax2,
            total_amount=round(sub2 + tax2, 2),
            payment_method="card",
            payment_status="paid",
            kot_status="served",
            created_at=now - timedelta(hours=1, minutes=5),
        )
        db.add(ord2)
        db.flush()
        for m, q in p2_items:
            db.add(OrderItem(order_id=ord2.id, menu_item_id=m.id, item_name=m.name, unit_price=m.price, quantity=q, subtotal=m.price * q))

        # Active KOT order on table A1 (preparing)
        p3_items = [
            (menu_map["Paneer Tikka"], 1),
            (menu_map["Dal Makhani"], 1),
            (menu_map["Garlic Naan"], 2),
            (menu_map["Mango Lassi"], 2),
        ]
        sub3 = sum(m.price * q for m, q in p3_items)
        tax3 = round(sub3 * 0.05, 2)
        ord3 = Order(
            order_number="PP-1003",
            order_type="dine_in",
            table_id=a1.id if a1 else None,
            table_number="A1",
            customer_name="Rohan Patil",
            subtotal=sub3,
            tax_rate=5.0,
            tax_amount=tax3,
            total_amount=round(sub3 + tax3, 2),
            payment_method="pending",
            payment_status="unpaid",
            kot_status="preparing",
            notes="Less spicy for Dal Makhani",
            created_at=now - timedelta(minutes=14),
        )
        db.add(ord3)
        db.flush()
        for m, q in p3_items:
            db.add(OrderItem(order_id=ord3.id, menu_item_id=m.id, item_name=m.name, unit_price=m.price, quantity=q, subtotal=m.price * q))

        if a1:
            a1.status = "occupied"
            a1.active_order_id = ord3.id

        db.commit()
