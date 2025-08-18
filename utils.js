const db = require('./db');
const baseLogger = require('./logger');

function generate_id(length=10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function get_unique_id(table, column, length=10) {
    let id;
    let exists = true;
    while (exists) {
        id = generate_id(length);
        const [rows] = await db.query(`SELECT COUNT(*) AS count FROM \`${table}\` WHERE \`${column}\` = ?`, [id]);
        exists = rows[0].count > 0; // true if already exists
    }
    return id;
}

module.exports = {
    generate_id,
    get_unique_id,
};