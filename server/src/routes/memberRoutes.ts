import { Router } from 'express';
import { createMember, deleteMember, getMember, getTree, listMembers, updateMember } from '../controllers/memberController.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { upload } from '../middleware/upload.js';

export const memberRouter = Router();

memberRouter.get('/tree', getTree);
memberRouter.get('/:id', getMember);
memberRouter.get('/', requireAdmin, listMembers);
memberRouter.post('/', requireAdmin, upload.single('image'), createMember);
memberRouter.put('/:id', requireAdmin, upload.single('image'), updateMember);
memberRouter.delete('/:id', requireAdmin, deleteMember);
