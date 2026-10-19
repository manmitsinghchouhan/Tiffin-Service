import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import {
  User,
  TiffinProvider,
  TiffinPlan,
  MenuItem,
  Order,
  Subscription,
  Payment,
  Feedback,
} from "../src/models/index.js";

test("User Model - Validates required fields and enums", async () => {
  const user = new User({});
  let err;
  try {
    await user.validate();
  } catch (error) {
    err = error;
  }

  assert.ok(err, "Validation error expected");
  assert.ok(err.errors.name, "Name should be required");
  assert.ok(err.errors.email, "Email should be required");
  assert.ok(err.errors.phone, "Phone should be required");
  assert.ok(err.errors.password, "Password should be required");

  const validUser = new User({
    name: "John Doe",
    email: "john@example.com",
    phone: "9876543210",
    password: "securepassword",
    role: "CUSTOMER",
    status: "ACTIVE",
  });
  await validUser.validate();
});

test("TiffinProvider Model - Validates required fields and defaults", async () => {
  const provider = new TiffinProvider({});
  let err;
  try {
    await provider.validate();
  } catch (error) {
    err = error;
  }

  assert.ok(err, "Validation error expected");
  assert.ok(err.errors.userId, "userId should be required");
  assert.ok(err.errors.businessName, "businessName should be required");
  assert.ok(err.errors.contactNumber, "contactNumber should be required");
  assert.ok(err.errors.address, "address should be required");
  assert.ok(err.errors.city, "city should be required");

  const validProvider = new TiffinProvider({
    userId: new mongoose.Types.ObjectId(),
    businessName: "Maa Ki Rasoi",
    contactNumber: "9123456780",
    address: "123 Street",
    city: "Ahmedabad",
    foodType: "VEG",
  });
  assert.equal(validProvider.verificationStatus, "PENDING");
  await validProvider.validate();
});

test("TiffinPlan Model - Validates duration and price constraints", async () => {
  const plan = new TiffinPlan({
    providerId: new mongoose.Types.ObjectId(),
    name: "Standard Lunch",
    durationDays: -1,
    mealsPerDay: 0,
    price: -50,
  });
  let err;
  try {
    await plan.validate();
  } catch (error) {
    err = error;
  }

  assert.ok(err, "Validation error expected");
  assert.ok(err.errors.durationDays, "durationDays should be >= 1");
  assert.ok(err.errors.mealsPerDay, "mealsPerDay should be >= 1");
  assert.ok(err.errors.price, "price should be >= 0");
});

test("MenuItem Model - Validates days and meal types", async () => {
  const item = new MenuItem({
    planId: new mongoose.Types.ObjectId(),
    providerId: new mongoose.Types.ObjectId(),
    dayOfWeek: "INVALID_DAY",
    mealType: "MIDNIGHT_SNACK",
    itemName: "Dal Makhani",
  });
  let err;
  try {
    await item.validate();
  } catch (error) {
    err = error;
  }

  assert.ok(err, "Validation error expected");
  assert.ok(err.errors.dayOfWeek, "dayOfWeek must be an allowed enum");
  assert.ok(err.errors.mealType, "mealType must be an allowed enum");
});

test("Order Model - Validates plan snapshot and status", async () => {
  const validOrder = new Order({
    customerId: new mongoose.Types.ObjectId(),
    providerId: new mongoose.Types.ObjectId(),
    planId: new mongoose.Types.ObjectId(),
    quantity: 2,
    deliveryAddress: {
      street: "45 MG Road",
      city: "Ahmedabad",
      postalCode: "380001",
    },
    totalAmount: 500,
    planSnapshot: {
      name: "Daily Veg Delight",
      price: 250,
      durationDays: 1,
      mealsPerDay: 1,
    },
    status: "PENDING",
  });
  await validOrder.validate();
});

test("Payment Model - Enforces exactly one reference of orderId or subscriptionId", async () => {
  // Case 1: Both provided -> should fail
  const paymentBoth = new Payment({
    customerId: new mongoose.Types.ObjectId(),
    orderId: new mongoose.Types.ObjectId(),
    subscriptionId: new mongoose.Types.ObjectId(),
    amount: 1000,
    paymentMethod: "UPI",
  });

  await assert.rejects(
    async () => paymentBoth.validate(),
    /A payment must be linked to either an order or a subscription, but not both or neither/,
  );

  // Case 2: Neither provided -> should fail
  const paymentNeither = new Payment({
    customerId: new mongoose.Types.ObjectId(),
    amount: 1000,
    paymentMethod: "UPI",
  });

  await assert.rejects(
    async () => paymentNeither.validate(),
    /A payment must be linked to either an order or a subscription, but not both or neither/,
  );

  // Case 3: Exactly one provided -> should succeed
  const paymentValid = new Payment({
    customerId: new mongoose.Types.ObjectId(),
    orderId: new mongoose.Types.ObjectId(),
    amount: 1000,
    paymentMethod: "UPI",
  });
  await paymentValid.validate();
});

test("Feedback Model - Validates rating bounds (1-5)", async () => {
  const invalidFeedback = new Feedback({
    customerId: new mongoose.Types.ObjectId(),
    providerId: new mongoose.Types.ObjectId(),
    rating: 6,
  });
  let err;
  try {
    await invalidFeedback.validate();
  } catch (error) {
    err = error;
  }

  assert.ok(err, "Validation error expected");
  assert.ok(err.errors.rating, "Rating must not exceed 5");
});
