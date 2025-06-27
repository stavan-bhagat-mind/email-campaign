const userRouter = require("express").Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  bulkCreateRecipientsHandler,
  updateRecipientHandler,
  bulkDeleteRecipientsHandler,
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
} = require("../modules/user/controller/user.controller");
const { singleUpload } = require("../config/multer.config");

userRouter.post(
  "/create-recipients",
  authMiddleware,
  bulkCreateRecipientsHandler
);
userRouter.patch("/recipients/:id", authMiddleware, updateRecipientHandler);
userRouter.delete(
  "/delete-recipients",
  authMiddleware,
  bulkDeleteRecipientsHandler
);
userRouter.get("/recipients/list", authMiddleware, getRecipientsHandler);
userRouter.post("/campaign", authMiddleware, createCampaignHandler);
userRouter.patch(
  "/campaign/:campaignId",
  authMiddleware,
  updateCampaignHandler
);
userRouter.delete(
  "/campaign/:campaignId",
  authMiddleware,
  deleteCampaignHandler
);
userRouter.put(
  "/campaigns/:campaignId/cancel",
  authMiddleware,
  cancleScheduleCampaignHandler
);
userRouter.post(
  "/campaigns/:campaignId/schedule",
  authMiddleware,
  scheduleCampaignHandler
);
userRouter.get(
  "/campaigns/:campaignId/logs",
  authMiddleware,
  getCampaignLogsHandler
);
userRouter.get("/campaign/list", authMiddleware, getCampaignListHandler);
userRouter.post(
  "/campaigns/:campaignId/send",
  authMiddleware,
  sendCampaignHandler
);
userRouter.get("/campaign/:campaignId", authMiddleware, getCampaignHandler);
userRouter.get("/email-track/:campaignLogId", emailTrackingHandler);

module.exports = userRouter;
