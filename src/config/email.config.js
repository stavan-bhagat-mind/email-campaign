const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const {
  SERVICE_NAME,
  APP,
  IMAGE_URL,
  LINKS,
} = require("../utils/common/constants");
const { EMAIL } = require("../utils/common/messages");

const transporter = nodemailer.createTransport({
  service: SERVICE_NAME,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Common assets
const assets = {
  logo: IMAGE_URL.APP_LOGO,
  subscription: IMAGE_URL.SUBSCRIPTION.SUBSCRIPTION_MAIN,
  supportUrl: LINKS.SUPPORT,
  appName: APP.NAME,
};

/**
 * Generic email sender function
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

    // Render the template
    const emailTemplatePath = path.resolve(
      __dirname,
      `../../src/templates/${template}.ejs`
    );

    const emailBody = await ejs.renderFile(emailTemplatePath, templateData);

    // Send the email
    await transporter.sendMail({
      to: email,
      subject: subject,
      html: emailBody,
    });

    console.log(`Email (${template}) sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Error sending ${template} email:`, error);
    throw error;
  }
};

/**
 * Send verification email function
 * @param {string} email - Recipient email
 * @param {string} token - token
 * @param {string} emailType - email-type
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
 * Send verification email function
 * @param {string} email - Recipient email
 * @param {string} resetToken - reset-token
 * @param {string} username - user name
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

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
};
