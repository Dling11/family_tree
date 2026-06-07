import { Router } from 'express';
import { createAdminToken, credentialsAreValid } from '../middleware/adminAuth.js';

export const authRouter = Router();

authRouter.post('/login', (request, response) => {
  const { username = '', password = '' } = request.body as { username?: string; password?: string };
  if (!credentialsAreValid(username, password)) {
    return response.status(401).json({ message: 'Incorrect username or password' });
  }

  response.json({ token: createAdminToken(), username });
});
