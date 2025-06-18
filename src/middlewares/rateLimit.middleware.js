"use strict";
const jwt = require("jsonwebtoken");
const Response = require("@response");
const { STATUS_TO_MANY_REQUEST } = require("@commonUtils/constants");
const { RATE_LIMIT } = require("@commonUtils/rateLimit.constant.js");
const rateLimiter = require("express-rate-limit");
const { convertMinutesToMs } = require("../helpers/helper");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const decodeAndVerifyToken = async (authHeader) => {
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = {
  rateLimit: (
    requestLimit = 0,
    rateLimit = process.env.DEFAULT_RATE_LIMIT_DURATION
  ) => {
    const limiter = rateLimiter({
      keyGenerator: async (req, res) => {
        let storeValue = req.ip;

        if (req.headers.authorization) {
          const decoded = await decodeAndVerifyToken(req.headers.authorization);
          if (decoded && decoded.email) {
            storeValue = decoded.email;
          }
        }

        return storeValue;
      },

      max: (req, res) => {
        if (!requestLimit) {
          if (req.headers.authorization) {
            requestLimit = process.env.DEFAULT_REQUEST_LIMITS_BY_TOKEN;
          } else {
            requestLimit = process.env.DEFAULT_REQUEST_LIMITS_BY_IP;
          }
        }
        return requestLimit;
      },

      windowMs: convertMinutesToMs(rateLimit),
      legacyHeaders: false,

      skip: async (req, res) => {
        let skipFlag = RATE_LIMIT.DEFAULT_ALLOW_IP_LIST.includes(req.ip);

        if (req.headers.authorization) {
          const decoded = await decodeAndVerifyToken(req.headers.authorization);
          if (decoded && decoded.email) {
            skipFlag = RATE_LIMIT.DEFAULT_ALLOW_USER_LIST.includes(
              decoded.email
            );
          }
        }

        return skipFlag;
      },

      handler: (req, res) => {
        Response.errorResponseData(
          res,
          STATUS_TO_MANY_REQUEST,
          "tooManyRequest"
        );
      },
    });

    return function (req, res, next) {
      limiter(req, res, next);
    };
  },
};
