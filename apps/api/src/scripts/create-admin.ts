import pg from 'pg';
import { parseArgs } from 'node:util';
import { generateTemporaryPassword, hashPassword } from '../auth/password.js';

/**
 * Creates an admin account, for the very first admin of a new database (after that, admins add
 * people in User Management). Prints a temporary password once; the admin sets their own at first
 * sign-in. Nothing secret is typed, so nothing lands in shell history.
 *
 *   npm run users:create-admin -- --email ops@example.com --name "Aiko Tanaka"
 *
 * Connects with DATABASE_URL_DIRECT, like the migrations. A command-line tool outside the Nest app,
 * so it runs its one INSERT itself rather than through UsersRepository.
 */

const USAGE = 'Usage: npm run users:create-admin -- --email <email> --name "<full name>"';

const INSERT_ADMIN = `
  INSERT INTO users (full_name, email, role, password_hash, must_change_password)
  VALUES ($1, $2, 'admin', $3, true)
  RETURNING id`;

async function main(): Promise<void> {
  const { values } = parseArgs({ options: { email: { type: 'string' }, name: { type: 'string' } } });
  const email = values.email?.trim().toLowerCase() ?? '';
  const fullName = values.name?.trim() ?? '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || fullName === '') {
    throw new Error(`An email address and a name are required.\n${USAGE}`);
  }
  const connectionString = process.env.DATABASE_URL_DIRECT;
  if (!connectionString) throw new Error('DATABASE_URL_DIRECT is not set (in .env or the environment).');

  const temporaryPassword = generateTemporaryPassword();
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query(INSERT_ADMIN, [fullName, email, await hashPassword(temporaryPassword)]);
  } catch (error) {
    if (error instanceof pg.DatabaseError && error.constraint === 'users_email_key') {
      throw new Error(`A user with the email ${email} already exists. Reset their password in User Management instead.`);
    }
    if (error instanceof pg.DatabaseError && error.code === '42P01') {
      throw new Error('The users table does not exist yet: run `npm run migrate:up` first.');
    }
    throw error;
  } finally {
    await client.end();
  }

  console.log(`Admin account created for ${fullName} <${email}>.`);
  console.log(`Temporary password: ${temporaryPassword}`);
  console.log('Give it to them privately. They will choose their own password at first sign-in.');
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
