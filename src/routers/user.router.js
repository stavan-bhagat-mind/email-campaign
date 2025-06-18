const userRouter = require("express").Router();
const authMiddleware = require("../middlewares/auth.middleware");
const {
  bulkCreateRecipientsHandler,
  updateRecipientHandler,
  bulkDeleteRecipientsHandler,
  getRecipientsHandler,
  uploadCSVRecipientsHandler,
} = require("../modules/user/controller/user.controller");
const { singleUpload } = require("../config/multer.config");

userRouter.post(
  "/create-recipients",
  authMiddleware,
  bulkCreateRecipientsHandler
);
userRouter.post(
  "/upload-recipients",
  authMiddleware,
  singleUpload("file"),
  uploadCSVRecipientsHandler
);
userRouter.patch("/recipients/:id", authMiddleware, updateRecipientHandler);
userRouter.delete(
  "/delete-recipients",
  authMiddleware,
  bulkDeleteRecipientsHandler
);
userRouter.get("/recipients/list", authMiddleware, getRecipientsHandler);

module.exports = userRouter;
