const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const models = require("../models/index");
const { errorResponseWithoutData } = require("@response");
const { MSG_TOKEN_EXPIRED } = require("@commonUtils/messages");
const { STATUS_INTERNAL_SERVER_ERROR } = require("@commonUtils/constants");

dotenv.config();

const authenticationMiddleware = async (req, res, next) => {
  try {
    const authenticationToken = req.headers["authorization"];
    if (!authenticationToken) {
      res.status(401).json({
        success: false,
        data: null,
        message: "Authentication token not provided",
      });
      return;
    }

    const token = authenticationToken.split(" ")[1];
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await models.User.findById(decoded.id);

    if (!user) {
      return errorResponseWithoutData(
        res,
        STATUS_INTERNAL_SERVER_ERROR,
        MSG_TOKEN_EXPIRED
      );
    }

    req.userId = decoded.id;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        data: null,
        message: "Token has expired",
        errorName: error.name,
      });
    } else if (error.name === "JsonWebTokenError") {
      res.status(403).json({
        success: false,
        data: null,
        message: "Invalid authentication token",
        errorName: error.name,
      });
    } else {
      console.error("Authentication error:", error);
      res.status(500).json({
        success: false,
        data: null,
        message: "Internal server error",
      });
    }
  }
};

module.exports = authenticationMiddleware;
