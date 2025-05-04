import { body } from "express-validator";

export const validateCvMetadata = [
  body("fileName")
    .trim()
    .notEmpty().withMessage("file name is required")
    .isString().withMessage("file name must be a string")
    .isLength({ min: 1, max: 255 }).withMessage("file name must be between 1 and 255 characters"),
  body("versionName")
    .optional({ checkFalsy: true })
    .trim()
    .isString().withMessage("version name must be a string if provided.")
    .isLength({ max: 255 }).withMessage("version name cannot exceed 255 characters.")
];
