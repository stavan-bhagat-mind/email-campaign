const Joi = require("joi");
const { STATUS } = require("@commonUtils/constants");

const validateBulkCreateRecipients = (data) => {
  const recipientSchema = Joi.object({
    firstName: Joi.string().min(3).max(30).required(),
    lastName: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    contactNumber: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .messages({ "string.pattern.base": `Phone number must have 10 digits.` })
      .optional(),
  });

  const schema = Joi.array().items(recipientSchema).min(1).required();

  const { error, value } = schema.validate(data, { abortEarly: false });

  return {
    success: !error,
    value: error ? error.details : value,
  };
};

const validateUpdateRecipients = (data) => {
  const schema = Joi.object({
    firstName: Joi.string().min(3).max(30).optional(),
    lastName: Joi.string().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    status: Joi.string()
      .valid(...Object.values(STATUS))
      .optional(),
    contactNumber: Joi.string()
      .pattern(/^[0-9]{10}$/)
      .messages({ "string.pattern.base": `Phone number must have 10 digits.` })
      .optional(),
  });

  const { error, value } = schema.validate(data);

  return {
    success: !error,
    value: error ? error.details : value,
  };
};

const validateBulkDeleteRecipients = (data) => {
  const idSchema = Joi.object({
    id: Joi.string().length(24).hex().required(),
  });

  const schema = Joi.array().items(idSchema).min(1).required();

  const { error, value } = schema.validate(data, { abortEarly: false });

  return {
    success: !error,
    value: error ? error.details : value,
  };
};

const validateCreateCampaign = (data) => {
  const schema = Joi.object({
    name: Joi.string().max(255).required(),
    subject: Joi.string().max(255).required(),
    content: Joi.string().required(),
    template: Joi.string().required(),
    recipients: Joi.array()
      .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
      .min(1)
      .required(),
  });

  const { error, value } = schema.validate(data, { abortEarly: false });

  return {
    success: !error,
    value: error ? error.details : value,
  };
};

const validateUpdateCampaign = (data) => {
  const schema = Joi.object({
    name: Joi.string().max(255).optional(),
    subject: Joi.string().max(255).optional(),
    content: Joi.string().optional(),
    template: Joi.string().optional(),
    recipients: Joi.array()
      .items(Joi.string().regex(/^[0-9a-fA-F]{24}$/))
      .optional(),
  });

  const { error, value } = schema.validate(data, { abortEarly: false });

  return {
    success: !error,
    value: error ? error.details : value,
  };
};

module.exports = {
  validateBulkCreateRecipients,
  validateUpdateRecipients,
  validateBulkDeleteRecipients,
  validateCreateCampaign,
  validateUpdateCampaign,
};
