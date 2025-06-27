const cron = require("node-cron");
const models = require("../models");
const { sendCampaignEmail } = require("../config/email.config");
const {
  CAMPAIGN_STATUS,
  CAMPAIGN_LOGS_STATUS,
} = require("@commonUtils/constants");
const { createEventId } = require("../helpers/helper");

cron.schedule("*/5 * * * *", async () => {
  console.log(`[${new Date().toISOString()}] Running campaign scheduler`);
  try {
    const campaigns = await models.Campaign.find({
      status: CAMPAIGN_STATUS.SCHEDULE,
      scheduledAt: { $lte: new Date() },
      deletedAt: null,
    }).populate("recipients");

    for (const campaign of campaigns) {
      const eventId = createEventId();
      for (const recipient of campaign.recipients) {
        try {
          const campaignLogs = await models.CampaignLogs.create({
            campaignId: campaign._id,
            recipientId: recipient._id,
            email: recipient.email,
            status: CAMPAIGN_LOGS_STATUS.PENDING,
            eventId,
          });

          await sendCampaignEmail(
            recipient.email,
            campaign.subject,
            campaign.content,
            campaignLogs._id
          );

          await models.CampaignLogs.updateOne(
            { campaignId: campaign._id, recipientId: recipient._id, eventId },
            { status: CAMPAIGN_LOGS_STATUS.DELIVERED, sentAt: new Date() }
          );
        } catch (err) {
          await models.CampaignLogs.updateOne(
            { campaign: campaign._id, recipient: recipient._id, eventId },
            {
              status: CAMPAIGN_LOGS_STATUS.DEBOUNCED,
              errorMessage: err.message,
              $inc: { retryCount: 1 },
            }
          );
        }
      }

      campaign.status = CAMPAIGN_STATUS.SENT;
      await campaign.save();
    }
    console.log("Campaign scheduler executed successfully");
  } catch (err) {
    console.error("Error running campaign scheduler:", err);
  }
});
