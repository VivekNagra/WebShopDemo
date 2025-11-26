# Pippali POS App

This is the staff-facing POS application built with React Native and Expo.

## Setup

1.  **Navigate to pos-app:**
    ```bash
    cd PippaliSystem/pos-app
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run App:**
    ```bash
    npm start
    ```
    *   Press `a` for Android Emulator.
    *   Press `i` for iOS Simulator.
    *   Scan QR code with Expo Go app on physical device.

## Configuration

*   **API URL:** Configured in `src/api/client.js`.
    *   Default: `http://localhost:8000/api/v1` (iOS) or `http://10.0.2.2:8000/api/v1` (Android).
    *   **Physical Device:** Change to your computer's local IP address (e.g., `http://192.168.1.x:8000/api/v1`).

## Features

*   **Menu Grid:** Browse items fetched from the backend.
*   **Order Ticket:** Add/remove items, view total.
*   **Submit Order:** Sends order to the backend API.
