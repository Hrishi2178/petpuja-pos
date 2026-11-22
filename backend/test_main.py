import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app
from seed import seed_database

TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)


@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=TEST_ENGINE)
    Base.metadata.create_all(bind=TEST_ENGINE)
    db = TestingSessionLocal()
    seed_database(db)
    db.close()

    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_health_and_seeded_menu(client):
    assert client.get("/api/health").status_code == 200
    menu = client.get("/api/menu").json()
    assert len(menu) >= 18


def test_dine_in_order_gst_kot_and_settle_lifecycle(client):
    menu = client.get("/api/menu").json()
    tables = client.get("/api/tables").json()
    free_table = next(t for t in tables if t["status"] == "available")
    dish = menu[0]  # unit price from seed

    # 1. Create unpaid dine-in order with 10% discount and 5% GST
    res = client.post(
        "/api/orders",
        json={
            "order_type": "dine_in",
            "table_id": free_table["id"],
            "customer_name": "Test Guest",
            "discount_percent": 10.0,
            "tax_rate": 5.0,
            "payment_method": "pending",
            "payment_status": "unpaid",
            "items": [{"menu_item_id": dish["id"], "quantity": 2, "notes": ""}],
        },
    )
    assert res.status_code == 201
    order = res.json()
    expected_subtotal = round(dish["price"] * 2, 2)
    expected_discount = round(expected_subtotal * 0.10, 2)
    expected_tax = round((expected_subtotal - expected_discount) * 0.05, 2)
    assert order["total_amount"] == round(expected_subtotal - expected_discount + expected_tax, 2)

    # Verify table is now occupied
    updated_table = next(t for t in client.get("/api/tables").json() if t["id"] == free_table["id"])
    assert updated_table["status"] == "occupied"

    # 2. Invalid KOT status should return 400
    bad_kot = client.patch(f"/api/orders/{order['id']}/kot-status", json={"kot_status": "invalid"})
    assert bad_kot.status_code == 400

    # 3. Valid KOT update
    ok_kot = client.patch(f"/api/orders/{order['id']}/kot-status", json={"kot_status": "ready"})
    assert ok_kot.status_code == 200
    assert ok_kot.json()["kot_status"] == "ready"

    # 4. Settle order and verify table releases
    settle = client.patch(f"/api/orders/{order['id']}/settle", json={"payment_method": "upi"})
    assert settle.status_code == 200
    assert settle.json()["payment_status"] == "paid"

    released_table = next(t for t in client.get("/api/tables").json() if t["id"] == free_table["id"])
    assert released_table["status"] == "available"


def test_inventory_floor_at_zero(client):
    inv = client.get("/api/inventory").json()
    item_id = inv[0]["id"]
    res = client.post(f"/api/inventory/{item_id}/adjust", json={"delta": -9999})
    assert res.status_code == 200
    assert res.json()["quantity"] == 0.0