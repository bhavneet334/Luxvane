const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Luxvane API',
      version: '1.0.0',
      description: 'E-commerce admin panel API documentation',
      contact: {
        name: 'Bhavneet Kaur',
      },
    },
    servers: [
      {
        url: 'http://localhost:4400',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Categories',
        description: 'Category management endpoints',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
          description: 'JWT token stored in HTTP-only cookie',
        },
      },
      schemas: {
        Category: {
          type: 'object',
          required: ['name'],
          properties: {
            _id: {
              type: 'string',
              description: 'Category ID',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              maxLength: 50,
              description: 'Category name',
              example: 'Electronics',
            },
            description: {
              type: 'string',
              description: 'Category description',
              example: 'Electronic devices and accessories',
            },
            slug: {
              type: 'string',
              description: 'URL-friendly category slug',
              example: 'electronics',
            },
            isActive: {
              type: 'boolean',
              default: true,
              description: 'Whether the category is active',
              example: true,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Category creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Category last update timestamp',
            },
          },
        },
      },
      responses: {
        CategoriesList: {
          description: 'List of all categories',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Category',
                },
              },
            },
          },
        },
        UnauthorizedError: {
          description: 'Authentication required or invalid token',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Unauthorized',
                  },
                  message: {
                    type: 'string',
                    example: 'Authentication token required',
                  },
                },
              },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Server error',
                  },
                },
              },
            },
          },
        },
        CategoryCreated: {
          description: 'Category created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Category',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Missing fields',
                  },
                },
              },
            },
          },
        },
        ConflictError: {
          description: 'Resource conflict',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Category already exists',
                  },
                },
              },
            },
          },
        },
        CategoryUpdated: {
          description: 'Category updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Category updated',
                  },
                  category: {
                    $ref: '#/components/schemas/Category',
                  },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: {
                    type: 'string',
                    example: 'Category not found',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./routes/categoriesRouter.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
