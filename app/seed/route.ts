import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = neon(databaseUrl);

function seedUsers() {
  const queries = [
    sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );
    `,
  ];

  users.forEach((user) => {
    const hashedPassword = bcrypt.hashSync(user.password, 10); // Use synchronous hash
    queries.push(
      sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `
    );
  });

  return queries;
}

function seedInvoices() {
  const queries = [
    sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        customer_id UUID NOT NULL,
        amount INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        date DATE NOT NULL
      );
    `,
  ];

  invoices.forEach((invoice) => {
    queries.push(
      sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `
    );
  });

  return queries;
}

function seedCustomers() {
  const queries = [
    sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
    sql`
      CREATE TABLE IF NOT EXISTS customers (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        image_url VARCHAR(255) NOT NULL
      );
    `,
  ];

  customers.forEach((customer) => {
    queries.push(
      sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `
    );
  });

  return queries;
}

function seedRevenue() {
  const queries = [
    sql`
      CREATE TABLE IF NOT EXISTS revenue (
        month VARCHAR(4) NOT NULL UNIQUE,
        revenue INT NOT NULL
      );
    `,
  ];

  revenue.forEach((rev) => {
    queries.push(
      sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `
    );
  });

  return queries;
}

export async function GET() {
  try {
    const result = await sql.transaction(() => {
      const users = seedUsers();
      const customers = seedCustomers();
      const invoices = seedInvoices();
      const revenue = seedRevenue();
      return [...users, ...customers, ...invoices, ...revenue];
    });

    return new Response(
      JSON.stringify({ message: 'Database seeded successfully' })
    );
  } catch (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  }
}
