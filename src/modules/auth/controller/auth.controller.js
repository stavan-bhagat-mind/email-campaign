const Models = require("../../../models/index");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const moment = require("moment");
const {
  validateUserRegister,
  validateLogin,
  validateResetPassword,
} = require("../../../modules/auth/validation/auth.validation");
const {
  errorResponseWithoutData,
  successResponseData,
  validationErrorResponseData,
  successResponseWithoutData,
} = require("../../../utils/response");
const { USER } = require("../utils/auth.constants");
const { USER_MESSAGE } = require("../utils/auth.messages");
require("dotenv").config();
const {
  MSG_INTERNAL_SERVER_ERROR,
  COMMON_MSG,
  PASSWORD_RESET_SUCCESS,
  MSG_ACCESS_TOKEN_REFRESHED,
  MSG_VERIFY_EMAIL,
  MSG_RESET_PASSWORD_EMAIL_SENT,
  MSG_INVALID_REFRESH_TOKEN,
  MSG_INVALID_EXPIRE_OTP,
} = require("../../../utils/common/messages");
const {
  STATUS_INTERNAL_SERVER_ERROR,
  STATUS_STATUS_CONFLICT,
  STATUS_BAD_REQUEST,
  STATUS_NOT_FOUND,
  STATUS_SUCCESS,
  STATUS_CREATED,
  STATUS_FORBIDDEN,
  STATUS_UNAUTHORIZED,
  APP,
  STATUS,
} = require("../../../utils/common/constants");
const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../../../config/email.config");
const { generateOTP } = require("../../../helpers/helper");

async function registerHandler(req, res) {
  try {
    const { success, value } = validateUserRegister(req.body, res);
    if (!success) {
      return validationErrorResponseData(res, value.message);
    }

    const existingUser = await Models.User.findOne({ email: value.email });

    if (existingUser) {
      if (!existingUser.deletedAt) {
        return errorResponseWithoutData(
          res,
          STATUS_STATUS_CONFLICT,
          COMMON_MSG.ALREADY_EXISTS.replace("##", USER)
        );
      }
      //reactivate the account
      const hashedPassword = await bcrypt.hash(value.password, 10);

      const emailVerificationToken = jwt.sign(
        { email: value.email },
        process.env.VERIFY_SECRET,
        { expiresIn: process.env.VERIFY_EXPIRY_TIME }
      );

      await Models.User.findByIdAndUpdate(existingUser._id, {
        firstName: value.firstName,
        lastName: value.lastName,
        password: hashedPassword,
        contactNumber: value.contactNumber,
        deletedAt: null,
        status: STATUS.ACTIVE,
        isEmailVerified: false,
      });

      // Send verification email
      await sendVerificationEmail(
        value.email,
        emailVerificationToken,
        "reactivation"
      );

      return successResponseData(
        res,
        {
          id: existingUser._id,
          firstName: value.firstName,
          lastName: value.lastName,
          email: value.email,
          company: value.company,
          isEmailVerified: false,
          contactNumber: value.contactNumber,
          createdAt: existingUser.createdAt,
        },
        STATUS_CREATED,
        USER_MESSAGE.REACTIVATION_VERIFICATION_MESSAGE
      );
    }

    const hashedPassword = await bcrypt.hash(value.password, 10);
    const emailVerificationToken = jwt.sign(
      { email: value.email },
      process.env.VERIFY_SECRET,
      { expiresIn: process.env.VERIFY_EXPIRY_TIME }
    );

    const user = await Models.User.create({
      firstName: value.firstName,
      lastName: value.lastName,
      email: value.email,
      company: value.company,
      password: hashedPassword,
      contactNumber: value.contactNumber,
    });

    await sendVerificationEmail(user.email, emailVerificationToken);

    const userResponse = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      contactNumber: user.contactNumber,
      createdAt: user.createdAt,
    };

    return successResponseData(
      res,
      userResponse,
      STATUS_CREATED,
      MSG_VERIFY_EMAIL
    );
  } catch (error) {
    console.error(`Registration error: ${error.message}`);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      MSG_INTERNAL_SERVER_ERROR
    );
  }
}

// User Login
async function loginHandler(req, res) {
  try {
    const { success, value } = validateLogin(req.body, res);
    if (!success) {
      return validationErrorResponseData(res, value.message);
    }

    const user = await Models.User.findOne({ email: value.email });
    if (!user) {
      return errorResponseWithoutData(
        res,
        STATUS_NOT_FOUND,
        COMMON_MSG.NOT_FOUND.replace("##", USER)
      );
    }
    if (!user.isEmailVerified)
      return errorResponseWithoutData(res, STATUS_FORBIDDEN, MSG_VERIFY_EMAIL);

    const isMatch = await bcrypt.compare(value.password, user.password);

    if (!isMatch) {
      return errorResponseWithoutData(
        res,
        STATUS_FORBIDDEN,
        USER_MESSAGE.INVALID_CREDENTIALS
      );
    }

    const token = jwt.sign(
      { id: user._id, username: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY_TIME }
    );
    const refreshToken = jwt.sign(
      {
        data: { email: user.email, id: user._id },
      },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME }
    );

    return successResponseData(
      res,
      {
        id: user._id,
        name: user.firstName + " " + user.lastName,
        email: user.email,
        company: user.company,
        token,
        refreshToken,
      },
      STATUS_SUCCESS,
      USER_MESSAGE.USER_LOGGED_IN_SUCCESS
    );
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      MSG_INTERNAL_SERVER_ERROR
    );
  }
}

// verify User
async function userVerificationHandler(req, res) {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.VERIFY_SECRET);
    const user = await Models.User.findOne({ email: decoded.email });
    if (!user) {
      return errorResponseWithoutData(
        res,
        STATUS_NOT_FOUND,
        COMMON_MSG.NOT_FOUND.replace("##", "User")
      );
    }
    if (user.isEmailVerified) {
      return successResponseData(
        res,
        {
          userName: user.firstName,
          email: user.email,
          appName: APP.NAME,
          alreadyVerified: true,
        },
        STATUS_SUCCESS,
        COMMON_MSG.ALREADY_VERIFIED.replace("##", "email")
      );
    }
    user.isEmailVerified = true;
    await user.save();
    return successResponseData(
      res,
      {
        userName: user.firstName,
        email: user.email,
        appName: APP.NAME,
        alreadyVerified: false,
      },
      STATUS_SUCCESS,
      COMMON_MSG.VERIFIED_SUCCESS.replace("##", "email")
    );
  } catch (error) {
    console.error("Verification error:", error);
    if (error.name === "TokenExpiredError") {
      return res.render("linkExpire.template.ejs", {
        appName: APP.NAME,
        alreadyVerified: false,
      });
    }
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      MSG_INTERNAL_SERVER_ERROR
    );
  }
}

// Forgot Password
async function forgotPasswordHandler(req, res) {
  try {
    const { email } = req.body;
    const user = await Models.User.findOne({ email });

    if (!user) {
      return errorResponseWithoutData(
        res,
        STATUS_NOT_FOUND,
        COMMON_MSG.NOT_FOUND.replace("##", USER)
      );
    }
    if (!user.isEmailVerified)
      return errorResponseWithoutData(
        res,
        STATUS_FORBIDDEN,
        COMMON_MSG.NOT_FOUND.replace("##", USER)
      );
    // generate OTP
    const resetPasswordToken = generateOTP();

    const resetTokenExpiry = moment().add(30, "minutes").toDate();
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();

    // Send reset password email
    await sendResetPasswordEmail(
      user.email,
      resetPasswordToken,
      user.firstName
    );

    return successResponseWithoutData(
      res,
      STATUS_SUCCESS,
      MSG_RESET_PASSWORD_EMAIL_SENT
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      MSG_INTERNAL_SERVER_ERROR
    );
  }
}

// Reset Password
async function verifyAndResetPasswordHandler(req, res) {
  try {
    const { value, success } = validateResetPassword(req.body, res);
    if (!success) {
      return validationErrorResponseData(res, value.message);
    }

    const user = await Models.User.findOne({
      email: value.email,
      resetPasswordToken: value.otp,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) {
      return errorResponseWithoutData(
        res,
        STATUS_BAD_REQUEST,
        MSG_INVALID_EXPIRE_OTP
      );
    }

    const hashedPassword = await bcrypt.hash(value.password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;

    await user.save();

    return successResponseWithoutData(
      res,
      STATUS_SUCCESS,
      PASSWORD_RESET_SUCCESS
    );
  } catch (error) {
    console.error("Reset password error:", error);
    return errorResponseWithoutData(
      res,
      STATUS_INTERNAL_SERVER_ERROR,
      MSG_INTERNAL_SERVER_ERROR
    );
  }
}

// Generate new access token
async function refreshTokenHandler(req, res) {
  const refreshToken = req.headers["refresh-token"];

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);

    const newAccessToken = jwt.sign(
      { email: decoded.email },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRY_TIME,
      }
    );

    return successResponseData(
      res,
      { token: newAccessToken },
      STATUS_SUCCESS,
      MSG_ACCESS_TOKEN_REFRESHED
    );
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(STATUS_UNAUTHORIZED)
        .json({ message: MSG_REFRESH_TOKEN_EXPIRED });
    } else if (error.name === "JsonWebTokenError") {
      return res
        .status(STATUS_UNAUTHORIZED)
        .json({ message: MSG_INVALID_REFRESH_TOKEN });
    } else {
      console.error("Error refreshing access token:", error);
      errorResponseWithoutData(
        res,
        STATUS_INTERNAL_SERVER_ERROR,
        MSG_INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = {
  registerHandler,
  loginHandler,
  userVerificationHandler,
  forgotPasswordHandler,
  verifyAndResetPasswordHandler,
  refreshTokenHandler,
};
