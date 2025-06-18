"use strict";

module.exports = {
  RATE_LIMIT: {
    DEFAULT_ALLOW_IP_LIST: [],
    DEFAULT_ALLOW_USER_LIST: [],
  },
  API_LIMITS: {
    SIGNUP: {
      REQUEST: 1,
      RATE: 2,
    },

    
    LOGIN: {
      REQUEST: 5,
      RATE: 2,
    },
    FORGOT_PASSWORD: {
      REQUEST: 3,
      RATE: 2,
    },
  },
};
