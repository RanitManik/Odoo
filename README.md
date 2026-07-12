# AssetFlow (Hackathon Project)

**AssetFlow** is a modern, brutalist-designed Enterprise Asset & Resource Management System. It simplifies and digitizes how organizations track, allocate, and maintain their physical assets and shared resources through a centralized ERP platform.

This project was built from scratch to perfectly address the hackathon problem statement, featuring a clean architecture, strict role-based workflows, and a completely responsive and accessible UI.

## 🏆 Feature Completion Checklist

All requirements from the problem statement have been meticulously implemented:

- [x] **Login / Signup:** Secure authentication with JWT. Signup creates base `Employee` roles. No self-elevation possible.
- [x] **Dashboard:** Real-time operational snapshot with KPI cards (Assets Available, Allocated, Maintenance, Bookings, Transfers, Overdue Returns).
- [x] **Organization Setup (Admin Only):** Manage Departments, Asset Categories, and Employee Directory. Only Admins can promote employees to `Department Head` or `Asset Manager`.
- [x] **Asset Registration & Directory:** Custom asset tags, lifecycle status tracking (Available, Allocated, Reserved, Under Maintenance, Lost, Retired, Disposed).
- [x] **Asset Allocation & Transfer:** Conflict rules prevent double-allocation. Enforces transfer requests for currently held assets. Auto-flags overdue allocations.
- [x] **Resource Booking:** Calendar-based time-slot booking with strict overlap validation.
- [x] **Maintenance Management:** Structured workflow (Pending -> Approved -> In Progress -> Resolved) that automatically flips asset statuses.
- [x] **Asset Audit:** Structured verification cycles. Auditors mark assets, system generates discrepancy reports, and "Close Audit Cycle" automatically updates affected asset statuses.
- [x] **Reports & Analytics:** Dashboards and operational insights.
- [x] **Activity Logs & Notifications:** Full audit logging of admin/manager actions and overdue/maintenance alerts.

## 🛠 Tech Stack

- **Monorepo:** [Nx](https://nx.dev/)
- **Frontend:** Next.js (React), Tailwind CSS v4, Lucide Icons, TanStack Query
- **Backend:** Node.js, Express.js, Prisma ORM, PostgreSQL
- **Design Language:** Custom Brutalist UI (Hard shadows, sharp corners, high contrast)

## 🔐 Default Credentials

The database seeding script automatically creates a System Admin account for evaluation.

**Email:** `admin@example.com`  
**Password:** `admin123`

_(Note: Other roles like Asset Manager, Department Head, and Employee can be created by signing up normally, and then promoted via the Organization Setup tab using the Admin account)._

## 🚀 Quick Start (Local Evaluation)

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root of the workspace (or inside the backend directory).

   ```env
   # PostgreSQL Connection String
   DATABASE_URL="postgresql://postgres:password@localhost:5432/assetflow"
   JWT_SECRET="your-super-secret-jwt-key"
   ```

3. **Database Setup:**
   Run Prisma commands from the root directory to push the schema and seed the initial admin data.

   ```bash
   npx prisma db push --schema=backend/prisma/schema.prisma
   npx ts-node backend/prisma/seed.ts
   ```

4. **Start the Application:**
   Start both the frontend (Port 3000) and backend (Port 4000) simultaneously using Nx.

   ```bash
   npm run dev
   ```

5. **Open in Browser:**
   Visit `http://localhost:3000` to see the landing page!
