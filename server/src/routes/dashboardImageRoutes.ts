import { Router } from 'express';
import { createDashboardImage, deleteDashboardImage, listDashboardImages, listPublicDashboardImages } from '../controllers/dashboardImageController.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { upload } from '../middleware/upload.js';

export const dashboardImageRouter = Router();

dashboardImageRouter.get('/public', listPublicDashboardImages);
dashboardImageRouter.get('/', requireAdmin, listDashboardImages);
dashboardImageRouter.post('/', requireAdmin, upload.single('image'), createDashboardImage);
dashboardImageRouter.delete('/:id', requireAdmin, deleteDashboardImage);
