import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'fr-par',
  endpoint: 'https://s3.fr-par.scw.cloud',
  credentials: {
    accessKeyId: 'SCW724X1XEW4EBEQPBDX',
    secretAccessKey: '45fce482-6cd5-446b-87d2-1118068745af',
  },
  forcePathStyle: false,
});

async function createFolders() {
  const bucket = 'img-vessel';
  const folders = [
    'aliarts/',
    'aliarts/admin/',
    'aliarts/users/',
  ];

  for (const folder of folders) {
    try {
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: folder,
        Body: '',
        ContentType: 'application/x-directory',
      }));
      console.log(`✅ Created folder: ${folder}`);
    } catch (error: any) {
      console.error(`❌ Failed to create folder ${folder}:`, error.message);
    }
  }

  console.log('\n📁 Folder structure created:');
  console.log('img-vessel/');
  console.log('└── aliarts/');
  console.log('    ├── admin/  (admin uploads: course thumbnails, banners, announcements, etc.)');
  console.log('    └── users/  (user uploads: avatars, artwork images, community posts, etc.)');
}

createFolders();
