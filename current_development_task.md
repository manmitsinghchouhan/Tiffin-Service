# Provider Dietary Filtering Enforcement Plan (Veg / Non-Veg / Both)

## 1. Problem Statement & User Directive

### User Report:
- In **Provider Onboarding (Image 3)**, providers select their kitchen's **Dietary & Food Type**:
  - `VEG`: Pure Vegetarian (strictly 100% vegetarian dishes only).
  - `NON_VEG`: Non-Vegetarian (specialized meat, chicken & egg meals).
  - `BOTH`: Both Veg & Non-Veg (separate preparation for veg & non-veg subscribers).
- **The Bug / Issue:**
  - When a provider who registered as **`VEG`** opens **Add Food Item** in **Weekly Menu (Image 1)**, they are currently presented with both `Pure Veg` and `Non-Veg` options, as well as non-veg quick dish suggestions (e.g. Chicken Curry, Egg Curry).
  - When the same **`VEG`** provider opens **Create New Tiffin Plan (Image 2)**, they see `Non-Veg` and `Both (Veg & Non-Veg)` in the Diet dropdown, as well as non-veg quick feature tags.
- **Expected Behavior:**
  1. **If provider is `VEG`:**
     - **Weekly Menu (`AddItemModal` / `EditMealModal`):**
       - The dish diet MUST be automatically locked to `Veg` only.
       - The `Non-Veg` button / toggle option MUST be hidden.
       - Quick dish presets MUST filter out all non-veg items (e.g., Egg Curry, Chicken Curry).
     - **Tiffin Plans (`PlanFormModal`):**
       - The Diet dropdown MUST only show `VEG (Pure Vegetarian)` (or be locked to `VEG`).
       - Quick feature suggestions MUST filter out non-veg tags (`+ Egg Curry`, `+ Chicken Curry`).
       - Preset plan image thumbnails MUST filter out Non-Veg thalis.
       - The plan must be saved strictly as `diet: "VEG"`.
  2. **If provider is `NON_VEG`:**
     - **Weekly Menu (`AddItemModal` / `EditMealModal`):**
       - The dish diet MUST be locked to `Non-Veg`.
       - The `Pure Veg` option MUST be hidden.
       - Quick dish presets should reflect non-veg items.
     - **Tiffin Plans (`PlanFormModal`):**
       - Diet dropdown MUST only show `NON_VEG`.
       - Quick suggestions / images should reflect non-veg.
       - The plan must be saved strictly as `diet: "NON_VEG"`.
  3. **If provider is `BOTH`:**
     - Retain current behavior allowing the provider to freely choose between Veg, Non-Veg, or Both for each plan and meal item.
  4. **Backend Enforcement:**
     - Validate incoming plans and menu items against the provider's registered `foodType`.
     - Reject or sanitize invalid diet assignments on the server.

---

## 2. Affected Files & Architecture Map

| File | Type | Changes Needed |
|---|---|---|
| `frontend/src/components/provider/AddItemModal.jsx` | UI Component | Read `providerProfile.foodType`. Filter presets. If `VEG` or `NON_VEG`, lock diet and hide the opposite dietary category button. |
| `frontend/src/components/provider/EditMealModal.jsx` | UI Component | Read `providerProfile.foodType`. If not `BOTH`, lock item diet badge and disable toggle to the prohibited diet. |
| `frontend/src/components/provider/PlanFormModal.jsx` | UI Component | Read `providerProfile.foodType`. Restrict Diet `<select>` options to only permissible values (`VEG` for veg provider, `NON_VEG` for non-veg provider, all 3 for `BOTH`). Filter quick suggestions and preset covers. |
| `backend/src/controllers/providerPlanController.js` | Backend Controller | Enforce provider's `foodType` constraint on `createProviderPlan` and `updateProviderPlan`. Force plan diet according to kitchen registration. |
| `backend/src/controllers/providerMenuController.js` | Backend Controller | In `sanitizeSchedule`, `addDishToMeal`, and `updateMealWindow`, enforce provider's `foodType` so `VEG` kitchens always store `Veg` dishes and `NON_VEG` kitchens always store `Non-Veg`. |

---

## 3. Step-by-Step Implementation Checklist

### Phase 1: Backend Controllers Validation & Sanitization
- [x] **Step 1.1:** Update `backend/src/controllers/providerPlanController.js`:
  - When creating or updating a plan, verify that a `VEG` provider cannot create a `NON_VEG` or `BOTH` plan (lock to `VEG`).
  - Verify that a `NON_VEG` provider cannot create a `VEG` or `BOTH` plan (lock to `NON_VEG`).
- [x] **Step 1.2:** Update `backend/src/controllers/providerMenuController.js`:
  - Enforce provider's `foodType` on dish creation, meal update, and menu sync so diet is locked to `Veg` for `VEG` providers and `Non-Veg` for `NON_VEG` providers.
- [x] **Step 1.3:** Verify backend syntax using `node -c`.

### Phase 2: Weekly Menu Frontend Modals
- [x] **Step 2.1:** Update `frontend/src/components/provider/AddItemModal.jsx`:
  - Retrieve `providerProfile` from `useAuth()`.
  - Filter `PRESET_FOODS` based on `providerProfile.foodType`.
  - If `providerProfile.foodType === 'VEG'`: lock diet state to `'Veg'`, hide `Non-Veg` toggle button, and display a single verified Pure Veg badge with locked notice.
  - If `providerProfile.foodType === 'NON_VEG'`: lock diet state to `'Non-Veg'`, hide `Pure Veg` toggle button, and display a single verified Non-Veg badge with locked notice.
  - If `providerProfile.foodType === 'BOTH'`: keep both buttons available for selection.
- [x] **Step 2.2:** Update `frontend/src/components/provider/EditMealModal.jsx`:
  - Retrieve `providerProfile` from `useAuth()`.
  - If `providerProfile.foodType !== 'BOTH'`, disable the diet toggle button and show a static badge matching kitchen foodType. Sanitizes all items on save.

### Phase 3: Tiffin Plans Frontend Modal
- [x] **Step 3.1:** Update `frontend/src/components/provider/PlanFormModal.jsx`:
  - Retrieve `providerProfile` from `useAuth()`.
  - Set initial and default `diet` based on `providerProfile.foodType`.
  - Restrict the Diet dropdown / UI:
    - If `VEG`: display locked Pure Veg badge (`🌱 Veg (Pure Vegetarian)`) and restrict payload to `VEG`.
    - If `NON_VEG`: display locked Non-Veg badge (`🍗 Non-Veg`) and restrict payload to `NON_VEG`.
    - If `BOTH`: show full dropdown with `VEG`, `NON_VEG`, and `BOTH`.
  - Filter `FEATURE_SUGGESTIONS`: hide `Egg Curry` and `Chicken Curry` for `VEG` providers.
  - Filter `PLAN_PRESET_IMAGES`: hide non-veg presets (`Non-Veg Thali`) for `VEG` providers, and veg presets for `NON_VEG` providers.

### Phase 4: Build & Verification
- [x] **Step 4.1:** Run `npm run build` in `frontend/` to confirm 0 compilation errors.
- [x] **Step 4.2:** Verify end-to-end flow and mark tasks complete.
