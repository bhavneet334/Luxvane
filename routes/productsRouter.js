const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const isOwnerAuthenticated = require('../middlewares/isOwnerAuthenticated');
const Product = require('../models/product-model');
const ownerModel = require('../models/owner-model');
const Category = require('../models/category-model');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const logger = require('../utils/logger');
const { generateProductDescriptions } = require('../utils/generateAIDescriptions');

//List all products, and optionally filter by categories
router.get('/', isOwnerAuthenticated, async function (req, res) {
  try {
    const { category, search } = req.query;
    const searchQuery = search ? search.trim() : '';

    if (category && !mongoose.Types.ObjectId.isValid(category)) {
      req.flash('error', 'Invalid category');
      return res.redirect('/owners/products');
    }

    let categoryExists = null;
    if (category) {
      categoryExists = await Category.findById(category);
      if (!categoryExists) {
        req.flash('error', 'Category not found');
        return res.redirect('/owners/products');
      }
    }

    let productQuery = {};

    if(category){
      productQuery.category = category;
    }

    if(searchQuery){
      productQuery.$or = [
        {name : { $regex : searchQuery, $options : 'i' }},
        {description : { $regex : searchQuery, $options : 'i' }}
      ];
    }

    const [categories, products] = await Promise.all([
      Category.find().lean(),
      Product.find(productQuery).populate('category', 'name').lean(),
    ]);

    res.render('admin/products', {
      products,
      categories,
      selectedCategory: category || null,
      searchQuery:searchQuery || null,
      owner: req.owner,
    });
  } catch (err) {
    req.flash('error', 'Failed to load products');
    logger.error('Error loading products', err);
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

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

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
  '/generate-description',
  isOwnerAuthenticated,
  upload.single('uploaded_file'),
  async function (req, res) {
    try {
      if (!req.body) {
        req.flash('error', 'Invalid request data');
        return res.redirect('/owners/products/create');
      }

      const name = req.body.name ? req.body.name.trim() : '';
      const price = req.body.price ? String(req.body.price).trim() : '';
      const category = req.body.category
        ? String(req.body.category).trim()
        : '';
      const discount = req.body.discount
        ? String(req.body.discount).trim()
        : '';
      const imageUrl = req.body.imageUrl ? req.body.imageUrl.trim() : '';
      const productId = req.body.productId
        ? String(req.body.productId).trim()
        : '';

      if (!name || !price || !category) {
        req.flash('error', 'Name, price, and category are required');
        const redirectPath = productId
          ? `/owners/products/${productId}/edit`
          : '/owners/products/create';
        return res.redirect(redirectPath);
      }

      if (!mongoose.Types.ObjectId.isValid(category)) {
        req.flash('error', 'Invalid category selected');
        const redirectPath = productId
          ? `/owners/products/${productId}/edit`
          : '/owners/products/create';
        return res.redirect(redirectPath);
      }

      const categoryDoc = await Category.findById(category);
      if (!categoryDoc) {
        req.flash('error', 'Category not found');
        const redirectPath = productId
          ? `/owners/products/${productId}/edit`
          : '/owners/products/create';
        return res.redirect(redirectPath);
      }

      let finalImageUrl = imageUrl;

      if (req.file) {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        finalImageUrl = uploadResult.secure_url;
      }

      if (!finalImageUrl) {
        req.flash('error', 'Image is required for AI description generation');
        const redirectPath = productId
          ? `/owners/products/${productId}/edit`
          : '/owners/products/create';
        return res.redirect(redirectPath);
      }

      const description = await generateProductDescriptions({
        imageUrl: finalImageUrl,
        name: name,
        price: Number(price),
        categoryName: categoryDoc.name,
        discount: discount ? Number(discount) : undefined,
      });

      const categories = await Category.find();
      const isEdit = productId ? true : false;

      if (isEdit) {
        const product = await Product.findById(productId);
        if (!product) {
          req.flash('error', 'Product not found');
          return res.redirect('/owners/products');
        }

        res.render('admin/edit-product', {
          owner: req.owner,
          categories,
          product,
          generatedDescription: description,
          formData: {
            name: name,
            price: price,
            category: category,
            discount: discount || '',
          },
        });
      } else {
        res.render('admin/create-product', {
          owner: req.owner,
          categories,
          generatedDescription: description,
          formData: {
            name: name,
            price: price,
            category: category,
            discount: discount || '',
          },
        });
      }
    } catch (err) {
      logger.error('Error generating AI description:', err);
      req.flash('error', 'Failed to generate description');
      const productId =
        req.body && req.body.productId ? req.body.productId : null;
      const redirectPath = productId
        ? `/owners/products/${productId}/edit`
        : '/owners/products/create';
      return res.redirect(redirectPath);
    }
  },
);

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

      if (name.trim().length > 200) {
        req.flash('error', 'Product name must be less than 200 characters.');
        return res.redirect('/owners/products/create');
      }

      if (description && description.trim().length > 2000) {
        req.flash(
          'error',
          'Product description must be less than 2000 characters.',
        );
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
      logger.error('Error creating product:', err);
      req.flash('error', 'Failed to create product');
      return res.redirect('/owners/products/create');
    }
  },
);

//Show edit product form
router.get('/:id/edit', isOwnerAuthenticated, async function (req, res) {
  try {
    const id = req.params.id;
    const categories = await Category.find();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'Invalid product ID');
      return res.redirect('/owners/products');
    }

    const product = await Product.findById(id);
    if (!product) {
      req.flash('error', 'Product does not exist');
      return res.redirect('/owners/products');
    }

    res.render('admin/edit-product', { product, owner: req.owner, categories });
  } catch (err) {
    logger.error('Error loading edit product form:', err);
    req.flash('error', 'Failed to load product');
    return res.redirect('/owners/products');
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

      if (name !== undefined && name.trim().length > 200) {
        req.flash('error', 'Product name must be less than 200 characters');
        return res.redirect(`/owners/products/${id}/edit`);
      }

      if (description !== undefined && description.length > 2000) {
        req.flash('error', 'Description must be less than 2000 characters');
        return res.redirect(`/owners/products/${id}/edit`);
      }

      if (name !== undefined) {
        const trimmedName = name.trim();
        if (!trimmedName) {
          req.flash('error', 'Product name cannot be empty');
          return res.redirect(`/owners/products/${id}/edit`);
        }

        const duplicate = await Product.findOne({
          _id: { $ne: id },
          name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
        });

        if (duplicate) {
          req.flash('error', 'Product with this name already exists');
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
      logger.error('Error updating product:', err);
      req.flash('error', 'Failed to update product');
      return res.redirect(`/owners/products/${id}/edit`);
    }
  },
);

//Delete product
router.post('/:id/delete', isOwnerAuthenticated, async function (req, res) {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'Invalid product ID');
      return res.redirect('/owners/products');
    }

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      req.flash('error', 'Product not found');
      return res.redirect('/owners/products');
    }

    req.flash('success', 'Product deleted successfully');
    return res.redirect('/owners/products');
  } catch (err) {
    logger.error('Error deleting product:', err);
    req.flash('error', 'Failed to delete product');
    return res.redirect('/owners/products');
  }
});

//View specific product
router.get('/:id', isOwnerAuthenticated, async function (req, res) {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error', 'Invalid product ID');
      return res.redirect('/owners/products');
    }

    const product = await Product.findById(id);
    if (!product) {
      req.flash('error', 'Product does not exist');
      return res.redirect('/owners/products');
    }

    res.render('product-details', { product });
  } catch (err) {
    logger.error('Error viewing product:', err);
    req.flash('error', 'Failed to load product');
    return res.redirect('/owners/products');
  }
});

module.exports = router;
