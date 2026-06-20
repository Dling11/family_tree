import { Router } from 'express';
import { createFamilyGroup, listFamilyGroups } from '../controllers/familyGroupController.js';
import { requireAdmin } from '../middleware/adminAuth.js';

export const familyGroupRouter = Router();

familyGroupRouter.get('/', requireAdmin, listFamilyGroups);
familyGroupRouter.post('/', requireAdmin, createFamilyGroup);
