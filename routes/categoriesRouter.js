const express = require('express');
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

router.patch('/edit', isOwnerAuthenticated, async function (req, res) {});

module.exports = router;
