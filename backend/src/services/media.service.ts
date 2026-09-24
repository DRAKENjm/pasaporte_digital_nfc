import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ACCOUNT_ID
    ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export const MediaService = {
  async getUploadUrl(filename: string, contentType: string) {
    if (!process.env.R2_BUCKET_NAME) {
      // Fallback local mock for development without R2
      const mockKey = `dev/${randomUUID()}-${filename}`;
      return {
        uploadUrl: null,
        publicUrl: `https://placehold.co/600x400?text=${encodeURIComponent(filename)}`,
        key: mockKey,
        mock: true,
      };
    }

    const key = `media/${randomUUID()}-${filename}`;
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
    const publicUrl = `${process.env.R2_PUBLIC_URL || ""}/${key}`;

    return { uploadUrl, publicUrl, key, mock: false };
  },
};
