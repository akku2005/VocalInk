const request = require('supertest');
const app = require('../src/app');

describe('Settings account deletion', () => {
  let accessToken;

  const testEmail = `delete_test_${Date.now()}@example.com`;
  const password = 'StrongPassw0rd!';

  it('registers and logs in a user', async () => {
    const register = await request(app)
      .post('/api/auth/register')
      .send({ email: testEmail, password, firstName: 'Del', lastName: 'User', skipVerification: true })
      .expect(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password })
      .expect(200);

    accessToken = login.body.accessToken;
    expect(accessToken).toBeDefined();
  });

  it('rejects deletion without valid confirmation', async () => {
    await request(app)
      .delete('/api/settings/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password, confirmationText: 'WRONG' })
      .expect(400);
  });

  it('deletes account with correct confirmation and password', async () => {
    const res = await request(app)
      .delete('/api/settings/account')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ password, confirmationText: 'DELETE' })
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});