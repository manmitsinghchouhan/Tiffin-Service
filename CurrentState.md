# Current State — Tiffin Service Management System

**Last Updated:** October 16, 2026  
**Stack:** MERN (Node.js, Express 5, MongoDB / Mongoose 9, React 19 + Vite 8)  
**Architecture:** Modular ES Modules (`"type": "module"`), HTTP-only Cookie-Based JWT Sessions, React Context for Auth State, Axios with Credentials

---

## 1. Executive Summary & Current Project Condition

The foundational backend infrastructure, all role-based authentication architectures, and the full frontend authentication suites (Admin, Customer, and Provider with a 2-step onboarding wizard and status lifecycle tracking) are fully implemented, verified, and active:

- **Backend Server:** Running on port `5000` via `nodemon` with automatic reloading, centralized error handling, and graceful shutdown.
- **Frontend App:** Running on port `5173` via Vite 8 with responsive design, Tailwind CSS, Lucide icons, and zero-error production builds.
- **Database Connection:** Local MongoDB via Mongoose 9 (`mongodb://127.0.0.1:27017/tiffin_service`).
- **Core Models:** All 8 primary domain collections are modeled with strict schema validation and integrity hooks.
- **State Management & Networking:**
  - Zero sensitive tokens or user state stored in `localStorage`.
  - Centralized Axios client (`src/services/api.js`) with `withCredentials: true` and interceptors for secure cookie transport.
  - `AuthContext.jsx` manages user session state, auto-rehydrates on page refresh via protected `/me` endpoints, and tracks provider onboarding stages.
- **Authentication & Onboarding Workflows:**
  - **Admin:** Secret-protected admin creation, seeding script (`npm run seed:admin`), dedicated login at `/admin/login`, and protected dashboard at `/admin`.
  - **Customer:** Public registration (without auto-login) and login at `/login` & `/register`, setting `customerToken` cookie on sign-in.
  - **Provider:** Partner landing page (`/partner`), Step 1 account registration with immediate auto-login (`providerToken`), Step 2 business onboarding wizard (`/provider/onboarding`), and live application review status page (`/provider/status`) with strict lifecycle route guarding.

---

## 2. Completed Backend Infrastructure & Configurations

1. **Module System Configuration:**
   - [backend/package.json](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/package.json) set to `"type": "module"`.
   - Scripts configured: `"start"`, `"dev": "nodemon src/server.js"`, `"seed:admin"`, `"test"`.
   - Core packages: `express`, `mongoose`, `cors`, `cookie-parser`, `bcryptjs`, `jsonwebtoken`, `dotenv`.

2. **Database & Services:**
   - [src/config/database.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/config/database.js): Database connection with process lifecycle hooks (`SIGINT`, `SIGTERM`) and graceful disconnection.
   - [src/config/cloudinary.config.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/config/cloudinary.config.js): Cloudinary client configuration helper.
   - [src/utils/cloudinaryUpload.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/utils/cloudinaryUpload.js): Stream-based image buffer uploader for logos and meal photos.

3. **Utilities & Error Handling:**
   - [src/utils/ApiError.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/utils/ApiError.js): Operational error class with HTTP status codes.
   - [src/utils/asyncHandler.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/utils/asyncHandler.js): Higher-order wrapper delegating controller promises to centralized error middleware.
   - [src/utils/jwt.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/utils/jwt.js): JWT token generator and verification utility using environment secrets.
   - [src/app.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/app.js): CORS setup with `credentials: true`, JSON/urlencoded body parsers, cookie-parser, health check (`GET /api/health`), 404 handler, and production-sanitized global error handler.

4. **Environment & Security Files:**
   - [.env](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/.env) (local secrets and database URI).
   - [.env.example](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/.env.example) (sanitized template for onboarding).
   - [.gitignore](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/.gitignore) (protects `.env`, `node_modules`, and debug logs).

---

## 3. Database Models (8 Core Collections)

Located under [backend/src/models/](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/models/):

| Model              | File                | Description & Key Integrity Features                                                                                                                                                                                                              |
| ------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User**           | `User.js`           | Base accounts for all roles (`ADMIN`, `CUSTOMER`, `PROVIDER`). Unique email and phone constraints. Passwords automatically hashed pre-save using `bcryptjs` (min 6 chars, `select: false`). Includes `comparePassword()` helper.                  |
| **TiffinProvider** | `TiffinProvider.js` | Business profiles linked 1:1 to `User` (`userId`). Tracks `businessName`, contact, address, city, service area array, food type (`VEG`, `NON_VEG`, `BOTH`), description, and `verificationStatus` (`PENDING`, `VERIFIED`, `REJECTED`).            |
| **TiffinPlan**     | `TiffinPlan.js`     | Meal packages owned by a provider. Fields: `durationDays`, `mealsPerDay`, `price`, `isSubscriptionAvailable`, `status`.                                                                                                                           |
| **MenuItem**       | `MenuItem.js`       | Weekly meal schedules linked to plan & provider. Days (`MONDAY`-`SUNDAY`), meal types (`BREAKFAST`, `LUNCH`, `DINNER`), item name, and photo URL. Indexed by `(planId, dayOfWeek, mealType)`.                                                     |
| **Order**          | `Order.js`          | One-time meal orders. Contains structured delivery address and an **immutable `planSnapshot`** preserving purchase-time price and details against future plan modifications. Status: `PENDING`, `ACCEPTED`, `REJECTED`, `COMPLETED`, `CANCELLED`. |
| **Subscription**   | `Subscription.js`   | Recurring meal subscriptions. Contains start/end dates, auto-renewal flag, and purchase-time `planSnapshot`. Status: `ACTIVE`, `EXPIRED`, `CANCELLED`.                                                                                            |
| **Payment**        | `Payment.js`        | Payment transaction ledger (`CARD`, `UPI`, `NETBANKING`, `CASH`, `WALLET`). Validated with a strict schema pre-validation hook enforcing **exactly one** of `orderId` or `subscriptionId`.                                                        |
| **Feedback**       | `Feedback.js`       | Customer ratings (1–5), textual reviews, and complaints (`FEEDBACK` vs `COMPLAINT`). Tracks status (`OPEN`, `REVIEWED`, `RESOLVED`).                                                                                                              |

---

## 4. Authentication & Security Middleware

Located at [backend/src/middleware/authMiddleware.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/middleware/authMiddleware.js):

- **`authenticate`**:
  - Checks for JWT in cookies in priority order: `req.cookies.providerToken`, `req.cookies.customerToken`, `req.cookies.adminToken`, `req.cookies.token`.
  - Fallback check: `Authorization: Bearer <token>` header (for API testing).
  - Validates token signature, verifies user still exists in DB, and enforces `status === "ACTIVE"`.
- **`authorize(...roles)`**: Role-based access control.
- **Role Guards**: `isAdmin`, `isCustomer`, `isProvider`.

---

## 5. Role-Specific Authentication Modules (Backend & Frontend)

### 5.1 Admin Authentication & Seeder

- **Backend Controller:** [src/controllers/adminAuthController.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/controllers/adminAuthController.js)
- **Backend Routes:** [src/routes/adminAuthRoutes.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/routes/adminAuthRoutes.js) (mounted at `/api/admin` and `/api/admin/auth`)
- **Seeding Script:** [src/scripts/seedAdmin.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/scripts/seedAdmin.js) (`npm run seed:admin`).
- **Frontend Pages:**
  - [src/pages/AdminLogin.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/pages/AdminLogin.jsx) (`/admin/login`): Admin credential sign-in with HTTP-only cookie establishment.
  - [src/pages/AdminDashboard.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/pages/AdminDashboard.jsx) (`/admin`): Authenticated admin portal overview with logout action.
- **Status:** **Tested & Fully Verified**.

---

### 5.2 Customer Authentication

- **Backend Controller:** [src/controllers/customerAuthController.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/controllers/customerAuthController.js)
- **Backend Routes:** [src/routes/customerAuthRoutes.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/routes/customerAuthRoutes.js) (mounted at `/api/customer` and `/api/customer/auth`)
- **Policy:** Registration creates account with role `CUSTOMER` without auto-login; directs customer to log in with new credentials.
- **Frontend Page:** [src/pages/CustomerAuth.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/pages/CustomerAuth.jsx) (`/login` & `/register`)
  - Switchable Login / Register views.
  - Password visibility toggles, form validation, and session establishment via `POST /api/customer/login`.
- **Status:** **Tested & Fully Verified**.

---

### 5.3 Provider Authentication, 2-Step Onboarding & Lifecycle Tracking

- **Backend Controller:** [src/controllers/providerAuthController.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/controllers/providerAuthController.js)
- **Backend Routes:** [src/routes/providerAuthRoutes.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/routes/providerAuthRoutes.js) (mounted at `/api/provider` and `/api/provider/auth`)

#### Lifecycle State Machine:

The presence or absence of the `TiffinProvider` record determines the provider's exact lifecycle stage:

1. `stage === "NEEDS_PROFILE"`: User registered (Step 1), needs to complete kitchen onboarding (Step 2).
2. `stage === "PENDING_APPROVAL"`: Onboarding wizard submitted (`TiffinProvider` created with `verificationStatus: "PENDING"`), awaiting admin review.
3. `stage === "VERIFIED"`: Admin approved application, ready for full dashboard access.
4. `stage === "REJECTED"`: Application rejected with reason.

#### Frontend Modules & Route Guards:

- **Partner Landing Page:** [src/pages/PartnerLandingPage.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/pages/PartnerLandingPage.jsx) (`/partner`)
  - Explains provider benefits, process steps, and requirements.
  - Action cards for "Join Now" (`/provider/register`) and "Already a Partner" (`/provider/login`).
- **Step 1: Account Creation & Sign In:** [src/pages/ProviderAuth.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/pages/ProviderAuth.jsx) (`/provider/register` & `/provider/login`)
  - Registration fields: Owner's Full Name, Phone, Email, Password, Confirm Password.
  - Submits to `POST /api/provider/register` $\rightarrow$ automatically logs in provider, sets `providerToken` cookie, and transitions immediately to `/provider/onboarding`.
  - Login verifies credentials and dynamically redirects based on `stage`.
- **Step 2: Onboarding Wizard:** [src/pages/ProviderOnboarding.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/pages/ProviderOnboarding.jsx) (`/provider/onboarding`)
  - Multi-step progress indicator (`Step 1: Account ✓` $\rightarrow$ `Step 2: Kitchen Profile [Active]` $\rightarrow$ `Step 3: Verification`).
  - Fields: `businessName`, `contactNumber` (pre-filled from Step 1, editable), `address`, `city` dropdown (Ahmedabad, Mumbai, Pune, Delhi NCR, Bangalore), `serviceArea` interactive locality pills + custom area tag input, 3 dietary cards (`VEG`, `NON_VEG`, `BOTH`), `description`, and `imageUrl` with live preview.
  - Submits to `POST /api/provider/onboarding` $\rightarrow$ creates `TiffinProvider` document $\rightarrow$ updates context $\rightarrow$ transitions immediately to `/provider/status`.
  - **Route Guard:** Redirects unauthenticated users to `/provider/login`; redirects providers who have already submitted onboarding to `/provider/status`.
- **Application Status Page:** [src/pages/ProviderStatus.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/pages/ProviderStatus.jsx) (`/provider/status`)
  - Shows live review badge ("PENDING APPROVAL"), applicant & kitchen details, delivery areas, dietary type, 24–48h SLA notice, live status refresh, and sign-out button.
  - **Route Guard:** Redirects unauthenticated users to `/provider/login`; redirects providers with incomplete onboarding (`stage === "NEEDS_PROFILE"`) back to `/provider/onboarding`.
- **Status:** **Fully Implemented, Verified, and Tested**.

---

## 6. Frontend Architecture & State Management

Located under [frontend/src/](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/):

- **Zero LocalStorage Tokens:** Credentials and tokens are managed exclusively through HTTP-only secure cookies and server sessions.
- **Centralized Axios Client:** [src/services/api.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/services/api.js) configured with `baseURL: '/api'`, `withCredentials: true`, and error extraction interceptors.
- **Context State (`AuthContext.jsx`):**
  - Manages `user`, `role`, `loading`, `providerStage`, `providerProfile`.
  - Rehydrates on page refresh via `checkAuth()` querying `/admin/me`, `/provider/me`, and `/customer/me`.
  - Exposes actions: `loginCustomer`, `registerCustomer`, `logoutCustomer`, `loginProvider`, `registerProvider`, `logoutProvider`, `submitOnboarding`, `loginAdmin`, `logoutAdmin`.
- **Main App & Routing:** [src/App.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/App.jsx)
  - `/` $\rightarrow$ Customer Landing Page ([src/pages/LandingPage.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/pages/LandingPage.jsx))
  - `/partner` $\rightarrow$ Partner Landing Page
  - `/provider/register` $\rightarrow$ Provider Step 1 Registration
  - `/provider/login` $\rightarrow$ Provider Sign In
  - `/provider/onboarding` $\rightarrow$ Provider Step 2 Wizard
  - `/provider/status` $\rightarrow$ Provider Application Status Page
  - `/login` & `/register` $\rightarrow$ Customer Auth
  - `/admin/login` & `/admin` $\rightarrow$ Admin Portal & Dashboard
- **Design System:** [src/index.css](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/index.css) using Tailwind CSS, _Plus Jakarta Sans_ typography, glassmorphism, and responsive layout.

---

## 7. Current Directory Layout

```text
Tiffin Service/
├── CurrentState.md                 # Project progress and system documentation
├── PRE_DEVELOPMENT.md              # Requirements brief, architecture, and diagrams
├── AGENTS.md                       # Development guidelines
├── assets/                         # Architecture diagrams and design assets
├── frontend/                       # Vite 8 + React 19 Frontend Application
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx                 # Routing configuration & route guards
│       ├── main.jsx
│       ├── index.css               # Design system & Tailwind styling
│       ├── context/
│       │   └── AuthContext.jsx     # Centralized auth state & session rehydration
│       ├── services/
│       │   └── api.js              # Axios instance with credentials
│       ├── components/
│       │   ├── Navbar.jsx          # Public navbar
│       │   ├── Hero.jsx            # Landing hero section
│       │   ├── HowItWorks.jsx      # Step-by-step workflow section
│       │   └── Footer.jsx          # Brand footer
│       └── pages/
│           ├── LandingPage.jsx     # Home landing page
│           ├── PartnerLandingPage.jsx # Partner onboarding landing page
│           ├── ProviderAuth.jsx    # Provider Step 1 Register & Login
│           ├── ProviderOnboarding.jsx # Provider Step 2 Onboarding Wizard
│           ├── ProviderStatus.jsx  # Provider Application Status Page
│           ├── CustomerAuth.jsx    # Customer Login & Register
│           ├── AdminLogin.jsx      # Admin login page
│           └── AdminDashboard.jsx  # Admin dashboard view
└── backend/                        # Node.js + Express 5 API Server
    ├── package.json                # "type": "module", dev & seed scripts
    ├── .env                        # Local configuration & secrets
    ├── .env.example                # Configuration template
    ├── .gitignore
    ├── src/
    │   ├── app.js                  # Express setup, middleware, error handler
    │   ├── server.js               # Server listener & graceful shutdown
    │   ├── config/
    │   │   ├── database.js         # Mongoose connection
    │   │   └── cloudinary.config.js # Cloudinary configuration helper
    │   ├── models/
    │   │   ├── User.js
    │   │   ├── TiffinProvider.js
    │   │   ├── TiffinPlan.js
    │   │   ├── MenuItem.js
    │   │   ├── Order.js
    │   │   ├── Subscription.js
    │   │   ├── Payment.js
    │   │   ├── Feedback.js
    │   │   └── index.js
    │   ├── controllers/
    │   │   ├── adminAuthController.js
    │   │   ├── customerAuthController.js
    │   │   ├── providerAuthController.js
    │   │   └── index.js
    │   ├── routes/
    │   │   ├── adminAuthRoutes.js
    │   │   ├── customerAuthRoutes.js
    │   │   ├── providerAuthRoutes.js
    │   │   └── index.js
    │   ├── middleware/
    │   │   ├── authMiddleware.js   # authenticate, authorize, isAdmin, isCustomer, isProvider
    │   │   └── index.js
    │   ├── utils/
    │   │   ├── ApiError.js
    │   │   ├── asyncHandler.js
    │   │   ├── jwt.js
    │   │   └── cloudinaryUpload.js
    │   └── scripts/
    │       └── seedAdmin.js        # Admin seeding script
    └── tests/
        └── models.test.js          # Mongoose models automated validation suite
```

### 5.4 Admin Management & Provider Approval Module (Backend)

- **Controller:** [src/controllers/adminManagementController.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/controllers/adminManagementController.js)
- **Routes:** [src/routes/adminManagementRoutes.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/routes/adminManagementRoutes.js) (mounted at `/api/admin`)
- **Security:** All endpoints protected by `authenticate` and `isAdmin`.
- **Implemented Endpoints:**
  1. `GET /api/admin/stats` (alias: `/api/admin/dashboard/stats`):
     - Executes parallel MongoDB aggregations:
       - Customer totals, Provider user totals, Pending, Verified, and Rejected kitchen application counts.
       - Total plans, total orders, total subscriptions, and platform total revenue.
       - Recent 5 provider applications with owner information.
       - Recent 5 registered users.
     - Powers the **Main Admin Dashboard Overview** summary cards, metrics, and recent activity feed.
  2. `GET /api/admin/providers`:
     - Lists all provider applications with:
       - Status filtering (`status=PENDING`, `VERIFIED`, `REJECTED`, or `ALL`).
       - City regex search and keyword text search (`businessName`, `address`, `city`).
       - Pagination (`page`, `limit`) with `totalPages` and `hasMore` metadata.
       - Populated owner details (`userId`: `name`, `email`, `phone`, `role`, `status`).
     - Powers the **Approve Tiffin Provider** management table.
  3. `GET /api/admin/providers/:id`:
     - Returns single kitchen profile, owner details, and associated meal plans.
  4. `PATCH /api/admin/providers/:id/verify`:
     - Approves provider (`verificationStatus: "VERIFIED"`, clears `rejectionReason`).
  5. `PATCH /api/admin/providers/:id/reject`:
     - Rejects provider with required `rejectionReason` (`verificationStatus: "REJECTED"`).
  6. `GET /api/admin/users`:
     - Lists registered users with filters (`role=CUSTOMER`, `PROVIDER`, `ADMIN`, or `ALL`), account status (`ACTIVE`, `INACTIVE`, `SUSPENDED`), case-insensitive search (`name`, `email`, `phone`), and pagination (`page`, `limit`).
     - Powers the **Customer & User Management** table.
  7. `GET /api/admin/users/:id`:
     - Returns comprehensive user details, with customer order history/metrics or provider kitchen profile.
  8. `PATCH /api/admin/users/:id/status`:
     - Updates account status (`ACTIVE`, `INACTIVE`, `SUSPENDED`) with self-modification guard for current admin.
  9. `DELETE /api/admin/users/:id`:
     - Permanently removes user account and cleans up associated provider profile if applicable (protected against self-deletion).
- **Status:** **Admin Backend Fully Built, Configured, and Ready for Frontend Consumption**.

---

## 8. Next Steps on the Roadmap

1. **Admin Frontend Dashboard & Approval Pages:**
   - Build responsive Admin Layout with collapsible/fixed common sidebar (`Dashboard Overview`, `Provider Approvals`, `Users Directory`, `Settings`).
   - Page 1: **Admin Dashboard Overview** (`/admin`):
     - Metrics summary cards (Pending Approvals, Verified Kitchens, Customers, Revenue).
     - Recent Activity timelines (recent applications and user registrations).
   - Page 2: **Approve Tiffin Provider Page** (`/admin/providers`):
     - Filterable status tabs (`Pending Review`, `Verified`, `Rejected`, `All`).
     - Search & pagination.
     - Review details modal with full kitchen address, dietary type, and photos.
     - 1-click Approve and Reasoned Rejection modals.
2. **Provider Dashboard (Post-Verification):**
   - Build Provider Portal for verified providers (`stage === "VERIFIED"`).
3. **Provider Plan & Menu Management:**
   - CRUD endpoints & UI for providers to create and update their Tiffin Plans (`POST /api/plans`).
   - Weekly menu management for breakfast, lunch, and dinner (`POST /api/menus`).
4. **Customer Discovery & Subscription Flow:**
   - Provider catalog & plan browsing for customers.
   - Ordering & recurring subscriptions with purchase-time price snapshotting.
