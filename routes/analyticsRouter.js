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
    res.render('admin/analytics',{
        owner : req.owner,
        stats : {
            totalProducts,
            totalCategories,
            recentProducts,
            discountedProducts,
        }, 
        chartData : {
            productsByCategory
        }
    });
  } catch (err) {
    logger.error('Error loading analytics', err);
    req.flash('error', 'Error loading analytics');
    return res.redirect('/owners/dashboard');
  }
});

module.exports = router;
