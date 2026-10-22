# Future Enhancements & Architectural References

> **Purpose:** This document tracks planned data-driven upgrades, placeholder replacements, and business logic specifications identified during development. It serves as a single source of truth when implementing future modules (Customer Checkout, Subscriptions, Reviews/Feedback, and Kitchen Dispatch).

---

## 1. Landing Page & Customer Kitchen Discovery Section

### 1.1 Rating & Review Counts
* **Current Implementation:** Displays a clean UI placeholder (`★ 4.8 (120 reviews)`) on both the kitchen card in [ExploreKitchens.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/components/ExploreKitchens.jsx) and the showcase modal in [KitchenDetailModal.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/components/KitchenDetailModal.jsx).
* **Future Upgrade (Feedback & Ratings Module):**
  - Connect to the MongoDB `Feedback` collection.
  - Implement MongoDB aggregation in `publicKitchenController.js`:
    ```javascript
    const ratingStats = await Feedback.aggregate([
      { $match: { providerId: kitchen._id, type: "FEEDBACK" } },
      {
        $group: {
          _id: "$providerId",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    ```
  - Display actual calculated rating (e.g., `4.7`) and total reviews count. If no reviews exist yet, display `New Provider` or `Unrated`.

### 1.2 Customer Favorites (Heart Icon Toggle)
* **Current Implementation:** Local React state toggle within the user's active session.
* **Future Upgrade (Customer Profile Module):**
  - Add `savedKitchens: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TiffinProvider' }]` to `User` or `CustomerProfile`.
  - Provide authenticated endpoints:
    - `POST /api/customer/favorites/:kitchenId` (toggle favorite).
    - `GET /api/customer/favorites` (list saved kitchens).

### 1.3 Verified Badge Lifecycle
* **Current Implementation:** Displays `✓ Verified` badge based on `verificationStatus: 'VERIFIED'`.
* **Future Upgrade:** Provide tooltip detailing verification date, food hygiene inspection compliance, and commercial kitchen license confirmation.

---

## 2. Tiffin Plans & Badging System

### 2.1 "Popular" & "Best Value" Badges (Data-Driven Automatic Logic)
* **Current Implementation:** Visual highlight tags (`👑 Popular` and `💎 Best Value`) positioned on the plan cards in the showcase modal.
* **Future Upgrade (Subscription-Driven Rule):**
  - **Rule:** The `Popular` badge must be completely data-driven.
  - The badge **only** appears automatically on the plan with the highest count of active subscribers (`subscribersCount`).
  - **Zero-Subscriber Condition:** If all plans for a kitchen have `0` active subscribers, **no** badge is shown.
  - Calculation logic:
    ```javascript
    const activeSubscribers = await Subscription.countDocuments({
      planId: plan._id,
      status: "ACTIVE"
    });
    ```

### 2.2 Provider Dashboard Subscriber Count ("18 Subscribers" Placeholder)
* **Current Implementation:** In [TiffinPlans.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/components/provider/TiffinPlans.jsx), plans currently fall back to mock placeholder `(plan.subscribersCount || 18)` while the customer subscription system is being built.
* **Future Upgrade:**
  - In `providerPlanController.js`, aggregate real subscriber counts for each plan:
    ```javascript
    const counts = await Subscription.aggregate([
      { $match: { planId: { $in: planIds }, status: "ACTIVE" } },
      { $group: { _id: "$planId", activeSubscribers: { $sum: 1 } } }
    ]);
    ```
  - Remove all mock fallbacks so the dashboard reflects 100% real-time customer subscriptions.

---

## 3. Customer Checkout & Subscription Flow (Step B Reference)

### 3.1 Auto-Renewal / `isSubscriptionAvailable` Flag Behavior
This flag is configured by providers in the **Create/Edit Plan Form** ([PlanFormModal.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/components/provider/PlanFormModal.jsx)):

* **When Checked (`isSubscriptionAvailable = true`):**
  - The plan supports recurring subscription cycles.
  - In the Customer Checkout Modal: The customer is given the option to toggle **"Auto-renew subscription at end of period"**.
  - System schedules renewal reminder notifications and auto-generates recurring invoices.

* **When Unchecked (`isSubscriptionAvailable = false`):**
  - The plan is strictly a **one-time, fixed-duration package** (e.g., a 7-day or 30-day trial meal box).
  - In the Customer Checkout Modal: The auto-renewal checkbox is **hidden or disabled**.
  - The subscription automatically terminates on day `durationDays` without recurring charges or unexpected debits.

### 3.2 Subscription Checkout Form Fields
When the customer clicks `Subscribe Now ➔` in [KitchenDetailModal.jsx](file:///c:/Users/manmi/OneDrive/Desktop/Tiffin%20Service/frontend/src/components/KitchenDetailModal.jsx):
1. **Authentication Check:**
   - If guest ➔ prompt quick login or registration.
   - If authenticated customer ➔ open Checkout Modal.
2. **Delivery Start Date Picker:**
   - Select start date (minimum: tomorrow / next meal slot).
3. **Delivery Address & Contact:**
   - Street address, landmark, delivery instructions (e.g., "Ring bell twice, leave with security").
   - Contact mobile number.
4. **Auto-Renewal Option:** Conditionally rendered according to `plan.isSubscriptionAvailable`.
5. **Confirmation & Initial Order Creation:**
   - Creates a document in `subscriptions` collection.
   - Generates the initial day-1 order in `orders` collection.

---

## 4. Customer Portal & Daily Delivery Controls (Step C Reference)

### 4.1 Daily Meal Delivery Tracking
* Real-time status synced between kitchen dispatch and customer dashboard:
  - `Order Placed` ➔ `Kitchen Preparing` ➔ `Out for Delivery` ➔ `Delivered`.

### 4.2 Pause & Resume Meal Deliveries
* Customers can pause upcoming deliveries (e.g. going out of town for the weekend).
* **Business Rule:** Pausing deliveries automatically extends the subscription end-date by the exact number of paused days.
