module.exports = {
  STATUS: {
    ACTIVE: "active",
    INACTIVE: "inactive",
  },
  CAMPAIGN_STATUS: {
    SENT: "sent",
    DRAFT: "draft",
    FAILED: "failed",
    SCHEDULE: "scheduled",
  },
  CAMPAIGN_LOGS_STATUS: {
    PENDING: "pending",
    DELIVERED: "delivered",
    DEBOUNCED: "debounced",
    OPENED: "opened",
  },
  USER: "user",
  RECIPIENT: "recipient",
  SERVICE_NAME: "gmail",
  APP: {
    NAME: "EC",
    DESCRIPTION: "EC System",
  },
  CATEGORY: {
    USER: "User",
    EMAIL: "Email",
    NOTIFICATION: "Notification",
    SUBSCRIPTION_STATUS: "subscription status",
  },
  CODE: {
    SUCCESS: 1,
    FAIL: 0,
  },
  // http-Status-Codes
  STATUS_SUCCESS: 200,
  STATUS_CREATED: 201,
  STATUS_BAD_REQUEST: 400,
  STATUS_UNAUTHORIZED: 401,
  STATUS_NOT_FOUND: 404,
  STATUS_INTERNAL_SERVER_ERROR: 500,
  STATUS_FORBIDDEN: 403,
  STATUS_TOKEN_EXPIRED: 419,
  STATUS_STATUS_CONFLICT: 409,
  STATUS_TO_MANY_REQUEST: 429,
  // Subscription subject messages

  EMAIL: {
    SUBJECTS: {
      VERIFICATION: "Verify Your Email Address",
      RESET_PASSWORD: "Reset Your Password",
      SUBSCRIPTION_STARTED: "Welcome to Your Subscription",
      PAYMENT_FAILURE: "Payment Failed for Your Subscription",
      CANCELLATION: "Subscription Cancellation Confirmed",
      EXPIRATION: "Your Subscription Has Expired",
      RENEWAL_STATUS: "Subscription Renewal Status Updated",
      RECOVERY: "Your Subscription Has Been Recovered",
      GRACE_PERIOD_EXPIRED: "Grace Period Ended - Subscription Expired",
    },
  },
  // links
  LINKS: {
    SUPPORT: "https://support.google.com/",
  },
  // images
  IMAGE_URL: {
    APP_LOGO:
      "https://media-hosting.imagekit.io/740317022e9349ed/rn_image_picker_lib_temp_22395d66-3916-47ad-8c4c-5e04f38bc9c5.png?Expires=1838960234&Key-Pair-Id=K2ZIVPTIP2VGHC&Signature=F1WJjdwFroM38nZ0LjIzVYkPbkj1x5e0EZz6FH3xj1K-BOjg5AgUzECksCupf1QD9JZ7EPOQDgnbJRNAfIcwzkSyYKD3mI2fK8xsW2V1mweLtldtREUGuKP57XuM2kTZXdqAJMXW6qu8lEk3q7L~fMqEk6ZeserOxLgRPwY7A4g89eiWdo0sDf3hvdT7xIw~9gnS~4SWi46DThz~2Y65VceVyCRuke6BhR5GKe7XBnSXatdbUyNSMYg92fqWG5E7gKAwanGFG3dzWRPN11RcyLCTcylWBYSIDSFEdA-L-wShUjgWf92RGd7PGjGJrjn0Z9u~lSr4qwFEej2-kIjnbg__",
    VERIFICATION:
      "https://media.istockphoto.com/id/1338629648/vector/mail-approved-vector-flat-conceptual-icon-style-illustration-eps-10-file.jpg?s=612x612&w=0&k=20&c=o6AcZk3hB6ShxOzmssuOcsfh0QYEQVJ0nCuEZZj1_nQ=",
    RESET_PASSWORD: "https://i.ibb.co/bjn5nn6K/lock.png",
  },
};
