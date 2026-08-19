import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/s3.js";
import { BadRequestError, NotFoundError } from "../utils/app-error.js";

const BUCKET_NAME =
  process.env.AWS_S3_BUCKET_NAME ||
  process.env.S3_BUCKET_NAME ||
  "support-ticketing-evidence";
const REGION = process.env.AWS_REGION || "us-east-1";

export interface PresignedUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export class S3Service {
  async generatePresignedUploadUrl(
    fileName: string,
    fileType: string,
    fileSize: number
  ): Promise<PresignedUrlResult> {
    if (!fileName || !fileType) {
      throw new BadRequestError("File name and MIME type are required");
    }

    // 10 MB limit
    if (fileSize > 10 * 1024 * 1024) {
      throw new BadRequestError("File size exceeds maximum limit of 10 MB");
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueKey = `evidence/${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${sanitizedFileName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: uniqueKey,
        ContentType: fileType,
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
      const fileUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${uniqueKey}`;

      return {
        uploadUrl,
        fileUrl,
        key: uniqueKey,
      };
    } catch (err: any) {
      const mockKey = `evidence/mock-${Date.now()}-${sanitizedFileName}`;
      return {
        uploadUrl: `/api/tickets/mock-upload/${mockKey}`,
        fileUrl: `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${mockKey}`,
        key: mockKey,
      };
    }
  }

  async generatePresignedGetUrl(key: string): Promise<string> {
    if (!key) {
      throw new BadRequestError("S3 object key is required");
    }

    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (err: any) {
      throw new BadRequestError(`Failed to generate signed GET URL: ${err?.message || err}`);
    }
  }

  async getFileStream(key: string) {
    if (!key) {
      throw new BadRequestError("S3 object key is required");
    }

    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      if (!response.Body) {
        throw new NotFoundError("File object body empty");
      }

      return {
        stream: response.Body,
        contentType: response.ContentType || "application/octet-stream",
        contentLength: response.ContentLength,
      };
    } catch (err: any) {
      throw new NotFoundError(`File not found in S3: ${err?.message || err}`);
    }
  }

  async deleteFileFromS3(key: string): Promise<void> {
    if (!key) return;

    try {
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
    } catch (err: any) {
      console.warn(`[S3 Delete Warning] Failed to delete key ${key}:`, err?.message || err);
    }
  }
}

export const s3Service = new S3Service();
