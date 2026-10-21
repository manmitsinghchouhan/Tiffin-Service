import mongoose from "mongoose";

const menuItemEntrySchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String, required: true, trim: true },
    diet: { type: String, enum: ["Veg", "Non-Veg"], default: "Veg" },
    image: { type: String, default: "" },
  },
  { _id: false }
);

const mealSlotSchema = new mongoose.Schema(
  {
    timing: { type: String, default: "" },
    items: { type: [menuItemEntrySchema], default: [] },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
  {
    breakfast: {
      type: mealSlotSchema,
      default: () => ({ timing: "8:00 AM - 10:00 AM", items: [] }),
    },
    lunch: {
      type: mealSlotSchema,
      default: () => ({ timing: "12:30 PM - 2:00 PM", items: [] }),
    },
    dinner: {
      type: mealSlotSchema,
      default: () => ({ timing: "7:30 PM - 9:00 PM", items: [] }),
    },
  },
  { _id: false }
);

const weeklyMenuSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TiffinProvider",
      required: true,
      unique: true,
      index: true,
    },
    Monday: { type: dayScheduleSchema, default: () => ({}) },
    Tuesday: { type: dayScheduleSchema, default: () => ({}) },
    Wednesday: { type: dayScheduleSchema, default: () => ({}) },
    Thursday: { type: dayScheduleSchema, default: () => ({}) },
    Friday: { type: dayScheduleSchema, default: () => ({}) },
    Saturday: { type: dayScheduleSchema, default: () => ({}) },
    Sunday: { type: dayScheduleSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model("WeeklyMenu", weeklyMenuSchema);
