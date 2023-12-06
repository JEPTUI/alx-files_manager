import request from 'supertest';
import app from '../../server'; // Adjust path based on your actual file structure

describe('AppController', () => {
  it('should return status and stats', async () => {
    const response = await request(app).get('/status');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ redis: true, db: true });
  });
});
