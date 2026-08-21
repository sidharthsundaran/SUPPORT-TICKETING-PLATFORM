# Support Ticketing & SLA Management Platform

A multi-tenant, enterprise-grade Support Ticketing and Service Level Agreement (SLA) Management Platform built with Node.js, Express, MongoDB, Redis, React, Redux Toolkit Query, and TailwindCSS.

---

## Key Features & Business Requirements Delivered

- **Dedicated Team Console (`BR-CON-001` to `BR-CON-006`)**: Cross-project ticket triage workspace for Support Agents, Engineers, Project Managers, and Admins with preset saved views (`Unassigned`, `My Open`, `SLA At Risk ⚠️`, `Critical / High 🚨`), multi-row bulk operations (`Bulk Assign`, `Status Change`, `Tagging`), and client context slide-over drawers.
- **Client Org Admin Visibility (`BR-TRK-002` & `BR-ACC-009`)**: Scoping rules that allow Client Organisation Admins to view and manage tickets raised by any colleague within their organisation across assigned projects.
- **Real-Time SLA Engine (`BR-SLA-001`)**: Real-time resolution and response countdown metrics with business-hour calculations, weekend skipping, and custom project-level SLA matrix overrides.
- **Customer Satisfaction (CSAT) Rating (`BR-TRK-006`)**: Interactive 5-star rating widget and feedback comment prompt for resolved/closed tickets.
- **Direct S3 Evidence Uploads**: Presigned S3 file uploads and direct view/stream endpoints for ticket evidence files.
- **Executive CSV & PDF Exports (`BR-RPT-003` & `BR-RPT-005`)**: Instant downloadable executive summary CSV reports and styled PDF reports for printing/saving.
- **Email Verification & OTP (`BR-ACC-002`)**: 6-digit email OTP verification engine gating ticket creation.
- **Security & Abuse Protection (`BR-SEC-008` & `BR-SEC-004`)**: Registration/login IP rate-limiting, instant JWT `tokenVersion` deactivation revocation, 4-action project membership approval queue, and immutable audit logs.
- **Client Data Governance (`BR-SEC-007`)**: Platform admin client organisation data purge endpoint.

---

## Technology Stack

### Backend
- **Core**: Node.js, Express.js, TypeScript (`tsc`)
- **Database**: MongoDB with Mongoose ODM
- **Caching & Queues**: Redis with `ioredis` & BullMQ
- **Storage**: AWS S3 SDK (`@aws-sdk/client-s3`)
- **Security**: `jsonwebtoken`, `bcryptjs`, custom IP rate limiter, CORS, Helmet

### Frontend
- **Framework**: React 18 with Vite, TypeScript
- **State & API**: Redux Toolkit Query (RTK Query)
- **Styling**: TailwindCSS, Vanilla CSS Design System, Lucide Icons
- **Routing**: React Router DOM v6

---

## Project Structure

```text
support-ticketing-platform/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Redis, and SLA defaults
│   │   ├── controllers/     # API request handlers
│   │   ├── middleware/      # Auth, role-access, rate-limit middleware
│   │   ├── models/          # MongoDB Mongoose schemas
│   │   ├── repositories/    # Data access layer
│   │   ├── routes/          # Express route declarations
│   │   ├── services/        # Business logic & calculations
│   │   └── utils/           # App error, SLA calculator, helpers
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Redux store configuration
│   │   ├── components/      # Layout, Navbar, Sidebar components
│   │   ├── features/        # Auth, Projects, Tickets, Reports slices
│   │   ├── hooks/           # Custom React hooks (useAuth)
│   │   ├── pages/           # Page views (Dashboard, TeamConsole, Profile, etc.)
│   │   ├── routes/          # AppRoutes configuration
│   │   └── types/           # Shared TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## Setup Instructions

### Prerequisites
Ensure you have the following installed on your environment:
- **Node.js**: `v18.x` or higher
- **npm**: `v9.x` or higher
- **MongoDB**: Local MongoDB instance running on `mongodb://localhost:27017` or MongoDB Atlas URI
- **Redis**: Local Redis server running on `localhost:6379` (optional for local fallback, required for queueing)

---

### Step 1: Environment Variables Setup

#### Backend `.env`
Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
NODE_ENV=development

# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/support_ticketing_db

# JWT Configuration
JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=super_secret_refresh_key_change_in_production
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# AWS S3 (For Evidence Uploads)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET_NAME=your_s3_bucket_name

# Email SMTP (For Verification OTPs & Notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
```

#### Frontend `.env`
Create a `.env` file inside the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

---

### Step 2: Backend Installation & Setup

1. Open terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run TypeScript compilation check:
   ```bash
   npm run build
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The API server will launch at `http://localhost:5000`.*

---

### Step 3: Frontend Installation & Setup

1. Open a new terminal window and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend application will launch at `http://localhost:5173`.*

---

## Production Build Instructions

To generate production bundles for deployment:

### Backend Build
```bash
cd backend
npm run build
npm start
```

### Frontend Build
```bash
cd frontend
npm run build
```
*The optimized production files will be output to `frontend/dist/`.*

---

## Application Route Roster

| Path | View Component | Access Control |
| :--- | :--- | :--- |
| `/dashboard` | `DashboardPage.tsx` | Authenticated Users |
| `/team-console` | `TeamConsolePage.tsx` | Support Agents, Engineers, PMs, Admins |
| `/my-tickets` | `TicketsPage.tsx` | All Authenticated Users |
| `/tickets` | `TicketsPage.tsx` | All Authenticated Users |
| `/tickets/new` | `CreateTicketPage.tsx` | Verified Email Users |
| `/tickets/:id` | `TicketDetailsPage.tsx` | Ticket Members & Staff |
| `/projects` | `ProjectsPage.tsx` | All Authenticated Users |
| `/projects/:id` | `ProjectDetailsPage.tsx` | Project Members |
| `/profile` | `ProfilePage.tsx` | All Authenticated Users |
| `/admin/users` | `UsersPage.tsx` | Platform Admins |
| `/admin/settings` | `PlaceholderPage.tsx` | Platform Admins |

---

## License
Internal Proprietary Software — All Rights Reserved.
