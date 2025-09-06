const mysql = require('mysql2');
const fs = require('fs');
require('dotenv').config();
const baseLogger = require('./logger');
const path = require("path");
const logger = baseLogger.child({label: path.basename(__filename)});


let pool;
if (process.env.DBCERT !== '') {
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: {
            ca: fs.readFileSync(__dirname + '/ca-certificate.crt')
        },
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    })
}
else {
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    })
}



const promisePool = pool.promise();

module.exports = promisePool;