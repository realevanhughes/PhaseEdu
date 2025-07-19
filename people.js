const db = require('./db');

async function username_to_uuid(username) {
    const [rows] = await db.query("SELECT uuid FROM people WHERE username = ?", [username]);
    return rows.length > 0 ? rows[0].uuid : null;
}

async function uuid_exists(uuid) {
    const [rows] = await db.query("SELECT uuid FROM people WHERE uuid = ?", [uuid]);
    if (rows.length === 0) {
        return false;
    }
    else {
        return true;
    }
}

module.exports = {
    username_to_uuid
};