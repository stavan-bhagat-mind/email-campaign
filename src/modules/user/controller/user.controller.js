const Models = require("../../../models");
const { RECIPIENT } = require("../../../utils/common/constants");
const {
  successResponseData,
  errorResponseWithoutData,
  validationErrorResponseData,
} = require("../../../utils/response");
const {
  validateBulkCreateRecipients,
  validateUpdateRecipients,
  validateBulkDeleteRecipients,
} = require("../validation/user.validation");
const {
  STATUS_SUCCESS,
  STATUS_CREATED,
  STATUS_BAD_REQUEST,
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS,
} = require("@commonUtils/constants");
const {
  COMMON_MSG,
  MSG_INTERNAL_SERVER_ERROR,
} = require("@commonUtils/messages");
const csv = require("csv-parser");
const fs = require("fs");

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
      user: userId,
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
      { _id: { $in: ids }, user: userId },
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
      { _id: id, user: userId, deletedAt: null },
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
      user: userId,
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

async function uploadCSVRecipientsHandler(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required." });
    }

    const recipients = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        recipients.push({
          user: req.userId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          contactNumber: row.contactNumber,
        });
      })
      .on("end", async () => {
        const inserted = await Models.Recipient.insertMany(recipients, {
          ordered: false,
        });

        return res.status(201).json({
          message: "Recipients uploaded successfully",
          count: inserted.length,
        });
      })
      .on("error", (err) => {
        console.error("CSV Parse Error:", err);
        return res.status(500).json({
          message: "Failed to parse CSV",
          error: err.message,
        });
      });
  } catch (error) {
    console.error("Upload error:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
}

module.exports = {
  bulkCreateRecipientsHandler,
  bulkDeleteRecipientsHandler,
  updateRecipientHandler,
  getRecipientsHandler,
  uploadCSVRecipientsHandler,
};
