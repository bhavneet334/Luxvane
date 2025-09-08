const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const isOwnerAuthenticated = require('../middlewares/isOwnerAuthenticated');
const Product = require('../models/product-model');
const ownerModel = require('../models/owner-model');
const Category = require('../models/category-model');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

//List all products, and optionally filter by categories
router.get('/', isOwnerAuthenticated, async function (req, res) {
  try {
    const { category } = req.query;

    const categories = await Category.find();
    let products;

    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        req.flash('error', 'Invalid category');
        return res.redirect('/owners/products');
      }

      products = await Product.find({ category }).populate('category');
    } else {
      products = await Product.find().populate('category');
    }

    res.render('admin/products', {
      products,
      categories,
      selectedCategory: category || null,
      owner: req.owner,
    });
  } catch (err) {
    req.flash('error', 'Failed to load products');
    return res.redirect('/owners/products');
  }
});

//Show create product form
router.get('/create', isOwnerAuthenticated, async function (req, res) {
  const categories = await Category.find();
  res.render('admin/create-product', { owner: req.owner, categories });
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
      const { name, price, description, category, discount } = req.body;

      if (!name || !price || !category || !req.file) {
        req.flash('error', 'Invalid or missing fields');
        return res.redirect('/owners/products/create');
      }

      if (!mongoose.Types.ObjectId.isValid(category)) {
        req.flash('error', 'Invalid category selected');
        return res.redirect('/owners/products/create');
      }

      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        req.flash('error', 'Category not found');
        return res.redirect('/owners/products/create');
      }

      const existing = await Product.findOne({
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      });
      if (existing) {
        req.flash('error', 'Product already exists');
        return res.redirect('/owners/products/create');
      }

      if (!(Number(price) > 0)) {
        req.flash('error', 'Invalid price');
        return res.redirect('/owners/products/create');
      }

      const uploadResult = await uploadToCloudinary(req.file.buffer);

      const newProduct = new Product({
        name: name.trim(),
        price: Number(price),
        image: uploadResult.secure_url,
        description,
        category,
        discount,
      });

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
    const categories = await Category.find();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send('Invalid product ID');
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).send('Product does not exist');
    }

    res.render('admin/edit-product', { product, owner: req.owner, categories });
  } catch (err) {
    console.error('Cannot get edit', err);
    return res.status(500).send('Internal server error');
  }
});

//Edit product
router.post(
  '/:id/update',
  isOwnerAuthenticated,
  upload.single('uploaded_file'),
  async function (req, res) {
    try {
      const id = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        req.flash('error', 'Invalid Product id');
        return res.redirect('/owners/products');
      }

      const product = await Product.findById(id);
      if (!product) {
        req.flash('error', 'Product does not exists');
        return res.redirect('/owners/products');
      }

      const { name, price, description, category, discount } = req.body;

      if (name !== undefined) {
        const trimmedName = name.trim();
        if (!trimmedName) {
          req.flash('error', 'Product name cannot be empty');
          return res.redirect(`/owners/products/${id}/edit`);
        }
        product.name = trimmedName;
      }

      if (price !== undefined) {
        if (!(Number(price) > 0)) {
          req.flash('error', 'Invalid price');
          return res.redirect(`/owners/products/${id}/edit`);
        }
        product.price = Number(price);
      }

      if (category !== undefined) {
        if (!mongoose.Types.ObjectId.isValid(category)) {
          req.flash('error', 'Invalid category');
          return res.redirect(`/owners/products/${id}/edit`);
        }

        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          req.flash('error', 'Category not found');
          return res.redirect(`/owners/products/${id}/edit`);
        }

        product.category = category;
      }

      if (description !== undefined) {
        product.description = description;
      }

      if (discount !== undefined) {
        product.discount = discount;
      }

      if (req.file) {
        const uploadedImage = await uploadToCloudinary(req.file.buffer);
        product.image = uploadedImage.secure_url;
      }

      await product.save();
      req.flash('success', 'Product updated successfully');
      return res.redirect('/owners/products');
    } catch (err) {
      console.error('Error', err.message);
      return res.status(500).send('Server error');
    }
  },
);

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
