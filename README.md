# Azimar: Shipping & Logistics Platform

Azimar is a full-stack logistics and supply chain management web application. The platform streamlines international cargo tracking, order placement, and fleet operations by providing tailored, role-specific workflows for different stakeholders in the shipping ecosystem.

## 🚀 Key Features

* **Role-Based Access Control (RBAC):** Tailored, separate dashboard interfaces for 4 distinct user roles: **Admin, Customer, Supplier, and Transporter**.
* **Secure Authentication:** Implemented stateless **JWT (JSON Web Tokens)** via backend middleware for secure user login, route protection, and session management.
* **Relational Database Design:** A normalized **PostgreSQL** schema engineered to map complex supply chain tracking, order states, and user relationships efficiently.
* **Cross-Origin Configuration:** Configured CORS to securely handle requests between the client frontend and the Express API.

## 🛠️ Tech Stack & Dependencies

**Frontend:**
* HTML5, CSS3, JavaScript (ES6)

**Backend Core:**
* Node.js
* Express.js (`express` v5.1.0)

**Database:**
* PostgreSQL
* Node-Postgres (`pg`)

**Security & Utilities:**
* Authentication: `jsonwebtoken`
* Password Hashing: `bcryptjs`
* Middleware: `cors`
* Environment Configuration: `dotenv`
* Development Tools: `nodemon`

## 📁 Project Structure

* `/admin` - Contains admin-specific sub-modules and dashboards.
* `/middleware` - Custom Express.js middleware executing JWT token validation and route guarding.
* `/routes` - Organized API endpoints handling business logic split across application resources.
* `/css` & `/js` - Client-side static assets controlling presentation and dynamic DOM rendering.
* `db.js` - Centralized PostgreSQL connection pool management module.
* `index.js` - Main entry point configuring the Express server, global middleware, and server initialization.

## ⚙️ Installation & Setup

1. **Clone the repository:**
```bash
   git clone https://github.com/bilalkhan30/Shipping-Logistics-Management-Website.git
   cd Shipping-Logistics-Management-Website
