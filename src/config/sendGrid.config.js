// const sgMail = require("@sendgrid/mail");
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);
// // sgMail.setDataResidency('eu');
// // uncomment the above line if you are sending mail using a regional EU subuser

// const msg = {
//   to: "stavan.bhagat@mindinventory.com", // Change to your recipient
//   from: "bhagatstavan7@gmail.com", // Change to your verified sender
//   subject: "Sending with SendGrid is Fun",
//   text: "and easy to do anywhere, even with Node.js",
//   html: "<strong>and easy to do anywhere, even with Node.js</strong>",
// };
// sgMail
//   .send(msg)
//   .then(() => {
//     console.log("Email sent");
//   })
//   .catch((error) => {
//     console.error(error);
//   });

// ----------------------------------
const sgMail = require("@sendgrid/mail");
const ejs = require("ejs");
const path = require("path");
const crypto = require("crypto");
const Models = require("../models/index");

const {
  SERVICE_NAME, // Optional: can be removed if not needed
  APP,
  IMAGE_URL,
  LINKS,
} = require("../utils/common/constants");
const { EMAIL } = require("../utils/common/messages");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Common assets
const assets = {
  logo: IMAGE_URL.APP_LOGO,
  supportUrl: LINKS.SUPPORT,
  appName: APP.NAME,
};

/**
 * Generic email sender function using SendGrid
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} template - Template name without extension
 * @param {Object} data - Dynamic data to populate the template
 */
const sendEmail = async (email, subject, template, data = {}) => {
  try {
    const templateData = {
      ...assets,
      ...data,
      email,
    };

    const emailTemplatePath = path.resolve(
      __dirname,
      `../../src/templates/${template}.ejs`
    );

    const emailBody = await ejs.renderFile(emailTemplatePath, templateData);

    const msg = {
      to: email,
      from: process.env.EMAIL_USER, // Must be a verified sender in SendGrid
      subject,
      html: emailBody,
    };

    await sgMail.send(msg);

    console.log(`Email (${template}) sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Error sending ${template} email:`, error);
    throw error;
  }
};

/**
 * Send verification email function
 */
const sendVerificationEmail = async (
  email,
  token,
  emailType = "verification"
) => {
  try {
    const subject =
      emailType === "reactivation"
        ? EMAIL.SUBJECTS.REACTIVATE_ACCOUNT
        : EMAIL.SUBJECTS.VERIFY_EMAIL;

    const verificationUrl = `${process.env.BASEURL}/email-campaign/auth/verify/${token}`;

    return sendEmail(email, subject, "verifyUser.template", {
      verificationUrl,
      emailType,
      imageUrl: IMAGE_URL.VERIFICATION,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

/**
 * Send reset password email
 */
const sendResetPasswordEmail = async (email, resetToken, userName) => {
  try {
    return sendEmail(
      email,
      EMAIL.SUBJECTS.RESET_PASSWORD,
      "resetPassword.template",
      {
        resetToken,
        userName,
        imageUrl: IMAGE_URL.RESET_PASSWORD,
      }
    );
  } catch (error) {
    console.error("Error sending reset password email:", error);
    throw error;
  }
};

/**
 * Inject tracking pixel into email HTML
 */
const injectTrackingPixel = (
  html,
  campaignLogId,
  email,
  includePixel = true
) => {
  const secret = process.env.TRACKING_SECRET;
  const data = `${email}|${campaignLogId}`;
  const hash = crypto.createHmac("sha256", secret).update(data).digest("hex");

  const trackingPixelUrl = `${
    process.env.BASEURL
  }/email-campaign/user/email-track/${campaignLogId}?email=${encodeURIComponent(
    email
  )}&sig=${hash}`;

  if (includePixel) {
    const pixel = `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" />`;
    return `<html><body>${html}<br/>${pixel}</body></html>`;
  }
  return `<html><body>${html}</body></html>`;
};

/**
 * Send campaign email with optional tracking pixel
 */
const sendCampaignEmail = async (
  to,
  subject,
  html,
  campaignLogId,
  includePixel = true,
  messageId
) => {
  try {
    // const trackedHtml = injectTrackingPixel(
    //   html,
    //   campaignLogId,
    //   to,
    //   includePixel
    // );

    const msg = {
      to,
      from: process.env.EMAIL_USER,
      subject,
      html: html,
      customArgs: {
        campaignLogId: campaignLogId,
      },
      headers: {
        "Message-ID": messageId,
        "In-Reply-To": messageId,
        References: messageId,
      },
    };

    const [response] = await sgMail.send(msg);
    const sgMessageId = response?.headers["x-message-id"];

    if (sgMessageId) {
      await Models.CampaignLogs.updateOne(
        { _id: campaignLogId },
        { $set: { messageId: sgMessageId } }
      );
    }

    // console.log("html", trackedHtml);
    console.log(`Campaign email sent to ${to}`);
    return true;
  } catch (error) {
    console.error(`Error sending campaign email to ${to}:`, error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
  sendCampaignEmail,
};
