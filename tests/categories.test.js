require('dotenv').config();
process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const { generateToken } = require('../utils/generateToken');

describe('Category API', () => {
  let authToken;

  beforeEach(() => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
    };
    authToken = generateToken(user);
  });

  test('GET /owners/categories should require authentication', async () => {
    const response = await request(app)
      .get('/owners/categories')
      .set('Accept', 'application/json')
      .expect(401);

    expect(response.body.error).toBe('Unauthorized');
    expect(response.body.message).toBe('Authentication token required');
  });

  test('GET /owners/categories should return categories when authenticated', async () => {
    const response = await request(app)
      .get('/owners/categories')
      .set('Accept', 'application/json')
      .set('Cookie', `token=${authToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});

