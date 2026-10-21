# Current State — Tiffin Service Management System

**Last Updated:** October 19, 2026  
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

#### Lifecycle State Machine (Approach 2: Approval Milestone & Transition):

The presence, verification status, and milestone acknowledgement of the `TiffinProvider` record determines the provider's exact lifecycle stage:

1. `stage === "NEEDS_PROFILE"`: User registered (Step 1), needs to complete kitchen onboarding wizard (Step 2).
2. `stage === "PENDING_APPROVAL"`: Onboarding wizard submitted (`TiffinProvider` created with `verificationStatus: "PENDING"`), awaiting admin review.
3. `stage === "APPROVED_MILESTONE"`: Admin verified kitchen (`verificationStatus === "VERIFIED"` and `hasAcknowledgedApproval === false`). Status page displays the celebratory **Approval Milestone** screen with a **"Launch Kitchen Dashboard ➔"** action.
4. `stage === "VERIFIED"`: Provider clicked **"Launch Kitchen Dashboard"** (`hasAcknowledgedApproval === true`). Direct, permanent access to `/provider/dashboard` on all subsequent logins and page visits.
5. `stage === "REJECTED"`: Application rejected with admin `rejectionReason`. Provides an option to update details and re-apply via `PATCH /api/provider/reapply`.

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
- **Application Status & Milestone Page:** [src/pages/ProviderStatus.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/pages/ProviderStatus.jsx) (`/provider/status`)
  - **Milestone View (`APPROVED_MILESTONE`):** Celebratory screen with party poppers, verified kitchen privileges checklist, and a prominent **"Launch Kitchen Dashboard ➔"** button that invokes `PATCH /api/provider/acknowledge-approval` and transitions to `/provider/dashboard`.
  - **Review View (`PENDING_APPROVAL`):** Shows live review badge ("PENDING APPROVAL"), applicant & kitchen details, delivery areas, dietary type, 24–48h SLA notice, live status refresh, and sign-out button.
  - **Declined View (`REJECTED`):** Displays administrative rejection feedback with an interactive inline re-application form calling `PATCH /api/provider/reapply` to update details and return to pending status.
  - **Route Guard:** Redirects unauthenticated users to `/provider/login`; redirects incomplete providers to `/provider/onboarding`; redirects already acknowledged verified providers to `/provider/dashboard`.
- **Kitchen Dashboard:** [src/pages/ProviderDashboard.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/pages/ProviderDashboard.jsx) (`/provider/dashboard`)
  - Active verified partner portal displaying kitchen badge, metrics bar (Active Plans, Subscribers, Daily Prep, Payouts), certified kitchen profile summary, and upcoming functional roadmap modules.
  - **Route Guard:** Strictly restricted to authenticated providers with `stage === "VERIFIED"`.
- **Status:** **Provider Lifecycle, Approval Milestone & Dashboard Flow Fully Built, Verified, and Operational**.

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
- **Status:** **Admin Backend & Frontend Fully Built, Integrated, and Verified**.

---

## 8. Provider Approval Milestone & Transition Architecture (Approach 2)

1. **Lifecycle Stages (`computeProviderStage`):**
   - `NEEDS_PROFILE`: Provider registered Step 1, needs to fill Step 2 onboarding (`/provider/onboarding`).
   - `PENDING_APPROVAL`: Step 2 submitted, waiting for Admin verification (`/provider/status`).
   - `APPROVED_MILESTONE`: Admin has verified kitchen in DB (`verificationStatus: "VERIFIED"`, `hasAcknowledgedApproval: false`). Shows celebratory milestone card with unlocked privileges and "Launch Kitchen Dashboard ➔" button.
   - `VERIFIED`: Provider clicked "Launch Kitchen Dashboard" (`hasAcknowledgedApproval: true`), unlocking permanent access to `/provider/dashboard`.
   - `REJECTED`: Application rejected with feedback, inline re-application form enabled.

2. **Route-Specific Token Isolation (`authMiddleware.js`):**
   - Requests to `/api/provider/*` are strictly forced to use `providerToken`.
   - Requests to `/api/admin/*` are strictly forced to use `adminToken`.
   - Requests to `/api/customer/*` are strictly forced to use `customerToken`.
   - Generic fallback across tokens ensures backwards compatibility.
   - Eliminates multi-role cookie collisions when testing both Admin and Provider side-by-side in the same browser.

3. **Dual-Check Milestone Condition (`ProviderStatus.jsx`):**
   - The milestone screen no longer depends solely on the derived `providerStage` string. It evaluates:
     ```javascript
     const isApprovedMilestone =
       providerStage === 'APPROVED_MILESTONE' ||
       (providerProfile?.verificationStatus === 'VERIFIED' && !providerProfile?.hasAcknowledgedApproval);
     ```
   - If the database indicates `"VERIFIED"` and `hasAcknowledgedApproval` is `false`, the celebratory milestone screen is guaranteed to show.

4. **Live Auto-Polling & Silent Session Sync (`ProviderStatus.jsx` & `AuthContext.jsx`):**
   - Every 4 seconds, `ProviderStatus.jsx` silently checks `/api/provider/me` in the background with `checkAuth(false)` while in `isPending` state.
   - `checkAuth(showLoading = false)` prevents full-page loading spinner flicker during background polls.
   - The moment an admin clicks "Approve" in the Admin Dashboard, the provider's screen transitions into the celebratory milestone screen automatically without requiring a manual browser refresh.

---

## 9. Provider Kitchen Dashboard Overview (Frontend Architecture & Design System)

The Provider Dashboard (`/provider/dashboard`) has been built in accordance with the light, crisp design system matching the reference UI (`media_1792136838218.png`):

1. **Design System & Aesthetics:**
   - Background: Soft, light neutral (`bg-[#f4f7fc]`).
   - Cards: Pure white (`bg-white`), `rounded-3xl`, soft subtle borders (`border-slate-200/80`), and light drop shadows (`shadow-sm hover:shadow-md`).
   - Accent colors: Crisp royal blue (`#2563eb`), emerald green for status indicators and icons, warm amber for alerts and attention pills.
   - Dynamic time-based greeting: "Good morning / afternoon / evening, [Kitchen Name] 🌿" with sub-headline "Here's your kitchen at a glance" and "View public profile ↗" quick action.

2. **Modular Component Hierarchy (`frontend/src/components/provider/`):**
   - **`ProviderSidebar.jsx`**:
     - Brand Header with ChefHat icon: `TiffinHub` PARTNER PORTAL.
     - `WORKSPACE` Navigation: Overview, Weekly Menu, Tiffin Plans, Orders, Subscriptions, Customers.
     - `MANAGEMENT` Navigation: Payments & Earnings, Feedback & Complaints, Business Profile.
     - Footer: Settings and Sign Out.
     - Mobile drawer responsive slide-out support.
   - **`ProviderHeader.jsx`**:
     - Search bar (`Search orders, plans, customers...`).
     - Notification bell with unread indicator badge.
     - Kitchen Profile Pill: Circular kitchen image avatar, kitchen name, green checkmark `Verified Partner`, and quick dropdown menu.
   - **`DashboardStats.jsx`**:
     - 4 core metrics cards:
       - *Today's Orders*: 18 with alert chip `! 5 need attention`.
       - *Active Subscriptions*: 42 (`Across 3 active plans`).
       - *Active Tiffin Plans*: 3 (`Manage your packages`).
       - *This Month's Revenue*: ₹28,450 (`Payments overview`).
   - **`TodaysMenu.jsx`**:
     - Day selector dropdown (`MONDAY v`).
     - Meal rows for Breakfast, Lunch, and Dinner with real food photography thumbnails, Sun/Moon icons, and sample meal descriptions (e.g., Poha, fruit & chai; Dal, rice, roti & sabzi; Paneer curry, roti & salad).
     - Fixed weekly menu informational notice banner.
   - **`OrderActivity.jsx`**:
     - Filter dropdown (`Last 7 days v`).
     - Real-time order status counts: New orders (5), Accepted (9), Completed (4) with distinctive iconography.
     - Direct link to `View all orders →`.
   - **`RecentOrders.jsx`**:
     - Order log table: `#ORD1003` (Aarav Patel - Lunch), `#ORD1002` (Neha Shah - Dinner), `#ORD1001` (Rohan Mehta - Weekly Veg Plan).
     - Status badges (`Pending`, `Accepted`, `Paid`).
   - **`QuickActions.jsx`**:
     - Shortcuts for: *Edit weekly menu*, *Create tiffin plan*, *Review orders*.
   - **`ProviderDashboard.jsx` (Page Controller)**:
     - Route guards verifying active role (`PROVIDER`), completed profile (`providerStage !== 'NEEDS_PROFILE'`), and admin approval (`providerStage === 'VERIFIED'`).
     - Toast notification system giving feedback when navigating to modules that will be connected in upcoming steps.

---

## 10. Provider Weekly Menu Management (Frontend Architecture & Flow)

The Weekly Menu interface has been implemented following the attached reference UI and modular design:

1. **Main Architectural Concepts:**
   - **Fixed Weekly Menu (7 Days × 3 Meal Categories):**
     - Seven distinct days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.
     - Each day has three independent meal categories: **Breakfast**, **Lunch**, and **Dinner**.
     - Saving or editing food items under one day and meal category (e.g. *Monday → Breakfast*) never mutates or overwrites other meals or other days.
   - **Persistent & Reactive State Sharing:**
     - The weekly menu data is maintained and synchronized between the dedicated `WeeklyMenu` component and the Overview page's `TodaysMenu` component.
     - Updates made in Weekly Menu immediately reflect on the Overview dashboard.

2. **Created Components (`frontend/src/components/provider/`):**
   - **`WeeklyMenu.jsx`**:
     - Top breadcrumb: `← Workspace / Weekly Menu` (allows jumping back to Overview anytime).
     - Header: `Weekly Menu 🌿` title with subtitle, live cloud sync status badge (`Saved to cloud` / `Saving changes...`), and `Manage Menu` button.
     - 7 Day Pill Tabs: Monday through Sunday (Monday active by default, sleek active blue pill styling).
     - 3 Meal Cards:
       - **Breakfast**: Blue Sun icon, timing window `(8:00 AM - 10:00 AM)`, `Edit` and `+ Add Items` buttons, dish thumbnail cards with `🌱 (Veg)` and `🍗 (Non-Veg)` badges.
       - **Lunch**: Green Sun icon, timing window `(12:30 PM - 2:00 PM)`, `Edit` and `+ Add Items` buttons.
       - **Dinner**: Purple Moon icon, timing window `(7:30 PM - 9:00 PM)`, `Edit` and `+ Add Items` buttons.
   - **`AddItemModal.jsx`**:
     - Context-aware modal automatically targeted to the selected day & meal (e.g. `Monday • Breakfast`).
     - Quick Popular Dishes selector with automatic presets (Poha, Chai, Paratha, Dal Tadka, Roti, Paneer Curry, Salad, etc.).
     - Item name input, Veg / Non-Veg toggle pill, and custom image URL support with instant photo preview.
     - Supports adding multiple items consecutively.
   - **`EditMealModal.jsx`**:
     - Custom meal timing input (e.g. `8:00 AM - 10:00 AM`).
     - Live dish list with inline name edits, Veg/Non-Veg toggling, and per-item removal with trash action.
   - **`ManageMenuModal.jsx`**:
     - Batch operations:
       - **Copy Day Menu**: Copies all items from the current day to any selected combination of other days (connected to `POST /api/provider/menu/copy-day`).
       - **Clear Day**: Clears all dishes for the current day with safety confirmation.
       - **Reset Defaults**: Restores all 7 days back to the rich default schedule (connected to `POST /api/provider/menu/reset`).
   - **`TodaysMenu.jsx` (Updated)**:
     - Connected to the live weekly menu data.
     - Automatically reflects real dishes and timings.
     - "Edit weekly menu" button and meal cards route directly to the Weekly Menu manager.
   - **`App.jsx`**:
     - Direct route added: `/provider/menu` mapping to `ProviderDashboard` with `initialTab="weekly-menu"`.

3. **Provider Weekly Menu Backend & Live Sync (Completed & Verified):**
   - **Schema Architecture ([backend/src/models/WeeklyMenu.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/models/WeeklyMenu.js))**:
     - **1 Provider = Exactly 1 Document**: Replaced the 63 document-per-item anti-pattern with an embedded 7-day schedule document. 100 providers now equal 100 documents rather than 6,300 documents.
     - `providerId`: Reference to `TiffinProvider` (`unique: true`, indexed).
     - Embedded 7 Days (`Monday` - `Sunday`), each containing `breakfast`, `lunch`, `dinner` slots with `timing` and embedded dish objects (`id`, `name`, `diet`, `image`).
     - **Clean Slate for Providers**: New providers start with empty `items: []` arrays rather than pre-seeded dummy dishes, giving each provider full freedom to define their own meals.
   - **Controller & Sanitization ([backend/src/controllers/providerMenuController.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/controllers/providerMenuController.js))**:
     - Strict multi-tenant isolation: every query resolves the authenticated provider's ID from `req.user._id`.
     - `sanitizeSchedule`: Filters input strictly against allowed days and allowed meals (`breakfast`, `lunch`, `dinner`), preventing any stray keys from causing validation failures.
     - `getWeeklyMenu` (`GET /api/provider/menu`): Returns the clean 7-day weekly schedule for the provider in 1 indexed lookup.
     - `saveWeeklyMenu` (`PUT /api/provider/menu`): Atomically updates the provider's entire 7-day menu via single `findOneAndUpdate`.
     - `addMenuItem` (`POST /api/provider/menu/item`): Appends a dish to the target day and meal slot.
     - `updateMealWindow` (`PATCH /api/provider/menu/meal`): Updates timing or dish list.
     - `deleteMenuItem` (`DELETE /api/provider/menu/item/:id`): Removes specific dish from the array.
     - `copyDayMenu` (`POST /api/provider/menu/copy-day`): Clones one day's meals across target days in memory and saves atomically.
     - `resetWeeklyMenu` (`POST /api/provider/menu/reset`): Resets schedule back to a clean empty slate (`items: []`).
   - **Routes ([backend/src/routes/providerMenuRoutes.js](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/backend/src/routes/providerMenuRoutes.js))**:
     - Protected with `authenticate` and `isProvider` middleware. Mounted at `/api/provider/menu`.
   - **Frontend Integration & Bug Fixes ([frontend/src/components/provider/WeeklyMenu.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/components/provider/WeeklyMenu.jsx))**:
     - **Resolved Parameter Mismatch**: Fixed `handleOpenAddItems` to accept both `(mealType)` from card buttons and `(day, mealType)` from `EditMealModal.jsx`, eliminating the bug where `targetMealType` became `"Monday"` and caused the `mealType: MONDAY` 500 error.
     - **Sanitized `handleAddItem` & `handleUpdateMeal`**: Added lowercasing and validation check ensuring only valid meal types (`breakfast`, `lunch`, `dinner`) are modified.
     - **Empty Initial Template**: Removed hardcoded fake dishes from `INITIAL_MENU_DATA`, matching the backend's clean slate policy.

---

## 11. Next Steps on the Roadmap

1. **Provider Tiffin Plans & Packages Module (`/provider/plans`):**
   - Plan creation & management (`POST /api/provider/plans`, `GET /api/provider/plans`).
   - Linking meals/menus to specific subscription plans.
2. **Provider Orders Management Module:**
   - Real-time order tracking, daily delivery status updates, and dispatch lists.
3. **Customer Discovery & Subscription Flow:**
   - Customer-facing kitchen menu browsing and subscription checkout.


