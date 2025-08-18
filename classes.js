const db = require('./db');
const people = require('./people');
const baseLogger = require('./logger');
const path = require("path");
const logger = baseLogger.child({label: path.basename(__filename)});

async function from_uuid(uuid){
    const [rows] = await db.query("SELECT class_id FROM class_members WHERE uuid = ?", [uuid]);
    return rows.length > 0 ? rows : null;
}

module.exports = {
    from_uuid,
};