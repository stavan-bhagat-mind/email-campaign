const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { CAMPAIGN_LOGS_STATUS } = require("@commonUtils/constants");

const campaignLogsSchema = new Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipient",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(CAMPAIGN_LOGS_STATUS),
      default: CAMPAIGN_LOGS_STATUS.PENDING,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
    },
    opened: {
      type: Number,
      default: 0,
    },

    firstOpenedAt: {
      type: Date,
      default: null,
      description:
        "When the email was first opened (different from lastOpenedAt)",
    },

    lastOpenedAt: {
      type: Date,
      default: null,
    },
    messageId: {
      type: String,
    },
    eventId: {
      type: String,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    //
    totalPixelLoads: {
      type: Number,
      default: 0,
      description:
        "Total number of times tracking pixel was loaded (includes forwards, previews, etc.)",
    },
    trackingLog: [
      {
        timestamp: {
          type: Date,
          required: true,
          default: Date.now,
        },
        ip: {
          type: String,
          default: null,
        },
        userAgent: {
          type: String,
          default: null,
        },
        countedAsOpen: {
          type: Boolean,
          default: false,
          description:
            "Whether this pixel load was counted as a legitimate open",
        },
      },
    ],
    uniqueOpens: {
      type: Number,
      default: 0,
      description:
        "Number of unique opens (rate-limited, more accurate than 'opened')",
    },
  },
  {
    timestamps: true,
  }
);

campaignLogsSchema.index({ campaign: 1 });
campaignLogsSchema.index({ recipient: 1 });
campaignLogsSchema.index({ status: 1 });
module.exports = mongoose.model("CampaignLogs", campaignLogsSchema);
