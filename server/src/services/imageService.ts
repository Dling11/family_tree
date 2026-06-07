import { Readable } from 'node:stream';
import { cloudinaryClient } from '../config/cloudinary.js';

const slugify = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '') || 'unassigned';

export interface UploadedProfileImage {
  url: string;
  publicId: string;
}

export function uploadProfileImage(file: Express.Multer.File, branch?: string): Promise<UploadedProfileImage> {
  const folder = `kinroot/family-members/${slugify(branch || 'unassigned')}`;
  return uploadCloudinaryImage(file, folder);
}

export function uploadDashboardImage(file: Express.Multer.File): Promise<UploadedProfileImage> {
  return uploadCloudinaryImage(file, 'kinroot/dashboard-carousel');
}

function uploadCloudinaryImage(file: Express.Multer.File, folder: string): Promise<UploadedProfileImage> {
  return new Promise((resolve, reject) => {
    const upload = cloudinaryClient.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary did not return an upload result'));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    Readable.from(file.buffer).pipe(upload);
  });
}

export async function deleteProfileImage(publicId?: string | null) {
  if (!publicId) return;
  await cloudinaryClient.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
}
