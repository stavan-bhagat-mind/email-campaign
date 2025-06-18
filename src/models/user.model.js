const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { STATUS } = require("@commonUtils/constants");

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,

      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpiry: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: "active",
    },
    company: {
      type: String,
    },
    contactNumber: {
      type: String,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    profilePictureUrl: {
      type: String,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes
userSchema.index({ email: 1 }, { unique: true });
module.exports = mongoose.model("User", userSchema);
