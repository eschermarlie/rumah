import { Storage, StorageOptions } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

let storageInstance: Storage | null = null;

function getStorage(): Storage {
  if (!storageInstance) {
    const options: StorageOptions = {};
    const keyFile = process.env.GCS_KEY_FILE;

    // Check if GCS_KEY_FILE is set
    if (keyFile) {
      const keyFilePath = path.resolve(process.cwd(), keyFile);

      if (fs.existsSync(keyFilePath)) {
        options.keyFilename = keyFilePath;
        console.log(`[Cloud Storage] Using credentials from: ${keyFilePath}`);
      } else {
        console.warn(`[Cloud Storage] Key file not found at: ${keyFilePath}, falling back to ADC`);
      }
    } else {
      console.log("[Cloud Storage] No GCS_KEY_FILE set, using Application Default Credentials");
    }

    storageInstance = new Storage(options);
  }
  return storageInstance;
}

export async function uploadToGCS(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const bucketName = process.env.GCS_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME is not configured');
  }

  try {
    const storage = getStorage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`uploads/${fileName}`);

    await file.save(buffer, {
      contentType: mimeType,
      // public: true,
    });

    return `https://storage.googleapis.com/${bucketName}/uploads/${fileName}`;
  } catch (error: any) {
    console.error('GCS Upload Error Details:', error);
    throw error;
  }
}

export async function deleteFromGCS(url: string): Promise<void> {
  const bucketName = process.env.GCS_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('GCS_BUCKET_NAME is not configured');
  }

  try {
    // Extract the path from the URL
    // Expected URL format: https://storage.googleapis.com/[bucket-name]/uploads/[filename]
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // pathname will be /[bucket-name]/uploads/[filename]
    // We want the part after the bucket name
    const filePath = pathParts.slice(2).join('/');

    if (!filePath) {
      console.warn(`[Cloud Storage] Could not extract file path from URL: ${url}`);
      return;
    }

    const storage = getStorage();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    await file.delete();
    console.log(`[Cloud Storage] Deleted file: ${filePath}`);
  } catch (error: any) {
    // If the file doesn't exist, we can ignore the error
    if (error.code === 404) {
      console.warn(`[Cloud Storage] File not found for deletion: ${url}`);
      return;
    }
    console.error('GCS Delete Error Details:', error);
    throw error;
  }
}
