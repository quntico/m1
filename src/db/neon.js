const { Pool } = require('@neondatabase/serverless');
require('dotenv').config();

// Create a connection pool to Neon
// We use Pool instead of Client for backend connection to handle multiple concurrent requests efficiently.
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

/**
 * Reusable function to execute queries against the Neon PostgreSQL database.
 * @param {string} text - The SQL query text.
 * @param {Array} params - Array of parameter values for the query.
 * @returns {Promise<any>} - The query result.
 */
async function query(text, params) {
    const client = await pool.connect();
    try {
        const res = await client.query(text, params);
        return res;
    } finally {
        client.release();
    }
}

module.exports = {
    query,
    pool
};
