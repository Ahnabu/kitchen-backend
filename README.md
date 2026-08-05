# 🍽️ The Kitchen Malta — Backend API Integration Guide

Welcome to the backend API documentation for **The Kitchen Malta**! This guide is tailored for frontend developers integrating the React application with the Express REST API and Socket.IO server.

---

## ⚙️ Development Setup

- **API Base URL**: `http://localhost:3000/api/v1`
- **Socket.IO Server**: `http://localhost:3000`
- **Static Assets Folder**: `http://localhost:3000/uploads/` (images for menu, gallery, and user avatars)
- **Local Database**: Persistent SQLite (`backend/database.sqlite`) is used for local development out-of-the-box. It seeds itself automatically on first run.

---

## 🔐 Authentication & Session Flow

The API utilizes role-based JWT authentication (`customer` and `admin` roles).
- **Access Tokens**: Short-lived (15 minutes). Send in request headers as a Bearer token:
  ```http
  Authorization: Bearer <accessToken>
  ```
- **Refresh Tokens**: Long-lived (7 days). Stored in a secure `httpOnly` cookie (`refreshToken`). To support refresh tokens, Axios requests **MUST** include credentials:
  ```javascript
  axios.defaults.withCredentials = true;
  ```

### Authentication Endpoints

#### 1. Register User
`POST /auth/register` (Public)
* **Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "phone": "99112233" // Optional (8 to 20 digits)
  }
  ```
* **Response (201)**: Returns the user object, an access token, and sets the `refreshToken` cookie.
* *Note*: Registering automatically grants **500 starting loyalty points**!

#### 2. Login User
`POST /auth/login` (Public)
* **Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
* **Response (200)**: Returns user info and access token; sets the `refreshToken` cookie.

#### 3. Refresh Access Token
`POST /auth/refresh` (Public)
* **Credentials**: Must send the `refreshToken` cookie (Axios credentials active).
* **Response (200)**: Returns a fresh `accessToken`.
* *Frontend Tip*: Set up an Axios interceptor to capture `401 Unauthorized` responses, hit this endpoint, update your token, and retry the original request.

#### 4. Logout User
`POST /auth/logout` (Public)
* **Response (200)**: Clears the `refreshToken` cookie.

---

## 🍽️ Menu Items

`GET /menu` (Public)
* **Query Parameters (Optional)**:
  - `category`: `burgers` | `pizzas` | `wraps` | `sides` | `smokehouse`
  - `diet`: `veg` | `non-veg` | `vegan`
  - `search`: Search text (matches item name and description)
* **Response (200)**: List of filtered menu items.

`GET /menu/popular` (Public)
* **Response (200)**: List of items flagged as `popular`.

`GET /menu/:id` (Public)
* **Response (200)**: Single menu item detail.

---

## 🛒 Order Placement & Tracking

### 1. Place Order
`POST /orders` (Public/Authenticated)
* **Headers**: Optional `Authorization` token. If logged in, order logs loyalty points (2.5 points per €1 spent).
* **Body**:
  ```json
  {
    "customerName": "John Doe",
    "customerPhone": "99112233",
    "customerEmail": "john@example.com",
    "paymentMethod": "cash" | "card" | "revolut",
    "deliveryAddress": "12, Triq San Gorg",
    "deliveryArea": "Sliema",
    "deliveryCity": "Malta",
    "deliveryFee": 2.50,
    "subtotal": 35.00,
    "total": 37.50,
    "specialInstructions": "Leave at front door", // Optional
    "items": [
      {
        "menuItemId": "burger-bbq",
        "quantity": 2
      }
    ]
  }
  ```
* **Response (210)**: Returns order details, a unique order reference code `orderRef` (e.g. `TK-2847`), and calculated `loyaltyPointsEarned` (if authenticated).

### 2. Public Track Order
`GET /orders/:ref` (Public)
* **Param**: Order reference code (e.g., `TK-2847`).
* **Response (200)**: Complete order details, status history, estimated minutes, and items.

---

## 📡 Socket.IO Real-time Tracking

For real-time delivery status updates, connect your client to the server:

### Connection & Join
1. Connect using Socket.IO client:
   ```javascript
   import { io } from 'socket.io-client';
   const socket = io('http://localhost:3000');
   ```
2. When the user lands on the tracking page for `TK-2847`, join the order room:
   ```javascript
   socket.emit('join_order', { orderRef: 'TK-2847' });
   ```

### Status Event Listener
Listen for the `order:updated` event to update your UI maps and progress bars in real-time:
```javascript
socket.on('order:updated', (data) => {
  console.log('Status updated:', data.status); // confirmed -> preparing -> quality -> delivery -> delivered
  console.log('Estimated minutes:', data.estimatedMinutes);
  console.log('Rider Name:', data.riderName);
});
```

---

## 📅 Reservations Booking

`POST /reservations` (Public/Authenticated)
* **Headers**: Optional `Authorization` token.
* **Body**:
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "99887766",
    "date": "2026-08-25", // YYYY-MM-DD
    "time": "7:30 PM",
    "guests": "4" | "10+",
    "seating": "indoor" | "outdoor" | "private",
    "occasion": "Anniversary", // Optional
    "notes": "Need high chair" // Optional
  }
  ```
* **Response (201)**: Returns reservation details and a unique booking reference code `ref` (e.g., `RES-4827`).

`GET /reservations/:ref` (Public/Auth)
* **Response (200)**: Detailed reservation status (e.g. `pending`, `confirmed`, `cancelled`).

---

## 👤 Customer Dashboard & Addresses

All endpoints below require a valid `Authorization: Bearer <accessToken>` header.

### 1. User Profile & Avatar
- `GET /users/me` — Gets profile details, email verification status, and loyalty tier.
- `PUT /users/me` — Update profile metadata:
  ```json
  {
    "name": "John Updated",
    "phone": "99334455",
    "newsletterSubscribed": true
  }
  ```
- `PUT /users/me/avatar` — Upload profile photo. Send as `multipart/form-data` with field key `avatar`.
- `GET /users/me/orders` — Paginated list of order history for the logged-in user.

### 2. Saved Address Book
- `GET /users/me/addresses` — Lists all saved addresses (sorted by default address first).
- `POST /users/me/addresses` — Creates a new saved address:
  ```json
  {
    "label": "Home" | "Work" | "Other",
    "address": "15, St. George Street",
    "area": "Sliema",
    "city": "Malta",
    "isDefault": true // If true, automatically removes default flag from other addresses
  }
  ```
- `PUT /users/me/addresses/:id` — Edit an address by ID (supports default toggling).
- `DELETE /users/me/addresses/:id` — Removes an address.

### 3. Loyalty Account & Redemption
- `GET /users/me/loyalty` — Returns:
  - `points`: Current point balance.
  - `tier`: `silver` | `gold` | `platinum`.
  - `tierProgress`: Progress percentage (0–100) towards the next tier.
  - `nextTierName`: Next tier name.
  - `pointsToNextTier`: Remaining points required to level up.
  - `history`: List of all transactions (points earned from orders, sign-up bonus, and redemptions).
- `POST /users/me/loyalty/redeem` — Redeems points:
  - **Body**: `{ "points": 500 }` (Enforces a **minimum threshold of 500 points**).
  - *Tiers/Benefits*: 500 points = €5 discount, 1000 points = €12 discount.

---

## ⭐ Dish Reviews

- `GET /reviews` — Public reviews list (displays only **approved/published** reviews). Supports `?rating=&page=&limit=` queries.
- `POST /reviews` — Submit review. Reviews default to `pending` until approved by an admin. If submitted with an auth header, the review is marked `verified` automatically.
  ```json
  {
    "name": "John Reviewer", // Optional if logged in (will pull name from profile)
    "rating": 5, // 1 to 5
    "dish": "Smokehouse BBQ Burger",
    "text": "The meat was incredibly smoky and tender. Best burger on the island!"
  }
  ```

---

## ✉️ Contact Forms & Newsletter

- `POST /contact` — Send a contact/enquiry query (saves with status `new`).
  ```json
  {
    "name": "Alex",
    "email": "alex@example.com",
    "subject": "Catering Inquiry",
    "message": "Do you provide off-site catering services for weddings?"
  }
  ```
- `POST /newsletter/subscribe` — Subscribe an email to the mailing list.
  - *Note*: If the email was previously unsubscribed, this endpoint reactivates it seamlessly.
- `POST /newsletter/unsubscribe` — Unsubscribe an email from the newsletter.

---

## 🖼️ Photo Gallery

- `GET /gallery` — Returns active gallery images sorted by `sortOrder`.
- **Query Parameter (Optional)**: `?category=Food | Smokehouse | Drinks | Interior | Ambience`

---

## 📈 Administrative Dashboard (Admin Role Required)

Endpoints below require `Authorization: Bearer <accessToken>` and the user must have `role: 'admin'`.

### 1. Inventory Control
- `GET /inventory` — Roster of ingredient items.
- `GET /inventory/alerts` — Lists only items that are `low` or `critical` stock.
- `POST /inventory` — Creates new inventory item (calculates status).
- `PUT /inventory/:id` — Adjusts stock quantities (automatically triggers status updates: `ok`, `low`, or `critical`).

### 2. Staff Scheduling
- `GET /staff` — Lists all staff roster details.
- `POST /staff` — Creates new staff roster record (role, shift details, duty status).
- `PUT /staff/:id` — Toggles duty status (`on-duty` / `off-duty`) or edits shift schedules.

### 3. Business Analytics
- `GET /analytics/overview` — Today's totals dashboard:
  ```json
  {
    "status": "success",
    "data": {
      "revenueToday": 150.00, // Delivered orders total revenue
      "ordersToday": 15,      // Total orders count today
      "coversTonight": 42,    // Total guests booked today
      "averageRating": 4.8    // Average published review score
    }
  }
}
  ```
- `GET /analytics/weekly` — Groups delivered revenue and order counts for the last 7 calendar days.
- `GET /analytics/top-dishes` — Groups order item sales and ranks top 5 ordered items by total quantity sold.
