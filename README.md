# Luxvane

Luxvane is a Node.js application that provides a web interface for managing e-commerce inventory. It supports product CRUD operations, category management, analytics, and automated product description generation using Google Gemini API.

## Features

**Product Management**
- Full CRUD operations for products
- Image uploads handled by Cloudinary
- Products can be assigned to categories and filtered by category
- Product attributes including pricing and descriptions

**AI Description Generator**
- Generates product descriptions using Google Gemini
- Analyzes product images and metadata
- Outputs descriptions under 350 characters

**Category Management**
- Create and manage product categories
- Filter products by category

**Analytics**
- Product and category statistics
- Price range distribution
- Recent product tracking
- Discount analytics

**Authentication**
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes via middleware

**Logging**
- Winston logger with file and console output
- Separate error and combined log files
- Environment-based log levels

## Requirements

- Node.js 14 or higher
- MongoDB (local or Atlas)
- Google Gemini API key
- Cloudinary account

## Installation

1. Clone the repository
2. Run `npm install`
3. Create a `.env` file with the required variables (see Environment Variables)
4. Run `npm start`
5. Access the application at http://localhost:4400

## Environment Variables

Required variables:

```
MONGODB_URI=your_mongodb_connection_string
GOOGLE_API_KEY=your_google_gemini_api_key
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
JWT_KEY=your_jwt_secret_key
MY_SECRET_KEY=your_session_secret_key
```

Optional variables:

```
PORT=4400
NODE_ENV=development
```

PORT defaults to 4400. NODE_ENV defaults to development, which enables console logging and development only endpoints.

## First Admin User

In development mode, create the first admin user by sending a POST request to `/owners/create`:

```
POST /owners/create
{
  "fullname": "Admin Name",
  "email": "admin@example.com",
  "password": "password"
}
```

This endpoint only works when NODE_ENV is set to development and no owners exist in the database.



## Project Structure

```
Luxvane/
├── config/              # Configuration files
├── middlewares/         # Custom middleware
├── models/              # Mongoose models
├── routes/              # Express routes
├── utils/               # Utility functions
├── views/               # EJS templates
├── public/              # Static assets
├── logs/                # Log files
└── app.js               # Main application file
```

## Logging

Logs are written to the `logs/` directory:
- `error.log` - Error level logs only
- `combined.log` - All log levels

In development mode (NODE_ENV=development), logs are also written to the console. In production, logs are written to files only.

## Author
- Built by Bhavneet Kaur
- Feel free to fork, clone, or contribute.
