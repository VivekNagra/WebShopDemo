# Pippali - Restaurant System

Welcome to the Pippali codebase! This is the full stack system for our restaurant, including the website, admin panel, and POS system.

## Project Structure

We have three main parts here:

*   **`PippaliSystem/web`**: The main website and Admin Panel (Next.js).
*   **`PippaliSystem/pos-app`**: The iPad POS app for our staff (React Native / Expo).
*   **`PippaliSystem/backend`**: The API that powers everything (FastAPI + PostgreSQL).

## How to Run Everything

You'll need three terminal windows open to run the full system.

### 1. The Backend (API)
This needs to be running for anything else to work.

```bash
cd PippaliSystem/backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*   API Docs will be at: `http://localhost:8000/docs`

### 2. The Website & Admin Panel
This is what customers see, and where we manage the menu.

```bash
cd PippaliSystem/web
npm run dev
```
*   Website: `http://localhost:3000`
*   Admin Panel: `http://localhost:3000/admin`

### 3. The POS App
This is for the iPad in the restaurant.

```bash
cd PippaliSystem/pos-app
npx expo start
```
*   Scan the QR code with your phone or use an iOS Simulator.

## Key Features

*   **Menu Management**: Add items, categories, and options (like "Extra Rice" or "Spiciness") in the Admin Panel.
*   **Dish Types**: We tag items as Chicken, Lamb, Veg, Soda, Lassi, etc. for better reporting.
*   **Live Orders**: Orders from the POS are sent instantly to the kitchen (backend).

## Need Help?
If you see a "Network Error", make sure the Backend is running! That's usually the culprit.
