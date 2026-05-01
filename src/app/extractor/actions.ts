'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/db';
import { contacts } from '@/db/schema';
import { uploadToGCS } from '@/lib/gcs';
import exifr from 'exifr';

export async function uploadAndExtractAction(formData: FormData) {
  try {
    const file = formData.get('image') as File;
    const clientLat = formData.get('lat') as string | null;
    const clientLng = formData.get('lng') as string | null;

    if (!file) {
      return { success: false, error: 'No file uploaded' };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Extract GPS Metadata
    let location = null;
    try {
      const gps = await exifr.gps(buffer);
      if (gps && gps.latitude && gps.longitude) {
        location = `${gps.latitude.toFixed(6)}, ${gps.longitude.toFixed(6)}`;
      }
    } catch (exifError) {
      console.warn('Failed to extract EXIF data:', exifError);
    }

    // Fallback to client location if EXIF GPS is missing
    if (!location && clientLat && clientLng) {
      location = `${parseFloat(clientLat).toFixed(6)}, ${parseFloat(clientLng).toFixed(6)}`;
    }

    // Save file to GCS
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const imagePath = await uploadToGCS(buffer, fileName, file.type);

    // Call Gemini API
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'GEMINI_API_KEY is not configured' };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `
      Extract the "name" and "phoneNumber" from this image.
      Respond strictly in JSON format without markdown wrapping, like this:
      {
        "name": "Extracted Name",
        "phoneNumber": "Extracted Phone Number"
      }
      If you cannot find a name or phone number, leave the field empty.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: file.type,
        },
      },
    ]);

    const responseText = result.response.text();
    let extractedData = { name: '', phoneNumber: '' };
    
    try {
      // Remove any potential markdown block markers if Gemini still includes them
      const cleanJson = responseText.replace(/```json\n?|\n?```/gi, '').trim();
      extractedData = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse JSON from Gemini:', responseText);
      return { success: false, error: 'Failed to extract data correctly from the image' };
    }

    // Save to database
    const [insertedContact] = await db.insert(contacts).values({
      name: extractedData.name || null,
      phoneNumber: extractedData.phoneNumber || null,
      location: location,
      imagePath,
    }).returning();

    return { 
      success: true, 
      data: insertedContact 
    };

  } catch (error: any) {
    console.error('Action error:', error);
    return { success: false, error: error.message || 'An error occurred' };
  }
}

export async function listModels() {

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'GEMINI_API_KEY is not configured' };
    }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await response.json();
  console.log(data.models.map((m: { name: any; }) => m.name));
}