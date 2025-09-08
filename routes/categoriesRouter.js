const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Category = require('../models/category-model');
const isOwnerAuthenticated = require('../middlewares/isOwnerAuthenticated');

router.get('/', isOwnerAuthenticated, async function (req, res) {
  try {
    const categories = await Category.find();
    return res.status(200).json(categories);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/create', isOwnerAuthenticated, async function (req, res) {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Missing fields' });
    }
    const normalizedName = name.trim().toLowerCase();
    const isExisting = await Category.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
    });
    if (isExisting) {
      return res.status(409).json({ message: 'Category already exists' });
    }

    const slug = name.toLowerCase().trim().replace(/\s+/g, '-');

    const category = new Category({
      name,
      description,
      slug,
    });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/edit/:id', isOwnerAuthenticated, async function (req, res) {
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
      if (!trimmedName) {
        return res
          .status(400)
          .json({ message: 'Category name cannot be empty' });
      }
      const duplicate = await Category.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
      });

      if (duplicate) {
        return res.status(409).json({ message: 'Category already exists' });
      }

      category.name = trimmedName
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

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
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
