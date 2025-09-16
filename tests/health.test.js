process.env.NODE_ENV = 'test';
require('dotenv').config();
const request = require('supertest');
const app = require('../app');

describe('Health Check Endpoints', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app).get('/health').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptimeSeconds');
  });

  test('GET /ready should return correct structure', async () => {
    const response = await request(app).get('/ready');

    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptimeSeconds');
    expect(response.body.database).toBeDefined();
    expect(response.body.database).toHaveProperty('status');
    expect(response.body.database).toHaveProperty('readyState');

    if (response.body.database.status === 'connected') {
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    } else {
      expect(response.status).toBe(503);
      expect(response.body.status).toBe('not_ready');
    }
  });
});
