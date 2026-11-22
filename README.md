# PetPuja POS — Full-Stack Restaurant Management System

A complete, ready-to-run Restaurant POS & Management System built with **FastAPI + SQLAlchemy** (Backend) and **React + TypeScript + Tailwind CSS + Vite** (Frontend). Runs out of the box with **SQLite locally** and is pre-configured for **Vercel + PostgreSQL (Supabase / Neon)** deployment.

## Core Modules
- **POS Billing Terminal:** Fast category filtering, Veg/Non-Veg filters, Dine-In / Takeaway / Delivery modes, table assignment, GST (5%) & discount calculations, KOT-only or instant bill settlement, and printable thermal receipts.
- **KOT (Kitchen Order Ticket) Display:** Live kitchen board to move tickets across `Pending → Preparing → Ready → Served`.
- **Table & Floor Management:** Visual table layout across sections (Main Hall, AC Hall, Garden) with real-time `Available`, `Occupied`, and `Billed` states.
- **Menu Management:** Add, update, toggle availability, or delete menu items.
- **Inventory Tracking:** Raw material stock tracking with low-stock threshold alerts and quick restock/consume controls.
- **Sales Analytics:** Daily revenue, total orders, average order value, payment method split, top-selling dishes, and order history.

---

## 1. Run Locally (Windows CMD / PowerShell / macOS / Linux)

### Step 1: Start the FastAPI Backend
Open Terminal 1:
```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:
- **Windows CMD:** `.venv\Scripts\activate`
- **Windows PowerShell:** `.venv\Scripts\Activate.ps1`
- **macOS/Linux:** `source .venv/bin/activate`

Install dependencies and start Uvicorn:
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```
- Backend API: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- A local SQLite database (`petpuja_pos.db`) is automatically created and seeded with sample Indian menu items, tables, inventory, and orders on first launch.

### Step 2: Start the React Frontend
Open Terminal 2:
```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```
*(On macOS/Linux, use `cp .env.example .env`)*
- Frontend App: `http://localhost:5173`

---

## 2. Configure PostgreSQL (Supabase or Neon)

1. Create a free PostgreSQL database on **Supabase** or **Neon**.
2. Copy the **Connection Pooling (Transaction/Pooled)** URI:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
   ```
3. Paste it into `backend/.env` as `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
   ALLOWED_ORIGINS=http://localhost:5173
   ```
4. Restart Uvicorn — SQLAlchemy automatically creates all tables and seeds initial data if the database is empty.

---

## 3. Deploy to Vercel (Two Separate Projects from One Repo)

Push this repository to GitHub, then import it **twice** in Vercel:

### Project A: Backend (`backend` root directory)
1. In Vercel, click **Add New Project** → select your GitHub repo.
2. Set **Root Directory** to `backend`.
3. Add Environment Variables:
   - `DATABASE_URL` = Your Supabase/Neon pooled PostgreSQL connection string.
   - `ALLOWED_ORIGINS` = `*` (update to your frontend Vercel URL once deployed).
4. Click **Deploy** and copy the deployed backend URL (e.g., `https://petpuja-api.vercel.app`).

### Project B: Frontend (`frontend` root directory)
1. Click **Add New Project** → select the same GitHub repo.
2. Set **Root Directory** to `frontend` (Framework Preset: **Vite**).
3. Add Environment Variable:
   - `VITE_API_URL` = `https://petpuja-api.vercel.app` (no trailing slash).
4. Click **Deploy**.
5. *(Recommended)* Update `ALLOWED_ORIGINS` in the Backend Vercel project to your Frontend Vercel URL and redeploy.
