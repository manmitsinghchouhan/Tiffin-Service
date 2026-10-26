import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Do not expose password hash in default queries
    },
    role: {
      type: String,
      enum: {
        values: ["ADMIN", "CUSTOMER", "PROVIDER"],
        message: "{VALUE} is not a valid user role",
      },
      default: "CUSTOMER",
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "INACTIVE", "SUSPENDED"],
        message: "{VALUE} is not a valid account status",
      },
      default: "ACTIVE",
    },
    addresses: [
      {
        label: {
          type: String,
          default: "Home",
          trim: true,
        },
        street: {
          type: String,
          required: [true, "Street address is required"],
          trim: true,
        },
        city: {
          type: String,
          required: [true, "City is required"],
          trim: true,
        },
        postalCode: {
          type: String,
          default: "",
          trim: true,
        },
        landmark: {
          type: String,
          default: "",
          trim: true,
        },
        contactPhone: {
          type: String,
          default: "",
          trim: true,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    savedKitchens: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TiffinProvider",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Hash password before saving if modified
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
