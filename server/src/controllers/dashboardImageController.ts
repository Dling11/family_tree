import type { NextFunction, Request, Response } from 'express';
import { DashboardImage } from '../models/DashboardImage.js';
import { deleteProfileImage, uploadDashboardImage } from '../services/imageService.js';

export async function listPublicDashboardImages(_request: Request, response: Response, next: NextFunction) {
  try {
    const images = await DashboardImage.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).lean();
    response.json(images);
  } catch (error) { next(error); }
}

export async function listDashboardImages(_request: Request, response: Response, next: NextFunction) {
  try {
    const images = await DashboardImage.find().sort({ sortOrder: 1, createdAt: -1 }).lean();
    response.json(images);
  } catch (error) { next(error); }
}

export async function createDashboardImage(request: Request, response: Response, next: NextFunction) {
  let uploadedPublicId: string | undefined;
  try {
    if (!request.file) return response.status(400).json({ message: 'Dashboard image is required' });
    const uploaded = await uploadDashboardImage(request.file);
    uploadedPublicId = uploaded.publicId;
    const image = await DashboardImage.create({
      title: request.body.title || 'Rodriguez family memory',
      caption: request.body.caption,
      sortOrder: Number(request.body.sortOrder || 0),
      isActive: request.body.isActive !== 'false',
      imageUrl: uploaded.url,
      imagePublicId: uploaded.publicId,
    });
    response.status(201).json(image);
  } catch (error) {
    await deleteProfileImage(uploadedPublicId).catch(console.error);
    next(error);
  }
}

export async function deleteDashboardImage(request: Request, response: Response, next: NextFunction) {
  try {
    const image = await DashboardImage.findByIdAndDelete(request.params.id).select('+imagePublicId');
    if (!image) return response.status(404).json({ message: 'Dashboard image not found' });
    await deleteProfileImage(image.imagePublicId);
    response.status(204).send();
  } catch (error) { next(error); }
}
