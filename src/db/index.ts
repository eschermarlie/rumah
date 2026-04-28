import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

// Gunakan opsi ini untuk memastikan SSL dihandle dengan benar oleh driver
const client = postgres(connectionString, { 
  ssl: 'require',
  prepare: false // Penting untuk Neon/Connection Poolers agar tidak error "prepared statement"
});

export const db = drizzle(client);
