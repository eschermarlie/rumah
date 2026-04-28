'use server';

import { db } from '@/db';
import { contacts } from '@/db/schema';
import { desc } from 'drizzle-orm';

export async function getContacts() {
  try {
    const allContacts = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
    return { success: true, data: allContacts };
  } catch (error: any) {
    console.error('Failed to fetch contacts:', error);
    return { success: false, error: error.message || 'Failed to fetch contacts' };
  }
}
