from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ---------- Menu ----------
class MenuItemBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    category: str = Field(..., min_length=1, max_length=60)
    price: float = Field(..., ge=0)
    is_veg: bool = True
    is_available: bool = True
    description: str = ""


class MenuItemCreate(MenuItemBase):
    pass


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = Field(default=None, ge=0)
    is_veg: Optional[bool] = None
    is_available: Optional[bool] = None
    description: Optional[str] = None


class MenuItemOut(MenuItemBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# ---------- Tables ----------
class TableCreate(BaseModel):
    table_number: str = Field(..., min_length=1, max_length=20)
    section: str = "Main Hall"
    capacity: int = Field(default=4, ge=1, le=30)


class TableUpdate(BaseModel):
    section: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=1, le=30)
    status: Optional[str] = None
    active_order_id: Optional[int] = None


class TableOut(BaseModel):
    id: int
    table_number: str
    section: str
    capacity: int
    status: str
    active_order_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)


# ---------- Orders & KOT ----------
class OrderItemInput(BaseModel):
    menu_item_id: int
    quantity: int = Field(..., ge=1)
    notes: str = ""


class OrderCreate(BaseModel):
    order_type: str = "dine_in"  # dine_in | takeaway | delivery
    table_id: Optional[int] = None
    customer_name: str = "Walk-in Customer"
    customer_phone: str = ""
    discount_percent: float = Field(default=0.0, ge=0, le=100)
    tax_rate: float = Field(default=5.0, ge=0, le=28)
    payment_method: str = "pending"  # cash | upi | card | pending
    payment_status: str = "unpaid"   # unpaid | paid
    notes: str = ""
    items: List[OrderItemInput] = Field(..., min_length=1)


class OrderItemOut(BaseModel):
    id: int
    menu_item_id: Optional[int]
    item_name: str
    unit_price: float
    quantity: int
    subtotal: float
    notes: str
    model_config = ConfigDict(from_attributes=True)


class OrderOut(BaseModel):
    id: int
    order_number: str
    order_type: str
    table_id: Optional[int]
    table_number: Optional[str]
    customer_name: str
    customer_phone: str
    subtotal: float
    discount_percent: float
    discount_amount: float
    tax_rate: float
    tax_amount: float
    total_amount: float
    payment_method: str
    payment_status: str
    kot_status: str
    notes: str
    created_at: datetime
    items: List[OrderItemOut] = []
    model_config = ConfigDict(from_attributes=True)


class KOTStatusUpdate(BaseModel):
    kot_status: str  # pending | preparing | ready | served


class OrderSettle(BaseModel):
    payment_method: str  # cash | upi | card
    discount_percent: Optional[float] = Field(default=None, ge=0, le=100)


# ---------- Inventory ----------
class InventoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    category: str = "General"
    quantity: float = Field(..., ge=0)
    unit: str = "kg"
    min_threshold: float = Field(default=5.0, ge=0)
    cost_per_unit: float = Field(default=0.0, ge=0)


class InventoryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = Field(default=None, ge=0)
    unit: Optional[str] = None
    min_threshold: Optional[float] = Field(default=None, ge=0)
    cost_per_unit: Optional[float] = Field(default=None, ge=0)


class InventoryAdjust(BaseModel):
    delta: float


class InventoryOut(BaseModel):
    id: int
    name: str
    category: str
    quantity: float
    unit: str
    min_threshold: float
    cost_per_unit: float
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
