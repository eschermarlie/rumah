import { Storage } from '@google-cloud/storage';

const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const bucketName = process.env.GCS_BUCKET_NAME || '';

export async function uploadToGCS(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME is not configured');
  }

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(`uploads/${fileName}`);

  await file.save(buffer, {
    contentType: mimeType,
    public: true, // Making it public so we can view it
  });

  // Return the public URL
  return `https://storage.googleapis.com/${bucketName}/uploads/${fileName}`;
}
