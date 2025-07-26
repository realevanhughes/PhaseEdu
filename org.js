const db = require('./db');
const people = require('./people');
const baseLogger = require('./logger');
const path = require("path");
const logger = baseLogger.child({label: path.basename(__filename)});

async function org_info(org_id) {
    const [rows] = await db.query("SELECT * FROM orgs WHERE org_id = ?", [org_id]);
    return rows.length > 0 ? rows[0] : null;
}

async function name_to_id(name){
    const [rows] = await db.query("SELECT org_id FROM orgs WHERE name = ?", [name]);
    return rows.length > 0 ? rows[0].org_id : null;
}

module.exports = {
    org_info,
    name_to_id
};