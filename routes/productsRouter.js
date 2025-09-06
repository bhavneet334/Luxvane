const express = require('express');
const router = express.Router();
const isOwnerAuthenticated = require('../middlewares/isOwnerAuthenticated');
const Product = require('../models/product-model');
const mongoose = require('mongoose');

//Get all products
router.get('/', isOwnerAuthenticated, async function (req, res) {
  const products = await Product.find();
  res.render('admin/products', { products });
});

//Create a new product
router.post('/', isOwnerAuthenticated, async function (req, res) {
  try {
    const { name, price, image, description, discount } = req.body;

    if (!name || !price || !image || !description) {
      return res.status(400).send('Invalid/missing fields');
    }

    const existing = await Product.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).send('Product already exists');
    }

    const newProduct = new Product({
      name,
      price,
      image,
      description,
      discount,
    });

    await newProduct.save();
    req.flash('success', 'Product created successfully');
    return res.redirect('/owners/products');
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

//Get a specific product details
router.get('/:id', isOwnerAuthenticated, async function (req, res) {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send('Invalid product ID');
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).send('Product does not exist');
    }

    res.render('product-details', { product });
  } catch (err) {
    console.error('Product route error', err);
    return res.status(500).send('Internal server error');
  }
});

//Delete a product, using post as using EJS
router.post('/:id/delete', isOwnerAuthenticated, async function (req, res) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send('Invalid product id');
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      req.flash('error', 'Product not found');
      return res.redirect('/owners/products');
    }

    req.flash('success', 'Product deleted successfully');
    return res.redirect('/owners/products');
  } catch (err) {
    console.error('Error', err.message);
    return res.status(500).send('Internal server error');
  }
});

//Edit route - get, using ejs
router.get('/:id/edit', isOwnerAuthenticated, async function (req, res) {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send('Invalid product ID');
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).send('Product does not exist');
    }

    res.render('edit-product', { product });
  } catch (err) {
    console.error('Cannot get edit', err);
    return res.status(500).send('Internal server error');
  }
});

//Edit product
router.post('/:id/update', isOwnerAuthenticated, async function (req, res) {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send('Invalid product ID');
    }

    const { name, price, image, description, discount } = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { name, price, image, description, discount },
      { new: true, runValidators: true },
    );

    if (!updatedProduct) {
      return res.status(404).send('Product not found');
    }
    req.flash('success', 'Product updated successfully');
    return res.redirect('/owners/products');
  } catch (err) {
    console.error('Error', err.message);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
