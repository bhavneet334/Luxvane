const express = require('express');
const router = express.Router();
const isOwnerAuthenticated = require('../middlewares/isOwnerAuthenticated');
const Product = require('../models/product-model');
const Category = require('../models/category-model');
const logger = require('../utils/logger.js');

router.get('/', isOwnerAuthenticated, async function (req, res) {
  try {
    const products = await Product.find().populate('category');
    const categories = await Category.find();

    const totalProducts = products.length;
    const totalCategories = categories.length;

    const discountedProducts = products.filter(
      (p) => p.discount && p.discount > 0,
    ).length;

    const dateCreated = new Date();
    dateCreated.setDate(dateCreated.getDate() - 7);
    const recentProducts = products.filter(
      (p) => new Date(p.createdAt) >= dateCreated,
    ).length;

    const productsByCategory = categories.map((category) => {
      const count = products.filter(
        (p) => p.category._id.toString() === category._id.toString(),
      ).length;
      return {
        name: category.name,
        count: count,
      };
    });

    const priceRanges = {
      '0-50': products.filter((p) => p.price >= 0 && p.price <= 50).length,
      '51-100': products.filter((p) => p.price >= 51 && p.price <= 100).length,
      '101-200': products.filter((p) => p.price >= 101 && p.price <= 200)
        .length,
      '201-500': products.filter((p) => p.price >= 201 && p.price <= 500)
        .length,
      '501+': products.filter((p) => p.price > 500).length,
    };

    res.render('admin/analytics', {
      owner: req.owner,
      stats: {
        totalProducts,
        totalCategories,
        recentProducts,
        discountedProducts,
      },
      chartData: {
        productsByCategory,
        priceRanges,
      },
    });
  } catch (err) {
    logger.error('Error loading analytics', err);
    req.flash('error', 'Error loading analytics');
    return res.redirect('/owners/dashboard');
  }
});

module.exports = router;
