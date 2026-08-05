import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to check validation results
const validateResults = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: 'fail',
      errors: errors.array(),
    });
    return;
  }
  next();
};

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage('Phone number must be between 8 and 20 digits'),
  validateResults,
];

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateResults,
];

export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 8, max: 20 })
    .withMessage('Phone number must be between 8 and 20 digits'),
  body('newsletterSubscribed')
    .optional()
    .isBoolean()
    .withMessage('newsletterSubscribed must be a boolean'),
  validateResults,
];

export const validateAddress = [
  body('label')
    .trim()
    .notEmpty()
    .withMessage('Address label (e.g. Home, Work) is required')
    .isLength({ max: 50 }),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('area')
    .trim()
    .notEmpty()
    .withMessage('Area/locality is required'),
  body('city')
    .optional()
    .trim(),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
  validateResults,
];

export const validateReview = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('dish')
    .trim()
    .notEmpty()
    .withMessage('Dish name is required')
    .isLength({ max: 100 }),
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Review content is required')
    .isLength({ min: 10 })
    .withMessage('Review content must be at least 10 characters long'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }),
  validateResults,
];

export const validateContact = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ min: 10 })
    .withMessage('Message must be at least 10 characters long'),
  body('subject')
    .optional()
    .trim()
    .isLength({ max: 200 }),
  validateResults,
];

export const validateNewsletter = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  validateResults,
];





