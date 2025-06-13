const { Pool } = require('pg');
require('dotenv').config();

// Set NODE_TLS_REJECT_UNAUTHORIZED to 0 to allow self-signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: true
});

// Test the connection
pool.on('connect', () => {
  console.log('✅ Database connection established');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
  if (err.code === 'SELF_SIGNED_CERT_IN_CHAIN') {
    console.error('SSL Certificate Error: Please check your SSL configuration');
  }
  process.exit(-1);
});

// Add a test query function
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database');
    client.release();
  } catch (err) {
    console.error('Error testing database connection:', err);
    throw err;
  }
};

// Test the connection immediately
testConnection().catch(console.error);

module.exports = pool;
