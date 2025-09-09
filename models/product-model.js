const mongoose = require('mongoose');
const { Schema } = mongoose;
const Category = require('./category-model');

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    description: String,
    discount: {
      type: Number,
      min: 0,
      max: 100,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('product', productSchema);
