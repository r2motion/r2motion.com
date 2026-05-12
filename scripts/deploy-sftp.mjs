import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import SftpClient from 'ssh2-sftp-client';

const required = ['SFTP_HOST', 'SFTP_USERNAME', 'SFTP_TARGET_PATH'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing ${key}`);
  }
}

if (!process.env.SFTP_PASSWORD && !process.env.SFTP_PRIVATE_KEY) {
  throw new Error('Missing SFTP_PASSWORD or SFTP_PRIVATE_KEY');
}

const distDir = path.resolve('dist');
const stat = await fs.stat(distDir).catch(() => null);

if (!stat?.isDirectory()) {
  throw new Error('Missing dist directory. Run npm run build before deploy.');
}

const client = new SftpClient('r2motion-cloudways-deploy');
const port = Number.parseInt(process.env.SFTP_PORT || '22', 10);
const remotePath = process.env.SFTP_TARGET_PATH.replace(/\/+$/, '');

try {
  await client.connect({
    host: process.env.SFTP_HOST,
    port: Number.isFinite(port) ? port : 22,
    username: process.env.SFTP_USERNAME,
    password: process.env.SFTP_PASSWORD || undefined,
    privateKey: process.env.SFTP_PRIVATE_KEY || undefined,
    readyTimeout: 20000,
  });

  const remoteExists = await client.exists(remotePath);

  if (!remoteExists) {
    await client.mkdir(remotePath, true);
  }

  console.log(`Uploading ${distDir} to ${remotePath}`);
  await client.uploadDir(distDir, remotePath);
  console.log('SFTP upload complete.');
} finally {
  await client.end().catch(() => undefined);
}
