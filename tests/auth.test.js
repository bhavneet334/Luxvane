require('dotenv').config();
const { generateToken } = require('../utils/generateToken');

describe('Authentication', () => {
  test('Should generate a JWT token', () => {
    const user = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
    };

    const token = generateToken(user);

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  test('Should generate different tokens for different users', () => {
    const user1 = {
      _id: '507f1f77bcf86cd799439011',
      email: 'user1@example.com',
    };

    const user2 = {
      _id: '507f1f77bcf86cd799439012',
      email: 'user2@example.com',
    };

    const token1 = generateToken(user1);
    const token2 = generateToken(user2);

    expect(token1).not.toBe(token2);
  });
});