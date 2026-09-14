import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '../config/cloudflareR2';
import crypto from 'crypto';

export const MediaService = {
  async uploadMedia(file: Express.Multer.File, folder = 'posts'): Promise<string> {
    const fileExt = file.originalname.split('.').pop() || 'mp4';
    const randomHash = crypto.randomBytes(16).toString('hex');
    const key = `${folder}/${Date.now()}-${randomHash}.${fileExt}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await r2Client.send(command);

    return `${R2_PUBLIC_URL}/${key}`;
  },
};
