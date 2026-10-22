import WeeklyMenu from "../models/WeeklyMenu.js";
import TiffinProvider from "../models/TiffinProvider.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Days of the week list
export const DAYS_LIST = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const MEAL_TYPES_LIST = ["breakfast", "lunch", "dinner"];

// Clean default template: timing slots are defined, but dishes are EMPTY so each provider adds their own
export const EMPTY_WEEKLY_MENU_TEMPLATE = {
  Monday: {
    breakfast: { timing: "8:00 AM - 10:00 AM", items: [] },
    lunch: { timing: "12:30 PM - 2:00 PM", items: [] },
    dinner: { timing: "7:30 PM - 9:00 PM", items: [] },
  },
  Tuesday: {
    breakfast: { timing: "8:00 AM - 10:00 AM", items: [] },
    lunch: { timing: "12:30 PM - 2:00 PM", items: [] },
    dinner: { timing: "7:30 PM - 9:00 PM", items: [] },
  },
  Wednesday: {
    breakfast: { timing: "8:00 AM - 10:00 AM", items: [] },
    lunch: { timing: "12:30 PM - 2:00 PM", items: [] },
    dinner: { timing: "7:30 PM - 9:00 PM", items: [] },
  },
  Thursday: {
    breakfast: { timing: "8:00 AM - 10:00 AM", items: [] },
    lunch: { timing: "12:30 PM - 2:00 PM", items: [] },
    dinner: { timing: "7:30 PM - 9:00 PM", items: [] },
  },
  Friday: {
    breakfast: { timing: "8:00 AM - 10:00 AM", items: [] },
    lunch: { timing: "12:30 PM - 2:00 PM", items: [] },
    dinner: { timing: "7:30 PM - 9:00 PM", items: [] },
  },
  Saturday: {
    breakfast: { timing: "8:00 AM - 10:00 AM", items: [] },
    lunch: { timing: "12:30 PM - 2:00 PM", items: [] },
    dinner: { timing: "7:30 PM - 9:00 PM", items: [] },
  },
  Sunday: {
    breakfast: { timing: "8:30 AM - 10:30 AM", items: [] },
    lunch: { timing: "12:30 PM - 2:30 PM", items: [] },
    dinner: { timing: "7:30 PM - 9:30 PM", items: [] },
  },
};

// Backward-compatible alias
export const DEFAULT_WEEKLY_MENU_TEMPLATE = EMPTY_WEEKLY_MENU_TEMPLATE;

/**
 * Helper to get the provider profile for the current user
 */
const getAuthenticatedProvider = async (userId) => {
  const provider = await TiffinProvider.findOne({ userId });
  if (!provider) {
    throw new ApiError(404, "Tiffin provider profile not found for this account");
  }
  return provider;
};

/**
 * Sanitizes input menu object to ensure ONLY valid days and ONLY valid meals (breakfast, lunch, dinner)
 */
const sanitizeSchedule = (inputMenu) => {
  const sanitized = JSON.parse(JSON.stringify(EMPTY_WEEKLY_MENU_TEMPLATE));
  if (!inputMenu || typeof inputMenu !== "object") return sanitized;

  for (const day of DAYS_LIST) {
    const inputDay = inputMenu[day];
    if (!inputDay || typeof inputDay !== "object") continue;

    for (const meal of MEAL_TYPES_LIST) {
      const inputMeal = inputDay[meal];
      if (!inputMeal || typeof inputMeal !== "object") continue;

      if (typeof inputMeal.timing === "string") {
        sanitized[day][meal].timing = inputMeal.timing.trim();
      }

      if (Array.isArray(inputMeal.items)) {
        sanitized[day][meal].items = inputMeal.items
          .filter((dish) => dish && typeof dish.name === "string" && dish.name.trim().length > 0)
          .map((dish, idx) => ({
            id: dish.id || `${day.toLowerCase()}-${meal}-${idx}-${Date.now()}`,
            name: dish.name.trim(),
            diet: dish.diet === "Non-Veg" ? "Non-Veg" : "Veg",
            image:
              (typeof dish.image === "string" && dish.image.trim()) ||
              (typeof dish.imageUrl === "string" && dish.imageUrl.trim()) ||
              "",
          }));
      }
    }
  }

  return sanitized;
};

/**
 * @desc    Fetch provider's weekly schedule (1 document per provider)
 * @route   GET /api/provider/menu
 * @access  Private (Provider only)
 */
export const getWeeklyMenu = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);

  let menuDoc = await WeeklyMenu.findOne({ providerId: provider._id }).lean();

  if (!menuDoc) {
    // Create new clean weekly menu document with empty items
    const newMenu = new WeeklyMenu({
      providerId: provider._id,
      ...EMPTY_WEEKLY_MENU_TEMPLATE,
    });
    await newMenu.save();
    menuDoc = newMenu.toObject();
  }

  // Extract only the 7 day schedules
  const schedule = {};
  for (const day of DAYS_LIST) {
    schedule[day] = menuDoc[day] || EMPTY_WEEKLY_MENU_TEMPLATE[day];
  }

  res.status(200).json({
    success: true,
    data: schedule,
  });
});

/**
 * @desc    Bulk save / synchronize provider's weekly menu atomically
 * @route   PUT /api/provider/menu
 * @access  Private (Provider only)
 */
export const saveWeeklyMenu = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const rawMenu = req.body.menu || req.body;

  if (!rawMenu || typeof rawMenu !== "object") {
    throw new ApiError(400, "Please provide a valid menu object");
  }

  const sanitized = sanitizeSchedule(rawMenu);

  const updatedDoc = await WeeklyMenu.findOneAndUpdate(
    { providerId: provider._id },
    { $set: { providerId: provider._id, ...sanitized } },
    { upsert: true, returnDocument: "after", runValidators: true }
  ).lean();

  const schedule = {};
  for (const day of DAYS_LIST) {
    schedule[day] = updatedDoc[day] || sanitized[day];
  }

  res.status(200).json({
    success: true,
    message: "Weekly menu saved successfully",
    data: schedule,
  });
});

/**
 * @desc    Add a single dish to a specific Day + Meal category
 * @route   POST /api/provider/menu/item
 * @access  Private (Provider only)
 */
export const addMenuItem = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const { day, meal, name, itemName, diet, image, imageUrl, timing } = req.body;

  const targetDay = DAYS_LIST.find((d) => d.toLowerCase() === (day || "").toLowerCase());
  const targetMeal = MEAL_TYPES_LIST.find((m) => m.toLowerCase() === (meal || "").toLowerCase());

  if (!targetDay) throw new ApiError(400, "Invalid day of week");
  if (!targetMeal) throw new ApiError(400, "Invalid meal type (must be breakfast, lunch, or dinner)");

  const dishName = (itemName || name || "").trim();
  if (!dishName) throw new ApiError(400, "Dish name is required");

  let menuDoc = await WeeklyMenu.findOne({ providerId: provider._id });
  if (!menuDoc) {
    menuDoc = new WeeklyMenu({
      providerId: provider._id,
      ...EMPTY_WEEKLY_MENU_TEMPLATE,
    });
  }

  const newItem = {
    id: `${targetDay.toLowerCase()}-${targetMeal}-${Date.now()}`,
    name: dishName,
    diet: diet === "Non-Veg" ? "Non-Veg" : "Veg",
    image: (image || imageUrl || "").trim(),
  };

  if (!menuDoc[targetDay]) menuDoc[targetDay] = {};
  if (!menuDoc[targetDay][targetMeal]) {
    menuDoc[targetDay][targetMeal] = { timing: timing || "", items: [] };
  }

  if (timing) {
    menuDoc[targetDay][targetMeal].timing = timing.trim();
  }

  menuDoc[targetDay][targetMeal].items.push(newItem);
  await menuDoc.save();

  res.status(201).json({
    success: true,
    message: "Item added successfully",
    data: newItem,
  });
});

/**
 * @desc    Update meal window timing or replace dishes for a specific Day + Meal
 * @route   PATCH /api/provider/menu/meal
 * @access  Private (Provider only)
 */
export const updateMealWindow = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const { day, meal, timing, items } = req.body;

  const targetDay = DAYS_LIST.find((d) => d.toLowerCase() === (day || "").toLowerCase());
  const targetMeal = MEAL_TYPES_LIST.find((m) => m.toLowerCase() === (meal || "").toLowerCase());

  if (!targetDay || !targetMeal) {
    throw new ApiError(400, "Valid day and meal type are required");
  }

  let menuDoc = await WeeklyMenu.findOne({ providerId: provider._id });
  if (!menuDoc) {
    menuDoc = new WeeklyMenu({
      providerId: provider._id,
      ...EMPTY_WEEKLY_MENU_TEMPLATE,
    });
  }

  if (!menuDoc[targetDay]) menuDoc[targetDay] = {};
  if (!menuDoc[targetDay][targetMeal]) {
    menuDoc[targetDay][targetMeal] = { timing: "", items: [] };
  }

  if (typeof timing === "string") {
    menuDoc[targetDay][targetMeal].timing = timing.trim();
  }

  if (Array.isArray(items)) {
    menuDoc[targetDay][targetMeal].items = items
      .filter((dish) => dish && dish.name && dish.name.trim())
      .map((dish, idx) => ({
        id: dish.id || `${targetDay.toLowerCase()}-${targetMeal}-${idx}-${Date.now()}`,
        name: dish.name.trim(),
        diet: dish.diet === "Non-Veg" ? "Non-Veg" : "Veg",
        image: dish.image || "",
      }));
  }

  await menuDoc.save();

  res.status(200).json({
    success: true,
    message: "Meal updated successfully",
    data: menuDoc[targetDay][targetMeal],
  });
});

/**
 * @desc    Delete a single menu item by ID
 * @route   DELETE /api/provider/menu/item/:id
 * @access  Private (Provider only)
 */
export const deleteMenuItem = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const itemId = req.params.id;

  let menuDoc = await WeeklyMenu.findOne({ providerId: provider._id });
  if (!menuDoc) {
    throw new ApiError(404, "Weekly menu not found");
  }

  let found = false;
  for (const day of DAYS_LIST) {
    for (const meal of MEAL_TYPES_LIST) {
      if (menuDoc[day]?.[meal]?.items) {
        const initialLen = menuDoc[day][meal].items.length;
        menuDoc[day][meal].items = menuDoc[day][meal].items.filter(
          (it) => String(it.id) !== String(itemId)
        );
        if (menuDoc[day][meal].items.length < initialLen) {
          found = true;
        }
      }
    }
  }

  if (found) {
    await menuDoc.save();
  }

  res.status(200).json({
    success: true,
    message: "Item removed from menu",
  });
});

/**
 * @desc    Batch copy one day's entire meal plan to target days
 * @route   POST /api/provider/menu/copy-day
 * @access  Private (Provider only)
 */
export const copyDayMenu = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);
  const { sourceDay, targetDays } = req.body;

  const validSourceDay = DAYS_LIST.find((d) => d.toLowerCase() === (sourceDay || "").toLowerCase());
  if (!validSourceDay) throw new ApiError(400, "Valid source day is required");
  if (!Array.isArray(targetDays) || targetDays.length === 0) {
    throw new ApiError(400, "Please provide at least one target day");
  }

  let menuDoc = await WeeklyMenu.findOne({ providerId: provider._id });
  if (!menuDoc) {
    menuDoc = new WeeklyMenu({
      providerId: provider._id,
      ...EMPTY_WEEKLY_MENU_TEMPLATE,
    });
  }

  const sourceData = JSON.parse(JSON.stringify(menuDoc[validSourceDay] || EMPTY_WEEKLY_MENU_TEMPLATE[validSourceDay]));

  for (const rawTarget of targetDays) {
    const target = DAYS_LIST.find((d) => d.toLowerCase() === (rawTarget || "").toLowerCase());
    if (!target || target === validSourceDay) continue;
    menuDoc[target] = JSON.parse(JSON.stringify(sourceData));
  }

  await menuDoc.save();

  const schedule = {};
  for (const day of DAYS_LIST) {
    schedule[day] = menuDoc[day] || EMPTY_WEEKLY_MENU_TEMPLATE[day];
  }

  res.status(200).json({
    success: true,
    message: `Menu copied from ${validSourceDay} to target days successfully`,
    data: schedule,
  });
});

/**
 * @desc    Reset kitchen's weekly menu back to clean schedule (no default items)
 * @route   POST /api/provider/menu/reset
 * @access  Private (Provider only)
 */
export const resetWeeklyMenu = asyncHandler(async (req, res) => {
  const provider = await getAuthenticatedProvider(req.user._id);

  const cleanSchedule = JSON.parse(JSON.stringify(EMPTY_WEEKLY_MENU_TEMPLATE));

  const updatedDoc = await WeeklyMenu.findOneAndUpdate(
    { providerId: provider._id },
    { $set: { providerId: provider._id, ...cleanSchedule } },
    { upsert: true, returnDocument: "after" }
  ).lean();

  const schedule = {};
  for (const day of DAYS_LIST) {
    schedule[day] = updatedDoc[day] || cleanSchedule[day];
  }

  res.status(200).json({
    success: true,
    message: "Weekly menu has been reset to a clean schedule",
    data: schedule,
  });
});
