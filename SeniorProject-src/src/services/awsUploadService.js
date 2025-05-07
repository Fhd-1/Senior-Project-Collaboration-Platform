import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
// Replace with your actual credentials (temporary for dev only)
const REGION = "us-east-1"; // or your actual bucket region
const BUCKET_NAME = "collab-platform";

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: "",
    secretAccessKey: "",
  },
});

export async function uploadFileToS3(file) {
  const fileKey = `${uuidv4()}-${file.name}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: await file.arrayBuffer(),
    ContentType: file.type,
  });

  await s3.send(command);

  return fileKey; // You can store this in Firestore
}

export async function listFilesFromS3() {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
  });

  const response = await s3.send(command);
  return response.Contents || [];
}

export async function getDownloadUrl(fileKey) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });

  const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
  return url;
}

export async function deleteFileFromS3(fileKey) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });

  await s3.send(command);
}
