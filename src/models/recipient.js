const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { STATUS } = require("@commonUtils/constants");

const recipientSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
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
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: "active",
    },
    contactNumber: {
      type: String,
       
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Add indexes
recipientSchema.index({ email: 1 }, { unique: true });
module.exports = mongoose.model("Recipient", recipientSchema);
