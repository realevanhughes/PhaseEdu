const mysql = require('mysql2');
const fs = require('fs');
require('dotenv').config();
const baseLogger = require('./logger');
const path = require("path");
const logger = baseLogger.child({label: path.basename(__filename)});


const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (process.env.DBCERT && process.env.DBCERT.trim() !== '') {
    config.ssl = {
        ca: fs.readFileSync(process.env.DBCERT)
    };
}
const pool = mysql.createPool(config);


const promisePool = pool.promise();

module.exports = promisePool;