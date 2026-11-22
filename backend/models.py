from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from database import Base


def utc_now():
    return datetime.now(timezone.utc)


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False, index=True)
    category = Column(String(60), nullable=False, index=True)
    price = Column(Float, nullable=False)
    is_veg = Column(Boolean, default=True, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    description = Column(String(255), default="")


class DiningTable(Base):
    __tablename__ = "dining_tables"

    id = Column(Integer, primary_key=True, index=True)
    table_number = Column(String(20), unique=True, nullable=False, index=True)
    section = Column(String(60), default="Main Hall", nullable=False)
    capacity = Column(Integer, default=4, nullable=False)
    status = Column(String(20), default="available", nullable=False)  # available | occupied | billed
    active_order_id = Column(Integer, nullable=True)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(30), unique=True, nullable=False, index=True)
    order_type = Column(String(20), default="dine_in", nullable=False)  # dine_in | takeaway | delivery
    table_id = Column(Integer, ForeignKey("dining_tables.id"), nullable=True)
    table_number = Column(String(20), nullable=True)
    customer_name = Column(String(120), default="Walk-in Customer")
    customer_phone = Column(String(30), default="")
    subtotal = Column(Float, default=0.0, nullable=False)
    discount_percent = Column(Float, default=0.0, nullable=False)
    discount_amount = Column(Float, default=0.0, nullable=False)
    tax_rate = Column(Float, default=5.0, nullable=False)
    tax_amount = Column(Float, default=0.0, nullable=False)
    total_amount = Column(Float, default=0.0, nullable=False)
    payment_method = Column(String(20), default="pending", nullable=False)  # cash | upi | card | pending
    payment_status = Column(String(20), default="unpaid", nullable=False)   # unpaid | paid
    kot_status = Column(String(20), default="pending", nullable=False)      # pending | preparing | ready | served
    notes = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"), nullable=True)
    item_name = Column(String(120), nullable=False)
    unit_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Float, nullable=False)
    notes = Column(String(200), default="")

    order = relationship("Order", back_populates="items")


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False, index=True)
    category = Column(String(60), default="General", nullable=False)
    quantity = Column(Float, default=0.0, nullable=False)
    unit = Column(String(20), default="kg", nullable=False)
    min_threshold = Column(Float, default=5.0, nullable=False)
    cost_per_unit = Column(Float, default=0.0, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
