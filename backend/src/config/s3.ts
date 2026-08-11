import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!region) {
  throw new Error("AWS_REGION is not defined");
}

if (!accessKeyId) {
  throw new Error("AWS_ACCESS_KEY_ID is not defined");
}

if (!secretAccessKey) {
  throw new Error("AWS_SECRET_ACCESS_KEY is not defined");
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export default s3Client;