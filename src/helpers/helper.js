const crypto = require("crypto");

const generateOTP = (length = 6) => {
  return crypto.randomInt(100000, 999999).toString();
};

const convertMinutesToMs = (minutes) => {
  return Number(minutes) * 60 * 1000;
};

const createEventId = () => {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};

module.exports = {
  generateOTP,
  convertMinutesToMs,
  createEventId,
};
