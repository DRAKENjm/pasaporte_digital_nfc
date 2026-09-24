import { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID || "";
const endpoint =
  process.env.R2_ENDPOINT || `https://${accountId}.r2.cloudflarestorage.com`;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "pasaporte-media";
export const R2_PUBLIC_URL =
  process.env.R2_PUBLIC_URL || "https://pub-r2.example.com";
