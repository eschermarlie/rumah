'use server';

import { db } from '@/db';
import { contacts } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { deleteFromGCS } from '@/lib/gcs';
import { revalidatePath } from 'next/cache';

export async function getContacts() {
  try {
    // Test koneksi murni
    const test = await db.execute(sql`SELECT 1`);
    console.log("Connection test success:", test);
    
    const allContacts = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
    return { success: true, data: allContacts };
  } catch (error: any) {
    // Log error lengkap ke Cloud Logging
    console.error('DATABASE_DEBUG:', error.message, error.stack);
    return { success: false, error: error.message };
  }
}

export async function deleteContact(id: number) {
  try {
    // 1. Get the contact to find the image path
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
    
    if (!contact) {
      throw new Error('Contact not found');
    }

    // 2. Delete from GCS
    if (contact.imagePath) {
      await deleteFromGCS(contact.imagePath);
    }

    // 3. Delete from Database
    await db.delete(contacts).where(eq(contacts.id, id));

    revalidatePath('/contacts');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete contact:', error);
    return { success: false, error: error.message || 'Failed to delete contact' };
  }
}
