const crypto = require("crypto");

const generateOTP = (length = 6) => {
  return crypto.randomInt(100000, 999999).toString();
};

const convertMinutesToMs = (minutes) => {
  return Number(minutes) * 60 * 1000;
};

module.exports = {
  generateOTP,
  convertMinutesToMs,
};
