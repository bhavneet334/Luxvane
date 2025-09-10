require('dotenv').config();
const {
  generateProductDescriptions,
} = require('./utils/generateAIDescriptions');

generateProductDescriptions({
  name: 'Luxury Watch',
  price: 299.99,
  imageUrl:
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
  categoryName: 'Accessories',
  discount: 15,
})
  .then((desc) => {
    console.log('Generated Description : ', desc);
    console.log('Length:', desc.length, 'characters');
  })
  .catch((err) => {
    console.error('Error:', err.message);
  });
