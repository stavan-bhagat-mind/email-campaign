const authRouter = require("express").Router();
const {
  registerHandler,
  loginHandler,
  userVerificationHandler,
  forgotPasswordHandler,
  verifyAndResetPasswordHandler,
  refreshTokenHandler,
} = require("../modules/auth/controller/auth.controller");
const { rateLimit } = require("../middlewares/rateLimit.middleware");
const { API_LIMITS } = require("@commonUtils/rateLimit.constant");

authRouter.post("/register", registerHandler);
authRouter.post(
  "/login",
  rateLimit(API_LIMITS.LOGIN.REQUEST, API_LIMITS.LOGIN.RATE),
  loginHandler
);
authRouter.get("/verify/:token", userVerificationHandler);
authRouter.post(
  "/forgot-password",
  rateLimit(
    API_LIMITS.FORGOT_PASSWORD.REQUEST,
    API_LIMITS.FORGOT_PASSWORD.RATE
  ),
  forgotPasswordHandler
);
authRouter.post("/reset-password", verifyAndResetPasswordHandler);
authRouter.get("/refresh-token", refreshTokenHandler);

module.exports = authRouter;
