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
    lastOpenedAt: {
      type: Date,
      default: null,
    },
    eventId: {
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

campaignLogsSchema.index({ campaign: 1 });
campaignLogsSchema.index({ recipient: 1 });
campaignLogsSchema.index({ status: 1 });
module.exports = mongoose.model("CampaignLogs", campaignLogsSchema);
