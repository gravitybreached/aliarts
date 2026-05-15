import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({
  region: process.env.SCALEWAY_REGION || "fr-par",
  endpoint: process.env.SCALEWAY_ENDPOINT || "https://s3.fr-par.scw.cloud",
  credentials: {
    accessKeyId: process.env.SCALEWAY_ACCESS_KEY || "",
    secretAccessKey: process.env.SCALEWAY_SECRET_KEY || "",
  },
  forcePathStyle: false,
});

const BUCKET = process.env.SCALEWAY_BUCKET || "img-vessel";
const ADMIN_PATH = process.env.SCALEWAY_ADMIN_PATH || "aliarts/admin";
const USER_PATH = process.env.SCALEWAY_USER_PATH || "aliarts/users";

export function getUploadPath(role: string, folder?: string): string {
  const basePath = role === "ADMIN" ? ADMIN_PATH : USER_PATH;
  return folder ? `${basePath}/${folder}` : basePath;
}

export async function uploadToS3(
  file: Buffer,
  fileName: string,
  mimeType: string,
  role: string = "USER",
  folder?: string
): Promise<{ url: string; key: string }> {
  const basePath = getUploadPath(role, folder);
  const key = `${basePath}/${fileName}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: file,
      ContentType: mimeType,
      ACL: "public-read",
    })
  );

  const url = `https://${BUCKET}.s3.${process.env.SCALEWAY_REGION}.scw.cloud/${key}`;

  return { url, key };
}

export async function deleteFromS3(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export async function listS3Objects(prefix?: string): Promise<any[]> {
  const response = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
    })
  );

  return response.Contents || [];
}

export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

export { s3, BUCKET };
