const Models = require("../../../models");
const { RECIPIENT } = require("../../../utils/common/constants");
const crypto = require("crypto");
const {
  successResponseData,
  errorResponseWithoutData,
  validationErrorResponseData,
} = require("../../../utils/response");
const {
  validateBulkCreateRecipients,
  validateUpdateRecipients,
  validateBulkDeleteRecipients,
  validateCreateCampaign,
  validateUpdateCampaign,
} = require("../validation/user.validation");
const {
  STATUS_SUCCESS,
  STATUS_CREATED,
  STATUS_BAD_REQUEST,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS,
  CAMPAIGN_STATUS,
  STATUS_NOT_FOUND,
  CAMPAIGN_LOGS_STATUS,
} = require("@commonUtils/constants");
const {
  COMMON_MSG,
  MSG_INTERNAL_SERVER_ERROR,
  MSG_NOT_ALLOWED,
} = require("@commonUtils/messages");
const { CAMPAIGN } = require("../utils/user.constants");
const { models } = require("mongoose");
const mongoose = require("mongoose");
// const { sendCampaignEmail } = require("../../../config/email.config");
const { sendCampaignEmail } = require("../../../config/sendGrid.config");
const { createEventId } = require("../../../helpers/helper");

// recipient handlers
const bulkCreateRecipientsHandler = async (req, res) => {
  try {
    const { success, value } = validateBulkCreateRecipients(req.body, res);
    if (!success) {
      const messages = value.map((err) => err.message);
      return validationErrorResponseData(res, messages);
    }

    const userId = req.userId;
    const formattedRecipients = value.map((r) => ({
      ...r,
      userId,
      status: STATUS.ACTIVE,
    }));

    const inserted = await Models.Recipient.insertMany(formattedRecipients, {
      ordered: false,
    });

    return successResponseData(
      res,
      { insertedCount: inserted.length },
      STATUS_CREATED,
      COMMON_MSG.CREATED_SUCCESS.replace("##", RECIPIENT)
    );
  } catch (error) {
    console.error("Bulk create error:", error.message);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      MSG_INTERNAL_SERVER_ERROR
    );
  }
};

const bulkDeleteRecipientsHandler = async (req, res) => {
  try {
    const { success, value } = validateBulkDeleteRecipients(req.body, res);
    if (!success) {
      const messages = value.map((err) => err.message);
      return validationErrorResponseData(res, messages);
    }
    const userId = req.userId;
    const ids = [];
    for (const element of value) {
      ids.push(element.id);
    }
    const result = await Models.Recipient.updateMany(
      { _id: { $in: ids }, userId },
      { $set: { deletedAt: new Date() } }
    );

    return successResponseData(
      res,
      { deletedCount: result.modifiedCount },
      STATUS_SUCCESS,
      COMMON_MSG.DELETED_SUCCESS.replace("##", RECIPIENT)
    );
  } catch (error) {
    console.error("Bulk delete error:", error.message);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      "Error deleting recipients"
    );
  }
};

const updateRecipientHandler = async (req, res) => {
  try {
    const { success, value } = validateUpdateRecipients(req.body);
    if (!success) {
      const messages = value.map((err) => err.message);
      return validationErrorResponseData(res, messages);
    }

    const userId = req.userId;
    const { id } = req.params;

    const recipient = await Models.Recipient.findOneAndUpdate(
      { _id: id, userId, deletedAt: null },
      value,
      { new: true }
    );

    if (!recipient) {
      return errorResponseWithoutData(
        res,
        STATUS_BAD_REQUEST,
        "Recipient not found"
      );
    }

    return successResponseData(
      res,
      recipient,
      STATUS_SUCCESS,
      "Recipient updated"
    );
  } catch (error) {
    console.error("Update error:", error.message);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      "Error updating recipient"
    );
  }
};

const getRecipientsHandler = async (req, res) => {
  try {
    const userId = req.userId;
    let { page, per_page } = req.query;
    page = parseInt(page, 10) || 1;
    const perPage = parseInt(per_page, 10) || 10;
    const offset = (page - 1) * perPage;

    const query = {
      userId,
      deletedAt: null,
    };

    const [recipients, totalCount] = await Promise.all([
      Models.Recipient.find(query, { deletedAt: 0 })
        .skip(offset)
        .limit(perPage),
      Models.Recipient.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / per_page);
    return successResponseData(
      res,
      recipients,
      STATUS_SUCCESS,
      COMMON_MSG.FETCHED_SUCCESS.replace("##", RECIPIENT),
      {
        pagination: {
          total: totalCount,
          perPage,
          currentPage: page,
          totalPages: totalPages,
        },
      }
    );
  } catch (error) {
    console.error("Fetch error:", error.message);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      "Error fetching recipients"
    );
  }
};

// campaign handlers
const createCampaignHandler = async (req, res) => {
  try {
    const { success, value } = validateCreateCampaign(req.body);
    if (!success) {
      const messages = value.map((err) => err.message);
      return validationErrorResponseData(res, messages);
    }

    const userId = req.userId;
    const { name, subject, content, template, recipients } = value;

    const campaignData = {
      userId,
      name,
      subject,
      content,
      template,
      recipients,
    };

    const newCampaign = await Models.Campaign.create(campaignData);

    return successResponseData(
      res,
      { campaignId: newCampaign._id },
      STATUS_CREATED,
      COMMON_MSG.CREATED_SUCCESS.replace("##", CAMPAIGN)
    );
  } catch (error) {
    console.error("Create campaign error:", error);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      MSG_INTERNAL_SERVER_ERROR
    );
  }
};

const updateCampaignHandler = async (req, res) => {
  try {
    const { success, value } = validateUpdateCampaign(req.body);
    if (!success) {
      const messages = value.map((err) => err.message);
      return validationErrorResponseData(res, messages);
    }

    const { campaignId } = req.params;
    const userId = req.userId;

    const campaign = await Models.Campaign.findOne({
      _id: campaignId,
      userId,
      deletedAt: null,
    });

    if (!campaign) {
      return errorResponseWithoutData(
        res,
        STATUS_NOT_FOUND,
        COMMON_MSG.NOT_FOUND("##", CAMPAIGN)
      );
    }

    const editableStatuses = [
      CAMPAIGN_STATUS.DRAFT,
      CAMPAIGN_STATUS.FAILED,
      CAMPAIGN_STATUS.SENT,
    ];

    if (!editableStatuses.includes(campaign.status)) {
      return errorResponseWithoutData(
        res,
        STATUS_BAD_REQUEST,
        MSG_NOT_ALLOWED.replace("##", CAMPAIGN)
      );
    }

    const allowedFields = [
      "name",
      "subject",
      "content",
      "template",
      "recipients",
    ];
    allowedFields.forEach((field) => {
      if (value[field] !== undefined) {
        campaign[field] = value[field];
      }
    });

    await campaign.save();

    return successResponseData(
      res,
      { campaignId: campaign._id },
      STATUS_SUCCESS,
      COMMON_MSG.UPDATED_SUCCESS.replace("##", CAMPAIGN)
    );
  } catch (err) {
    console.error("Update campaign error:", err);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      MSG_INTERNAL_SERVER_ERROR
    );
  }
};

const deleteCampaignHandler = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.userId;

    const campaign = await Models.Campaign.findOne({
      _id: campaignId,
      userId,
      deletedAt: null,
    });

    if (!campaign) {
      return errorResponseWithoutData(
        res,
        STATUS_NOT_FOUND,
        COMMON_MSG.NOT_FOUND.replace("##", CAMPAIGN)
      );
    }
    if (campaign.status !== CAMPAIGN_STATUS.DRAFT) {
      return errorResponseWithoutData(
        res,
        STATUS_BAD_REQUEST,
        MSG_NOT_ALLOWED.replace("##", CAMPAIGN)
      );
    }
    campaign.deletedAt = new Date();
    await campaign.save();

    return successResponseData(
      res,
      { campaignId: campaign._id },
      STATUS_SUCCESS,
      COMMON_MSG.DELETED_SUCCESS.replace("##", CAMPAIGN)
    );
  } catch (err) {
    console.error("Delete campaign error:", err);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      MSG_INTERNAL_SERVER_ERROR
    );
  }
};

const cancleScheduleCampaignHandler = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = await Models.Campaign.findOne({
      _id: campaignId,
      userId: req.userId,
    });
    if (!campaign || campaign.status !== CAMPAIGN_STATUS.SCHEDULE) {
      return errorResponseWithoutData(
        res,
        STATUS_NOT_FOUND,
        MSG_NOT_ALLOWED.replace("##", CAMPAIGN)
      );
    }
    campaign.status = CAMPAIGN_STATUS.DRAFT;
    campaign.scheduledAt = null;
    await campaign.save();

    return successResponseData(
      res,
      campaign,
      STATUS_SUCCESS,
      COMMON_MSG.UPDATED_SUCCESS.replace("##", CAMPAIGN)
    );
  } catch (err) {
    console.error("cancleScheduleCampaignHandler", err);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      MSG_INTERNAL_SERVER_ERROR
    );
  }
};

const scheduleCampaignHandler = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { scheduledAt } = req.body;

    const campaign = await models.Campaign.findOne({
      _id: campaignId,
      userId: req.userId,
      deletedAt: null,
    });
    if (!campaign) {
      return errorResponseWithoutData(
        res,
        STATUS_NOT_FOUND,
        COMMON_MSG.NOT_FOUND.replace("##", CAMPAIGN)
      );
    }

    const editableStatuses = [CAMPAIGN_STATUS.DRAFT, CAMPAIGN_STATUS.SENT];

    if (!editableStatuses.includes(campaign.status)) {
      return errorResponseWithoutData(
        res,
        STATUS_BAD_REQUEST,
        MSG_NOT_ALLOWED.replace("##", CAMPAIGN)
      );
    }

    campaign.status = "scheduled";
    campaign.scheduledAt = scheduledAt;
    await campaign.save();

    return res.json({ message: "Campaign scheduled successfully" });
  } catch (err) {
    console.error("Schedule error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getCampaignLogsHandler = async (req, res) => {
  try {
    const { campaignId } = req.params;

    // const logs = await models.CampaignLogs.find({ campaignId })
    //   .populate("recipientId")
    //   .sort({ createdAt: -1 });

    const logs = await models.CampaignLogs.aggregate([
      { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
      {
        $group: {
          _id: "$eventId",
          logs: { $push: "$$ROOT" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.json({ logs });
  } catch (err) {
    console.error("Logs error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getCampaignListHandler = async (req, res) => {
  try {
    const userId = req.userId;
    let { page, per_page } = req.query;
    page = parseInt(page, 10) || 1;
    const perPage = parseInt(per_page, 10) || 10;
    const offset = (page - 1) * perPage;
    const query = {
      userId,
      deletedAt: null,
    };
    const [campaigns, totalCount] = await Promise.all([
      Models.Campaign.find(query, { deletedAt: 0 }).skip(offset).limit(perPage),
      Models.Campaign.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalCount / per_page);
    return successResponseData(
      res,
      campaigns,
      STATUS_SUCCESS,
      COMMON_MSG.FETCHED_SUCCESS.replace("##", RECIPIENT),
      {
        pagination: {
          total: totalCount,
          perPage,
          currentPage: page,
          totalPages: totalPages,
        },
      }
    );
  } catch (error) {
    console.error("Fetch error:", error.message);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      "Error fetching recipients"
    );
  }
};

// const sendCampaignHandler = async (req, res) => {
//   try {
//     const { campaignId } = req.params;
//     const userId = req.userId;

//     const campaign = await Models.Campaign.findOne({
//       _id: campaignId,
//       userId,
//       deletedAt: null,
//     }).populate("recipients");

//     if (!campaign) {
//       return errorResponseWithoutData(
//         res,
//         STATUS_NOT_FOUND,
//         COMMON_MSG.NOT_FOUND.replace("##", CAMPAIGN)
//       );
//     }
//     const validStatuses = [
//       CAMPAIGN_STATUS.DRAFT,
//       CAMPAIGN_STATUS.SENT,
//       CAMPAIGN_STATUS.FAILED,
//     ];
//     if (!validStatuses.includes(campaign.status)) {
//       return errorResponseWithoutData(
//         res,
//         STATUS_BAD_REQUEST,
//         MSG_NOT_ALLOWED.replace("##", CAMPAIGN)
//       );
//     }

//     if (!campaign.recipients || campaign.recipients.length === 0) {
//       return errorResponseWithoutData(
//         res,
//         STATUS_BAD_REQUEST,
//         "Campaign has no recipients"
//       );
//     }

//     const results = [];
//     const eventId = createEventId();
//     for (const recipient of campaign.recipients) {
//       const log = await models.CampaignLogs.create({
//         campaignId: campaign._id,
//         recipientId: recipient._id,
//         email: recipient.email,
//         status: CAMPAIGN_LOGS_STATUS.PENDING,
//         eventId,
//       });

//       const emailResult = await sendCampaignEmail(
//         recipient.email,
//         campaign.subject,
//         campaign.content,
//         log._id.toString()
//       );

//       await Models.CampaignLogs.updateOne(
//         { campaignId: campaign._id, recipientId: recipient._id, eventId },
//         {
//           status: emailResult
//             ? CAMPAIGN_LOGS_STATUS.DELIVERE
//             : CAMPAIGN_LOGS_STATUS.DEBOUNCED,
//           sentAt: new Date(),
//         }
//       );

//       results.push(emailResult);
//     }

//     campaign.status = CAMPAIGN_STATUS.SENT;
//     campaign.sentAt = new Date();
//     await campaign.save();

//     return successResponseData(
//       res,
//       { sentCount: results.length },
//       STATUS_SUCCESS,
//       "Campaign sent successfully"
//     );
//   } catch (err) {
//     console.error("Send now error:", err);
//     return errorResponseWithoutData(
//       res,
//       STATUS_INTERNAL_SERVER_ERROR,
//       "Failed to send campaign"
//     );
//   }
// };

const sendCampaignHandler = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const userId = req.userId;

    const campaign = await Models.Campaign.findOne({
      _id: campaignId,
      userId,
      deletedAt: null,
    }).populate("recipients");

    if (!campaign) {
      return errorResponseWithoutData(
        res,
        STATUS_NOT_FOUND,
        COMMON_MSG.NOT_FOUND.replace("##", CAMPAIGN)
      );
    }
    const validStatuses = [
      CAMPAIGN_STATUS.DRAFT,
      CAMPAIGN_STATUS.SENT,
      CAMPAIGN_STATUS.FAILED,
    ];
    if (!validStatuses.includes(campaign.status)) {
      return errorResponseWithoutData(
        res,
        STATUS_BAD_REQUEST,
        MSG_NOT_ALLOWED.replace("##", CAMPAIGN)
      );
    }

    if (!campaign.recipients || campaign.recipients.length === 0) {
      return errorResponseWithoutData(
        res,
        STATUS_BAD_REQUEST,
        "Campaign has no recipients"
      );
    }

    const results = [];
    const eventId = createEventId();
    const messageId = `<${crypto
      .randomBytes(16)
      .toString("hex")}@yourdomain.com>`;
    const now = new Date();

    // Find the sender's email based on userId
    const senderRecipient = await Models.Recipient.findOne({ userId });
    const senderEmail = senderRecipient ? senderRecipient.email : null;

    for (const recipient of campaign.recipients) {
      const isSender = senderEmail && recipient.email === senderEmail;
      const log = await Models.CampaignLogs.create({
        campaignId: campaign._id,
        recipientId: recipient._id,
        email: recipient.email,
        status: CAMPAIGN_LOGS_STATUS.PENDING,
        eventId,
      });

      const emailResult = await sendCampaignEmail(
        recipient.email,
        campaign.subject,
        campaign.content,
        log._id.toString(),
        !isSender, // Include pixel only for non-sender recipients
        messageId
      );

      await Models.CampaignLogs.updateOne(
        { campaignId: campaign._id, recipientId: recipient._id, eventId },
        {
          status: emailResult
            ? CAMPAIGN_LOGS_STATUS.DELIVERED
            : CAMPAIGN_LOGS_STATUS.DEBOUNCED,
          sentAt: now,
        }
      );

      results.push(emailResult);
    }

    campaign.status = CAMPAIGN_STATUS.SENT;
    campaign.sentAt = now;
    await campaign.save();

    return successResponseData(
      res,
      { sentCount: results.length },
      STATUS_SUCCESS,
      "Campaign sent successfully"
    );
  } catch (err) {
    console.error("Send now error:", err);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      "Failed to send campaign"
    );
  }
};

const getCampaignHandler = async (req, res) => {
  try {
    const userId = req.userId;
    const { campaignId } = req.params;

    // Fetch the campaign to verify existence
    const campaign = await Models.Campaign.findOne({
      userId,
      _id: campaignId,
      deletedAt: null,
    }).select({ deletedAt: 0 });

    if (!campaign) {
      return errorResponseWithoutData(
        res,
        STATUS_NOT_FOUND,
        COMMON_MSG.NOT_FOUND.replace("##", CAMPAIGN)
      );
    }

    // Fetch all campaign logs for the campaign
    const campaignLogs = await Models.CampaignLogs.find({
      campaignId: campaignId,
    });

    // Calculate statistics
    const stats = {
      totalSent: 0,
      pending: 0,
      delivered: 0,
      failed: 0,
      opened: 0,
      uniqueOpens: 0,
      totalPixelLoads: 0,
      firstOpenedAt: null,
      lastOpenedAt: null,
      openRate: 0,
    };

    campaignLogs.forEach((log) => {
      if (log.sentAt) stats.totalSent++;

      if (log.status === CAMPAIGN_LOGS_STATUS.DELIVERED) stats.delivered++;

      if (log.status === CAMPAIGN_LOGS_STATUS.DEBOUNCED || log.errorMessage)
        stats.failed++;

      if (log.opened > 0) stats.opened++;

      if (log.uniqueOpens > 0) stats.uniqueOpens++;

      stats.totalPixelLoads += log.totalPixelLoads || 0;

      if (log.status === CAMPAIGN_LOGS_STATUS.PENDING) stats.pending++;
      if (
        log.firstOpenedAt &&
        (!stats.firstOpenedAt || log.firstOpenedAt < stats.firstOpenedAt)
      ) {
        stats.firstOpenedAt = log.firstOpenedAt;
      }
      if (
        log.lastOpenedAt &&
        (!stats.lastOpenedAt || log.lastOpenedAt > stats.lastOpenedAt)
      ) {
        stats.lastOpenedAt = log.lastOpenedAt;
      }
    });

    if (stats.delivered > 0) {
      stats.openRate = Math.round((stats.uniqueOpens / stats.delivered) * 100);
    }

    const responseData = {
      ...campaign.toObject(),
      stats,
    };

    return successResponseData(
      res,
      responseData,
      STATUS_SUCCESS,
      COMMON_MSG.FETCHED_SUCCESS.replace("##", CAMPAIGN)
    );
  } catch (error) {
    console.error("Fetch error:", error.message);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      "Error fetching campaign"
    );
  }
};

const emailTrackingHandlerOriginal = async (req, res) => {
  const { campaignLogId } = req.params;
  const { email, sig } = req.query;

  const expectedSig = crypto
    .createHmac("sha256", process.env.TRACKING_SECRET)
    .update(`${email}|${campaignLogId}`)
    .digest("hex");

  if (sig !== expectedSig) {
    return res.status(403).send("Invalid signature");
  }
  console.log(sig, expectedSig);

  try {
    const log = await Models.CampaignLogs.findById(campaignLogId);
    if (!log) return res.status(404).send("Log not found");

    const recipient = await Models.Recipient.findById(log.recipientId);
    if (!recipient) return res.status(404).send("Recipient not found");

    if (recipient.email !== email) {
      return res.status(403).send("Email does not match recipient");
    }
    const campaignLlog = await Models.CampaignLogs.findById(campaignLogId);
    console.log("log", campaignLlog);
    if (campaignLlog) {
      await Models.CampaignLogs.updateOne(
        { _id: campaignLogId },
        {
          $inc: { opened: 1 },
          $set: { lastOpenedAt: new Date() },
        }
      );
    }

    const imgBuffer = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
      "base64"
    );

    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Content-Length", imgBuffer.length);
    res.status(200).end(imgBuffer);
  } catch (err) {
    console.error("Send now error:", err);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      "Failed to send campaign"
    );
  }
};

const emailTrackingHandler = async (req, res) => {
  const { campaignLogId } = req.params;
  const { email, sig } = req.query;

  const pixel = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
    "base64"
  );
  res.setHeader("Content-Type", "image/gif");
  res.setHeader("Cache-Control", "no-cache");

  try {
    if (!isValidSignature(email, campaignLogId, sig)) {
      return res.end(pixel);
    }

    const now = new Date();
    const threeHoursAgo = new Date(
      now.getTime() -
        15 *
          // 60 *
          60 *
          1000
    );

    const log = await Models.CampaignLogs.findById(campaignLogId);

    if (!log) return res.end(pixel);

    let countedAsOpen = false;

    // rate limit
    if (!log.lastOpenedAt || log.lastOpenedAt < threeHoursAgo) {
      countedAsOpen = true;

      const updateFields = {
        $inc: {
          opened: 1,
          uniqueOpens: 1,
        },
        $set: {
          lastOpenedAt: now,
          status: CAMPAIGN_LOGS_STATUS.OPENED,
        },
      };

      if (!log.firstOpenedAt) {
        updateFields.$set.firstOpenedAt = now;
      }

      await Models.CampaignLogs.updateOne({ _id: campaignLogId }, updateFields);
    }

    // Log pixel load attempt
    await Models.CampaignLogs.updateOne(
      { _id: campaignLogId },
      {
        $inc: { totalPixelLoads: 1 },
        $push: {
          trackingLog: {
            timestamp: now,
            ip: req.ip,
            userAgent: req.get("User-Agent"),
            countedAsOpen,
          },
        },
        $set: {
          lastOpenedAt: now,
        },
      }
    );

    console.log("Tracking pixel processed for:", campaignLogId);
  } catch (error) {
    console.error("Tracking error:", error);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      "Failed to send campaign"
    );
  }

  res.end(pixel);
};

function isValidSignature(email, campaignLogId, sig) {
  if (!email || !campaignLogId || !sig) return false;

  const secret = process.env.TRACKING_SECRET;
  const baseString = `${email}|${campaignLogId}`;

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(baseString)
    .digest("hex");

  return sig === expectedSig;
}

const sendgridEventHandler = async (req, res) => {
  const events = req.body;

  for (const event of events) {
    const campaignLogId = event.campaignLogId;
    const timestamp = event.timestamp * 1000;

    if (!campaignLogId) {
      console.warn("No campaignLogId in event", event);
      continue;
    }

    const log = await Models.CampaignLogs.findById(campaignLogId).populate(
      "recipientId",
      "email"
    );

    if (!log || !log.recipientId) {
      console.warn(
        "Log or recipient not found for campaignLogId:",
        campaignLogId
      );
      continue;
    }

    const recipientEmail = log.recipientId.email;

    if (recipientEmail !== event.email) {
      console.warn("Open event ignored due to email mismatch:", {
        expected: recipientEmail,
        got: event.email,
      });
      continue;
    }

    if (event.event === "open") {
      const now = new Date(timestamp);
      const sentAt = log.sentAt;
      const MIN_DELAY_MS = 15 * 1000; // 15 seconds
      const timeSinceSent = sentAt ? now - new Date(sentAt) : null;

      if (!timeSinceSent || timeSinceSent < MIN_DELAY_MS) {
        console.warn("Open event ignored (too soon after sent):", {
          sentAt,
          openedAt: now,
          delayMs: timeSinceSent,
        });
        continue;
      }

      await Models.CampaignLogs.updateOne(
        { _id: campaignLogId },
        {
          $inc: { opened: 1, totalPixelLoads: 1, uniqueOpens: 1 },
          $set: { lastOpenedAt: now },
        }
      );
    } else if (event.event === "delivered") {
      await Models.CampaignLogs.updateOne(
        { _id: campaignLogId },
        { $set: { status: "delivered", sentAt: new Date(timestamp) } }
      );
    } else if (event.event === "bounce") {
      await Models.CampaignLogs.updateOne(
        { _id: campaignLogId },
        { $set: { status: "bounced", errorMessage: event.reason || null } }
      );
    }

    console.log("Event processed:", event.event, "for log:", campaignLogId);
  }

  res.status(200).send("OK");
};

module.exports = {
  bulkCreateRecipientsHandler,
  bulkDeleteRecipientsHandler,
  updateRecipientHandler,
  getRecipientsHandler,
  createCampaignHandler,
  updateCampaignHandler,
  deleteCampaignHandler,
  cancleScheduleCampaignHandler,
  scheduleCampaignHandler,
  getCampaignLogsHandler,
  getCampaignListHandler,
  sendCampaignHandler,
  getCampaignHandler,
  emailTrackingHandler,
  sendgridEventHandler,
};
