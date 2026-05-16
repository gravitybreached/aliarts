import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Read credentials from environment variables — NEVER hardcode secrets in source code
const ACCESS_KEY = process.env.SCALEWAY_ACCESS_KEY;
const SECRET_KEY = process.env.SCALEWAY_SECRET_KEY;
const REGION = process.env.SCALEWAY_REGION || 'fr-par';
const ENDPOINT = process.env.SCALEWAY_ENDPOINT || 'https://s3.fr-par.scw.cloud';
const BUCKET = process.env.SCALEWAY_BUCKET || 'img-vessel';

if (!ACCESS_KEY || !SECRET_KEY) {
  console.error('ERROR: SCALEWAY_ACCESS_KEY and SCALEWAY_SECRET_KEY must be set in .env');
  console.error('Run: cp .env.example .env  then fill in your Scaleway credentials');
  process.exit(1);
}

const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
  forcePathStyle: false,
});

async function createFolders() {
  const basePath = process.env.SCALEWAY_BASE_PATH || 'aliarts';
  const adminPath = process.env.SCALEWAY_ADMIN_PATH || 'aliarts/admin';
  const userPath = process.env.SCALEWAY_USER_PATH || 'aliarts/users';

  const folders = [
    `${basePath}/`,
    `${adminPath}/`,
    `${userPath}/`,
  ];

  for (const folder of folders) {
    try {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: folder,
        Body: '',
        ContentType: 'application/x-directory',
      }));
      console.log(`Created folder: ${folder}`);
    } catch (error: any) {
      console.error(`Failed to create folder ${folder}:`, error.message);
    }
  }

  console.log('\nFolder structure created:');
  console.log(`${BUCKET}/`);
  console.log(`-- ${basePath}/`);
  console.log(`   -- admin/  (admin uploads: course thumbnails, banners, announcements, etc.)`);
  console.log(`   -- users/  (user uploads: avatars, artwork images, community posts, etc.)`);
}

createFolders();
