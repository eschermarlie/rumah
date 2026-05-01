import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const contacts = pgTable('contacts', {
  id: serial('id').primaryKey(),
  name: text('name'),
  phoneNumber: text('phone_number'),
  location: text('location'),
  note: text('note'),
  imagePath: text('image_path').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
