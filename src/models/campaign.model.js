const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { CAMPAIGN_STATUS } = require("@commonUtils/constants");

const campaignSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxlength: 255,
    },
    subject: {
      type: String,
      required: true,
      maxlength: 255,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CAMPAIGN_STATUS),
      default: CAMPAIGN_STATUS.DRAFT,
    },
    template: {
      type: String,
      required: true,
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipient",
      },
    ],
    scheduledAt: {
      type: Date,
      default: null,
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
campaignSchema.index({ status: 1 });
campaignSchema.index({ name: 1 });
campaignSchema.index({ scheduledAt: 1 });

module.exports = mongoose.model("Campaign", campaignSchema);
