const { GoogleGenAI } = require('@google/genai');

async function generateProductDescriptions(productData) {
  const { name, price, imageUrl, categoryName, discount } = productData;

  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY is not set in environment variables.');
  }

  const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
  });

  let priceInfo = `$${price}`;
  if (discount) {
    const discountedPrice = price * (1 - discount / 100);
    priceInfo = `$${price} (${discount}% off, now $${discountedPrice.toFixed(2)})`;
  }

  const prompt = `Write a compelling e-commerce product description for this ${categoryName.toLowerCase()} product.

Product: ${name}
Category: ${categoryName}
Price: ${priceInfo}

${imageUrl ? 'IMPORTANT: Analyze the product image carefully. Describe what you actually see - colors, materials, design, style, and specific visual details.' : ''}

Requirements:
- Write 2-3 sentences (under 350 characters total)
- Be specific and concrete, not generic
- Focus on actual features and benefits
- Use natural, conversational language
- Make it sound authentic and trustworthy
- ${imageUrl ? 'Reference specific visual details from the image' : 'Be descriptive based on the product name and category'}
- Do NOT use phrases like "command attention", "testament to", "elevate every moment" - be more direct
- Do NOT use em dashes or regular dashes
- Do NOT include the price

Write a clear, specific description that helps customers understand what they're buying:`;

  try {
    const contents = [{ text: prompt }];

    if (imageUrl) {
      contents.push({
        fileData: {
          fileUri: imageUrl,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
    });

    let description = response.text.trim();

    if (description.length > 350) {
      description = description.substring(0, 347) + '...';
    }

    return description;
  } catch (err) {
    console.error('Error generating description:', err);
    throw new Error(`Failed to generate description: ${err.message}`);
  }
}

module.exports.generateProductDescriptions = generateProductDescriptions;
