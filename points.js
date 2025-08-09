const db = require('./db');
const people = require('./people');
const baseLogger = require('./logger');
const path = require("path");
const logger = baseLogger.child({label: path.basename(__filename)});

async function total(uuid) {
    let total = 0;
    const [rows] = await db.query("SELECT value FROM points WHERE uuid = ?", [uuid]);
    for (let row of rows) {
        total = total + row.value
    }
    return rows.length > 0 ? total : null;
}

async function point_cats(org_id){
    const [rows] = await db.query("SELECT * FROM point_cat WHERE org_id = ?", [org_id]);
    return rows.length > 0 ? rows : null;
}

async function total_by_cat(uuid, pts_cat_id) {
    let total = 0;
    const [rows] = await db.query("SELECT value FROM points WHERE uuid = ? AND category = ?", [uuid, pts_cat_id]);
    for (let row of rows) {
        total = total + row.value
    }
    return total;
}


module.exports = {
    total,
    point_cats,
    total_by_cat,
};