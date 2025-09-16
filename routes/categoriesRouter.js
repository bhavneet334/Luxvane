const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Category = require('../models/category-model');
const isOwnerAuthenticated = require('../middlewares/isOwnerAuthenticated');
const logger = require('../utils/logger');

const toTitleCase = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const validateCategory = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 50 })
    .withMessage('Category name must be less than 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
];

const validateCategoryUpdate = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category name cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Category name must be less than 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
];

/**
 * @swagger
 * /owners/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         $ref: '#/components/responses/CategoriesList'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

router.get('/', isOwnerAuthenticated, async function (req, res) {
  try {
    const categories = await Category.find();
    return res.status(200).json(categories);
  } catch (err) {
    logger.error('Error fetching categories:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /owners/categories/create:
 *   post:
 *     summary: Create a new category
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 example: Electronic devices and accessories
 *     responses:
 *       201:
 *         $ref: '#/components/responses/CategoryCreated'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post(
  '/create',
  isOwnerAuthenticated,
  validateCategory,
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    try {
      const { name, description } = req.body;

      const trimmedName = name.trim();
      const normalizedName = trimmedName.toLowerCase();

      const isExisting = await Category.findOne({
        name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
      });

      if (isExisting) {
        return res.status(409).json({ message: 'Category already exists' });
      }

      const titleCaseName = toTitleCase(trimmedName);
      const slug = normalizedName.replace(/\s+/g, '-');

      const category = new Category({
        name: titleCaseName,
        description,
        slug,
      });

      await category.save();
      return res.status(201).json(category);
    } catch (err) {
      logger.error('Error creating categories', err);
      return res.status(500).json({ error: 'Server error' });
    }
  },
);

/**
 * @swagger
 * /owners/categories/edit/{id}:
 *   patch:
 *     summary: Update a category
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID (MongoDB ObjectId)
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 example: Electronics
 *               description:
 *                 type: string
 *                 example: Updated description
 *               isActive:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         $ref: '#/components/responses/CategoryUpdated'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.patch(
  '/edit/:id',
  isOwnerAuthenticated,
  validateCategoryUpdate,
  async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    try {
      const id = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Category ID' });
      }

      const { name, description, isActive } = req.body;

      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }

      if (name !== undefined) {
        const trimmedName = name.trim();
        const duplicate = await Category.findOne({
          _id: { $ne: id },
          name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        });

        if (duplicate) {
          return res.status(409).json({ message: 'Category already exists' });
        }

        category.name = toTitleCase(trimmedName);
        category.slug = trimmedName.toLowerCase().replace(/\s+/g, '-');
      }
      if (description !== undefined) {
        category.description = description;
      }
      if (isActive !== undefined) {
        category.isActive = isActive;
      }
      await category.save();
      return res.status(200).json({ message: 'Category updated', category });
    } catch (err) {
      logger.error('Cannot edit category', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
);

module.exports = router;
