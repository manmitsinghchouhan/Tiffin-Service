import asyncHandler from "../utils/asyncHandler.js";
import User from "../models/User.js";

/**
 * @desc    Get all saved addresses for the logged-in customer
 * @route   GET /api/customer/addresses
 * @access  Private (Customer only)
 */
export const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("addresses");
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.status(200).json({
    success: true,
    data: user.addresses || [],
  });
});

/**
 * @desc    Add a new address to customer address book
 * @route   POST /api/customer/addresses
 * @access  Private (Customer only)
 */
export const addAddress = asyncHandler(async (req, res) => {
  const { label, street, city, postalCode, landmark, contactPhone, isDefault } = req.body;

  if (!street || !street.trim()) {
    return res.status(400).json({ success: false, message: "Street address is required" });
  }
  if (!city || !city.trim()) {
    return res.status(400).json({ success: false, message: "City is required" });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const shouldBeDefault = Boolean(isDefault) || (user.addresses && user.addresses.length === 0);

  // If this address should be default, unset all others
  if (shouldBeDefault && user.addresses && user.addresses.length > 0) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  const newAddress = {
    label: (label && label.trim()) || "Home",
    street: street.trim(),
    city: city.trim(),
    postalCode: (postalCode && postalCode.trim()) || "",
    landmark: (landmark && landmark.trim()) || "",
    contactPhone: (contactPhone && contactPhone.trim()) || user.phone || "",
    isDefault: shouldBeDefault,
  };

  user.addresses.push(newAddress);
  await user.save();

  const createdAddress = user.addresses[user.addresses.length - 1];

  res.status(201).json({
    success: true,
    message: "Address saved to Address Book",
    data: createdAddress,
    addresses: user.addresses,
  });
});

/**
 * @desc    Update an existing address in customer address book
 * @route   PUT /api/customer/addresses/:id
 * @access  Private (Customer only)
 */
export const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { label, street, city, postalCode, landmark, contactPhone, isDefault } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const addr = user.addresses.id(id);
  if (!addr) {
    return res.status(404).json({ success: false, message: "Address not found" });
  }

  if (isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
    addr.isDefault = true;
  }

  if (label !== undefined) addr.label = label.trim() || addr.label;
  if (street !== undefined) addr.street = street.trim();
  if (city !== undefined) addr.city = city.trim();
  if (postalCode !== undefined) addr.postalCode = postalCode.trim();
  if (landmark !== undefined) addr.landmark = landmark.trim();
  if (contactPhone !== undefined) addr.contactPhone = contactPhone.trim();

  await user.save();

  res.status(200).json({
    success: true,
    message: "Address updated successfully",
    data: addr,
    addresses: user.addresses,
  });
});

/**
 * @desc    Set an address as default
 * @route   PATCH /api/customer/addresses/:id/default
 * @access  Private (Customer only)
 */
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const targetAddr = user.addresses.id(id);
  if (!targetAddr) {
    return res.status(404).json({ success: false, message: "Address not found" });
  }

  user.addresses.forEach((a) => {
    a.isDefault = a._id.toString() === id.toString();
  });

  await user.save();

  res.status(200).json({
    success: true,
    message: "Default address updated",
    addresses: user.addresses,
  });
});

/**
 * @desc    Delete an address from customer address book
 * @route   DELETE /api/customer/addresses/:id
 * @access  Private (Customer only)
 */
export const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const addr = user.addresses.id(id);
  if (!addr) {
    return res.status(404).json({ success: false, message: "Address not found" });
  }

  const wasDefault = addr.isDefault;
  user.addresses.pull({ _id: id });

  // If deleted was default and there are still addresses left, make the first one default
  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: "Address deleted successfully",
    addresses: user.addresses,
  });
});
