const express = require('express');
const router = express.Router();
const isOwnerAuthenticated = require('../middlewares/isOwnerAuthenticated');
const Product = require('../models/product-model');
const mongoose = require('mongoose');
const ownerModel = require('../models/owner-model');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

//List all products
router.get('/', isOwnerAuthenticated, async function (req, res) {
  const products = await Product.find();
  res.render('admin/products', { products, owner: req.owner });
});

//Show create product form
router.get('/create', isOwnerAuthenticated, async function (req, res) {
  res.render('admin/create-product', { owner: req.owner });
});

//Create a new product
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'Luxvane/products',
        use_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    stream.end(buffer);
  });
};

router.post(
  '/create',
  isOwnerAuthenticated,
  upload.single('uploaded_file'),
  async function (req, res) {
    try {
      const { name, price, description, discount } = req.body;
      console.log(req.file);

      if (!name || !price || !req.file) {
        return res.status(400).send('Invalid/missing fields');
      }

      const existing = await Product.findOne({ name: name.trim() });
      if (existing) {
        return res.status(400).send('Product already exists');
      }

      const uploadResult = await uploadToCloudinary(req.file.buffer);

      const newProduct = new Product({
        name,
        price,
        image: uploadResult.secure_url,
        description,
        discount,
      });

      console.log(newProduct);

      await newProduct.save();
      req.flash('success', 'Product created successfully');
      res.redirect('/owners/products/create');
    } catch (err) {
      return res.status(500).send(err.message);
    }
  },
);

//Show edit product form
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

    res.render('admin/edit-product', { product, owner: req.owner });
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

//Delete product
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

//View specific product
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

module.exports = router;
