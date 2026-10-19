# PRE_DEVELOPMENT.md
# Tiffin Service Management System

> **Purpose:** This document is the development brief and implementation reference for the Tiffin Service Management System. It consolidates the supplied project documentation into a practical guide for development in Google Antigravity IDE.
>
> **Current implementation direction:** MERN stack — React, Node.js, Express.js, and MongoDB using Mongoose ODM. The initial database target is a local MongoDB instance.
>
> **Source note:** The original Word document contains some template material referring to a photographer-booking system and older technologies. This brief retains the Tiffin Service Management System requirements and uses the technology choice confirmed for development. Where the source documents do not specify detailed behavior, the item is marked as a design decision to confirm rather than treated as an established requirement.

![Tiffin Service Management System](docs/assets/tiffin-service-cover.jpeg)

---

## 1. Project Overview

### 1.1 Project name
**Tiffin Service Management System**

### 1.2 Objective
Develop a web-based platform that simplifies tiffin-service management by connecting customers with tiffin service providers. The platform should support provider profiles, tiffin plans, weekly menus, one-time orders, recurring subscriptions, payments, and customer feedback.

### 1.3 Intended users
- **Admin:** Oversees platform users and provider verification and manages platform-level operations.
- **Customer:** Discovers tiffin services, views plans and menus, places orders, manages subscriptions, makes payments, and submits feedback.
- **Tiffin Service Provider:** Manages a business profile, creates tiffin plans and menus, and handles incoming orders and subscriptions.

### 1.4 Company context in the source report
The supplied report lists **Xorbyte Solution**, Ahmedabad, Gujarat, as the company profile. Refer to the original report for the supplied contact information and address.

---

## 2. Technology Stack

The implementation direction confirmed for development is:

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React.js | User interface and reusable UI components |
| Frontend styling | HTML, CSS, JavaScript | Structure, styling, and browser-side behavior |
| Backend runtime | Node.js | JavaScript server runtime |
| Backend framework | Express.js | HTTP API, middleware, routing, and request handling |
| Database | MongoDB (local during initial development) | Persistent document storage |
| ODM | Mongoose | Schemas, validation, models, and database access |
| API testing | Postman | Test and verify backend endpoints |
| IDE | Google Antigravity | Development environment |
| Diagram reference | Draw.io diagrams in source documentation | Use-case, activity, sequence, class, system-flow, and ER diagrams |
| Version control | Git / GitHub (recommended workflow) | Track changes and collaborate |

The source report also mentions Python/Django and SQLite in its older technology section. Those are not the selected implementation stack for this build.

![Technology overview from the supplied report](docs/assets/technology-overview.jpeg)

---

## 3. Existing-System Problems and Proposed Direction

The source documentation identifies these problems in the existing process:

- A confusing booking process can cause customers to abandon a booking.
- Limited customization options.
- Scheduling conflicts and potential double bookings.
- Complicated payment processing.

The proposed system aims to provide:

- A simpler online ordering and scheduling experience.
- Flexible service and plan choices.
- Clear order and subscription status tracking.
- Convenient payment options.
- A feedback and complaint process.
- Support for customers and providers.

These points describe the intended direction. Specific policies, delivery workflows, and payment-provider integrations must be confirmed before implementation.

---

## 4. Functional Modules

### 4.1 Authentication and user accounts
- Support the roles `ADMIN`, `CUSTOMER`, and `PROVIDER`.
- Store shared account information in a `users` collection.
- Enforce unique email and phone values.
- Hash passwords securely; never store plaintext passwords.
- Support account statuses such as `ACTIVE`, `INACTIVE`, and `SUSPENDED`.
- Apply authorization on the server for every protected operation.

### 4.2 Provider profile and verification
- Store a provider's business name, contact number, address, city, service area, food type, and description.
- Track verification status: `PENDING`, `VERIFIED`, or `REJECTED`.
- Associate one provider profile with a provider user account.
- Confirm whether providers can have multiple service areas and how these should be represented.

### 4.3 Tiffin plans
- Providers can define plans/packages.
- Plan data includes name, description, duration in days, meals per day, price, subscription availability, and status.
- Plan status includes `ACTIVE` and `INACTIVE`.
- Only authorized providers should manage their own plans.

### 4.4 Menu management
- Store menu items associated with a plan and provider.
- Record day of week, meal type, item name, optional description, and status.
- Meal types in the source include Breakfast, Lunch, and Dinner.
- Confirm whether a weekly menu is best represented as a separate collection or embedded in each plan. The initial database design should preserve the source's separate `MENU_ITEM_TABLE` concept unless query patterns justify changing it.

### 4.5 One-time orders
- Customers can place orders for a selected plan.
- Store customer, provider, and plan references.
- Store order date, quantity, delivery address, total amount, and status.
- Source order statuses include `PENDING`, `ACCEPTED`, `REJECTED`, `COMPLETED`, and `CANCELLED`.
- Preserve a purchase-time snapshot of relevant plan details and price so later plan edits do not rewrite order history.
- Validate that the selected plan belongs to the selected provider and is available for ordering.

### 4.6 Subscriptions
- Customers can subscribe to eligible recurring plans.
- Store customer, provider, and plan references, start date, end date, total amount, auto-renewal flag, and status.
- Source subscription statuses include `ACTIVE`, `EXPIRED`, and `CANCELLED`.
- Validate subscription eligibility against the plan's subscription setting.
- Auto-renewal behavior and payment scheduling require explicit business rules before implementation.

### 4.7 Payments
- Store customer reference, transaction/reference identifier, amount, payment method, payment status, and payment date.
- A payment can relate to a one-time order or a subscription.
- Recommended integrity rule: each payment must refer to **exactly one** of an order or a subscription, unless the business explicitly requires a different payment model.
- Source payment statuses include `PENDING`, `SUCCESS`, and `FAILED`.
- Never store raw card details. Payment gateway handling, webhook verification, idempotency, refunds, and reconciliation must be designed before production payment integration.

### 4.8 Feedback and complaints
- Store customer, provider, and optional order references.
- Store rating, optional review, feedback type, status, and creation date.
- Source feedback types include `FEEDBACK` and `COMPLAINT`.
- Source statuses include `OPEN`, `REVIEWED`, and `RESOLVED`.
- Validate rating range and ensure the user is authorized to submit feedback for the relevant service/order.

---

## 5. MongoDB Data Model

The original data dictionary defines eight SQL tables. These are the initial MongoDB collection equivalents:

| Original SQL table | Proposed MongoDB collection | Purpose |
|---|---|---|
| `USER_TABLE` | `users` | Shared accounts and roles |
| `TIFFIN_PROVIDER_TABLE` | `tiffinproviders` | Provider business profiles |
| `TIFFIN_PLAN_TABLE` | `tiffinplans` | Plans/packages |
| `MENU_ITEM_TABLE` | `menuitems` | Plan menu entries |
| `ORDER_TABLE` | `orders` | One-time orders |
| `SUBSCRIPTION_TABLE` | `subscriptions` | Recurring plan subscriptions |
| `PAYMENT_TABLE` | `payments` | Payment records |
| `FEEDBACK_TABLE` | `feedback` | Ratings, reviews, and complaints |

### 5.1 MongoDB conventions
- Use MongoDB `_id` values (`ObjectId`) as document identifiers.
- Use Mongoose references such as `userId`, `providerId`, `planId`, `customerId`, `orderId`, and `subscriptionId` where records remain separate.
- Use camelCase field names in JavaScript models, while keeping the business meaning of the source data dictionary.
- Use Mongoose schema validation and appropriate MongoDB indexes.
- Use `createdAt` and `updatedAt` timestamps where appropriate.
- Use integer minor currency units (for example, paise) or another explicitly chosen precise money representation; avoid relying on JavaScript floating-point arithmetic for financial calculations.
- Preserve snapshots of purchase-time prices and relevant plan details in orders and subscriptions.
- Do not assume that Mongoose `ref` automatically enforces a foreign key. Check referenced-record existence, role, ownership, and valid state in application services.
- Unique indexes must be created and duplicate-key errors handled by the API.
- Define a data-retention and deletion policy before implementing cascading deletion.

### 5.2 Key relationships
- A user may have one provider profile when their role is `PROVIDER`.
- A provider can own multiple plans.
- A plan can have multiple menu items.
- A customer can place multiple orders.
- A customer can create multiple subscriptions over time.
- A provider can receive orders and subscriptions from multiple customers.
- A payment belongs to a customer and references an order or subscription.
- Feedback belongs to a customer and provider and may reference an order.

### 5.3 Data-integrity rules to implement
- Email and phone must be unique after normalization.
- Provider profile `userId` must be unique.
- Transaction/reference ID must be unique when present.
- Only a provider can manage that provider's plans and menu items.
- Orders and subscriptions must reference valid customer, provider, and plan records.
- The plan and provider references must agree with one another.
- Payment associations must obey the selected order/subscription rule.
- Validate quantities, duration, meals per day, amount, and rating ranges.
- Use transactions for multi-document operations that must succeed or fail together, when the local MongoDB deployment supports transactions (replica-set configuration may be required).
- Use safe state transitions for order, subscription, and payment statuses.

---

## 6. Initial API and Authorization Direction

The following is a planning outline, not a finalized API contract.

| Area | Typical responsibilities | Access direction |
|---|---|---|
| Authentication | Register, sign in, sign out, current account | Public entry points plus authenticated routes |
| Users | View/update permitted account fields, manage account status | Own account; admin-only privileged actions |
| Providers | Create/update profile, verification, provider discovery | Provider owner; admin verification |
| Plans | Create, list, view, update, deactivate | Provider owner for mutations; public/customer read access subject to status |
| Menus | Manage and view menu items | Provider owner for mutations |
| Orders | Place order, view order history, update permitted status | Customer owner, relevant provider, admin |
| Subscriptions | Create, view, cancel, and manage eligible subscriptions | Customer owner, relevant provider, admin according to policy |
| Payments | Initiate/confirm payment, view payment status/history | Authorized customer and server-side payment integration |
| Feedback | Submit feedback/complaint and resolve it | Customer, relevant provider, admin according to policy |

### API implementation rules
- Validate request bodies, route parameters, and query parameters.
- Use centralized error handling and a consistent response format.
- Apply authentication and role/ownership authorization middleware.
- Do not trust client-supplied prices, roles, payment statuses, or ownership identifiers.
- Derive totals on the server from validated plan data and business rules.
- Paginate list endpoints and add indexes for actual filtering and sorting patterns.
- Avoid returning password hashes or internal secrets in API responses.
- Add automated tests for authorization and invalid state transitions.

---

## 7. Suggested Backend Structure

The structure below is a starting proposal. Adapt it to an existing repository instead of duplicating files if the project already has a structure.

```text
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── User.js
│   │   ├── TiffinProvider.js
│   │   ├── TiffinPlan.js
│   │   ├── MenuItem.js
│   │   ├── Order.js
│   │   ├── Subscription.js
│   │   ├── Payment.js
│   │   └── Feedback.js
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   ├── validations/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── tests/
├── .env.example
├── .gitignore
└── package.json

frontend/
└── React application (structure to be defined during frontend setup)

docs/
└── assets/
    └── project diagrams and reference images
```

Keep route handling, business logic, persistence, validation, and authorization responsibilities separated. Avoid putting the entire application into one controller or one model file.

---

## 8. Diagrams in the Supplied Documentation

The supplied Word document includes diagrams and visual references. The following assets are copied from that document for convenient viewing in Markdown. Treat diagrams as requirements references; verify the actual labels and flows before implementing any behavior not described in the written requirements.

### 8.1 Use-case diagrams

**Admin use case**

![Admin use-case diagram](docs/assets/use-case-admin.png)

**Customer/user use case**

![Customer use-case diagram](docs/assets/use-case-user.png)

**Tiffin service provider use case**

![Provider use-case diagram](docs/assets/use-case-provider.png)

### 8.2 Activity diagrams

**Admin activity**

![Admin activity diagram](docs/assets/activity-admin.png)

**User activity**

![User activity diagram](docs/assets/activity-user.png)

**Provider activity**

![Provider activity diagram](docs/assets/activity-provider.png)

### 8.3 Sequence diagrams

**Admin sequence**

![Admin sequence diagram](docs/assets/sequence-admin.png)

**User sequence**

![User sequence diagram](docs/assets/sequence-user.png)

**Provider sequence**

![Provider sequence diagram](docs/assets/sequence-provider.png)

### 8.4 Class, system-flow, and ER diagrams

**Class diagram**

![Class diagram](docs/assets/class-diagram.png)

**System flow diagram**

![System flow diagram](docs/assets/system-flow-diagram.jpeg)

**ER diagram**

![ER diagram](docs/assets/er-diagram.png)

The source document's diagram images may include legacy template elements or labels that are difficult to read. Use the business requirements and the data dictionary as the primary written references, and confirm any conflicting detail before coding it.

---

## 9. Security and Production-Readiness Requirements

These are implementation standards recommended for a real-world application; the source report does not specify every item in detail.

- Store secrets only in environment variables or an appropriate secrets manager.
- Keep `.env` out of version control and provide a sanitized `.env.example`.
- Hash passwords using a suitable password-hashing algorithm and library.
- Enforce authentication, roles, ownership, and input validation on the server.
- Use rate limiting and appropriate security headers on public-facing APIs.
- Validate and normalize user input; never trust client-supplied totals or status changes.
- Verify payment webhooks and make payment processing idempotent.
- Log operational events without logging passwords, tokens, or sensitive payment information.
- Define backups, restore tests, monitoring, error handling, and data-retention policies before production release.
- Add automated tests for core flows, validation, authorization, and failure conditions.
- Configure production CORS, HTTPS, database access control, and least-privilege credentials before deployment.

---

## 10. Development Roadmap

### Phase 1 — Project foundation
- Inspect the repository and confirm the frontend/backend structure.
- Configure Node.js, Express, environment variables, and local MongoDB.
- Add a health-check endpoint and graceful startup/shutdown behavior.
- Establish linting, formatting, and testing conventions.

### Phase 2 — Database design
- Finalize the eight Mongoose schemas.
- Define enums, required fields, indexes, and cross-collection integrity checks.
- Decide menu embedding, service-area representation, money storage, and deletion policies.
- Test schema validation and unique-index behavior with representative data.

### Phase 3 — Identity and provider onboarding
- Implement authentication and role-based authorization.
- Implement provider profile creation and admin verification.
- Test duplicate accounts, invalid roles, unauthorized access, and invalid references.

### Phase 4 — Plans and menus
- Implement provider-owned plan CRUD operations.
- Implement weekly menu management.
- Enforce provider ownership and plan/provider consistency.

### Phase 5 — Orders and subscriptions
- Implement order creation and permitted status transitions.
- Preserve purchase-time price snapshots.
- Implement subscription eligibility, dates, cancellation, expiry, and renewal rules once confirmed.

### Phase 6 — Payments and feedback
- Integrate the selected payment provider only after payment flows and security requirements are defined.
- Handle asynchronous payment confirmation, failures, duplicate callbacks, and reconciliation.
- Implement feedback and complaint management with authorization checks.

### Phase 7 — Frontend integration and release preparation
- Connect React screens to tested APIs.
- Test role-specific workflows end to end.
- Add monitoring, backup/restore procedures, production configuration, and deployment checks.

---

## 11. Open Decisions — Confirm Before Implementing

Do not silently invent business rules for these points:

1. **Authentication:** Email/password or another login method? What password-reset and verification flows are required?
2. **Provider verification:** Can unverified providers create plans, and can customers see their listings?
3. **Service area:** Is this a free-text area, a list of areas, or a location/radius-based service?
4. **Menu model:** Is the weekly menu attached to a plan, a provider, or both? Can multiple plans share menu entries?
5. **Orders:** Does quantity mean number of tiffin units, people, days, or something else? What are the cancellation and refund rules?
6. **Subscriptions:** How are start/end dates, missed deliveries, pauses, auto-renewal, and renewals handled?
7. **Payments:** Which payment gateway is selected? Are partial payments, refunds, or multiple attempts supported?
8. **Feedback:** Is feedback allowed only after a completed order, and can a customer submit multiple reviews for one order?
9. **Admin capabilities:** Which user, provider, order, complaint, and payment operations can administrators perform?
10. **Deployment and operations:** What are the expected traffic, backup, retention, monitoring, and availability requirements?

---

## 12. Instructions for the AI Coding Assistant in Antigravity

Use this document as the initial project brief.

1. Read this file and inspect the existing repository before making changes.
2. Do not replace existing project configuration or generate a new application structure without checking what already exists.
3. Implement in small, reviewable steps and explain which files are created or modified.
4. Begin with the database foundation and schemas; do not build every module in one large change.
5. Preserve the stated business requirements and record design decisions that are not specified.
6. Do not invent endpoints, fields, or business rules without identifying them as proposals.
7. Validate code with tests and report any commands that were run and their results.
8. Never expose secrets or put credentials in source control.
9. Keep documentation synchronized with the implemented schemas and APIs.
10. Ask for clarification when an unresolved business rule changes data integrity, payments, authorization, or customer-facing behavior.

### First task

Inspect the repository, identify the current backend setup, and propose the smallest safe first implementation step for local MongoDB + Mongoose. Do not create all eight models until the schema conventions and unresolved data-model decisions have been reviewed.
