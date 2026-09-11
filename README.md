# Azimar Shipping & Logistics (LogisticsPro)

A comprehensive, full-stack logistics and supply chain management platform/simulation designed to connect customers, suppliers, and transporters through a unified interface. This system streamlines shipment tracking, job delegation, and user management using a secure, role-based architecture.

## 🚀 Key Features

*   **Role-Based Access Control (RBAC):** Distinct dashboards and permission levels for 4 user types: Admins, Customers, Suppliers, and Transporters.
*   **Secure Authentication:** Custom registration and login system utilizing stateless JSON Web Tokens (JWT) and `bcryptjs` for secure password hashing.
*   **Real-Time Shipment Tracking:** Customers can create shipments, which are then assigned to Suppliers and eventually picked up by Transporters.
*   **Transporter Workflow:** Transporters have a dedicated interface to view available jobs, accept them, and update live statuses to "In Transit" or "Delivered" (with automated timestamping).
*   **Admin Dashboard & Reporting:** Admins can approve or deny pending user registrations, manage all active shipments, and generate date-based analytical reports on shipment statuses.
*   **RESTful API:** A fully modular Express.js backend with protected routing via custom JWT middleware.

## 🛠️ Tech Stack

**Frontend:**
*   HTML5, CSS3, Vanilla JavaScript (ES6)
*   Custom CSS Grid/Flexbox layouts with role-specific dashboards

**Backend:**
*   **Runtime:** Node.js
*   **Framework:** Express.js (`cors`, `express.json`)
*   **Database:** PostgreSQL (using the `pg` package for connection pooling)
*   **Security:** `jsonwebtoken`, `bcryptjs`

---

## ⚙️ Local Setup & Installation Instructions

Follow these steps to configure, run, and test the platform on your local machine.

### 1. Prerequisites
*   [Node.js](https://nodejs.org/) (v14 or higher recommended)
*   [PostgreSQL](https://www.postgresql.org/) installed and running locally.

### 2. Clone the Repository & Install Dependencies
Navigate to your preferred directory and install the required Node modules:
```bash
git clone [https://github.com/bilalkhan30/shipping-logistics-backend.git](https://github.com/bilalkhan30/shipping-logistics-backend.git)
cd shipping-logistics-backend
npm install
```
*(This will install `express`, `pg`, `bcryptjs`, `jsonwebtoken`, `cors`, and `dotenv`).*

### 3. Database Configuration
You must create a PostgreSQL database named `logistics_db` and establish the required tables. 

Open your PostgreSQL terminal (psql) or pgAdmin and execute the following SQL schema based on the backend queries:

```sql
CREATE DATABASE logistics_db;

\c logistics_db;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    user_role VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shipments (
    id SERIAL PRIMARY KEY,
    tracking_id VARCHAR(50),
    requester_id INT REFERENCES users(id),
    requester_name VARCHAR(255),
    requester_phone VARCHAR(50),
    requester_role VARCHAR(50),
    origin VARCHAR(255),
    destination VARCHAR(255),
    supplier_name VARCHAR(255),
    item_description TEXT,
    shipment_type VARCHAR(50),
    quantity INT,
    weight_kg DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'Pending',
    transporter_id INT REFERENCES users(id),
    accepted_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Environment Variables
Create a `.env` file in the root of your project directory and add your PostgreSQL connection string and a secret key for JWT.

```env
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/logistics_db"
JWT_SECRET="YOUR_SUPER_SECRET_KEY_GOES_HERE"
PORT=5000
```
*Note: Update `YOUR_PASSWORD` to match your local PostgreSQL setup.*

### 5. Running the Application
The project includes `nodemon` for active development. Start the Express server:

```bash
npx nodemon index.js
```
You should see: `Server is running on port 5000`.

### 6. Launching the Frontend
Since the frontend uses vanilla HTML/JS, it is entirely decoupled from the backend rendering. 
*   Simply open `index.html` in your web browser. 
*   Alternatively, use the VS Code "Live Server" extension to serve the frontend on `http://127.0.0.1:5500`.

---

## 👥 Usage Guide & Role Testing

Because new users default to a `pending` status, you must manually create your first Admin user to access the dashboard and approve others.

1.  **Create an Admin:**
    *   Go to the `signup.html` page and create a new account.
    *   Open your PostgreSQL database and manually set your user role to admin and status to active:
        `UPDATE users SET user_role = 'admin', status = 'active' WHERE email = 'your_email@example.com';`
2.  **Approve New Users:**
    *   Log in via `login.html` with your Admin account.
    *   Navigate to **Manage Users** in the dashboard sidebar to approve pending Customers, Suppliers, and Transporters so they can access the platform.
3.  **Simulate the Supply Chain:**
    *   Log in as a **Customer** to create a new shipment.
    *   Log in as a **Transporter** to view "Available Jobs", accept a shipment, and update its status to "In Transit" or "Delivered".

## 👨‍💻 Author
**Bilal Khan**
