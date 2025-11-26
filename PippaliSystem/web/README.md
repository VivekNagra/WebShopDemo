# Pippali Web & Admin

This is the customer-facing website and admin dashboard built with Next.js.

## Setup

1.  **Navigate to web:**
    ```bash
    cd PippaliSystem/web
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

*   **Landing Page:** Welcome screen with links.
*   **Order Online (`/order`):**
    *   Browse menu (fetched from backend).
    *   Add to cart.
    *   Submit takeaway orders.
*   **Admin Panel (`/admin/menu`):**
    *   View all menu items.
    *   Add new menu items (CRUD).

## Configuration

*   **API URL:** Configured in `src/lib/api.js`.
    *   Default: `http://localhost:8000/api/v1`.
