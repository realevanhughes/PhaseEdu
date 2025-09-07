const db = require('./db');
const utils = require('./utils');
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

async function total_by_polarity(uuid) {
    let total_good = 0;
    let total_bad = 0;
    const [rows] = await db.query("SELECT value FROM points WHERE uuid = ?", [uuid]);
    for (let row of rows) {
        if (row.value > 0) {
            total_good++;
        }
        if (row.value < 0) {
            total_bad++;
        }
    }
    return {"result": "success", "contents": [total_good, total_bad]};
}

async function give_point(uuid, class_id, assignee_id, value, comments, category) {
    const point_id = await utils.get_unique_id("points", "point_id", 10)
    await db.query("INSERT INTO points (point_id, uuid, class_id, assignee_id, value, comments, category) values (?, ?, ?, ?, ?, ?, ?)", [point_id, uuid, class_id, assignee_id, value, comments, category])
}


module.exports = {
    total,
    point_cats,
    total_by_cat,
    give_point,
    total_by_polarity,
};