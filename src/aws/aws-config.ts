import 'dotenv/config';

export const config = {
  endpoint: process.env.AMAZON_ENDPOINT || 'http://localhost:4566',
  accessKeyId: process.env.AMAZON_ACCESS_KEY_ID || 'na',
  secretAccessKey: process.env.AMAZON_SECRET_ACCESS_KEY || 'na',
  region: process.env.AMAZON_REGION || 'us-east-1',
};
