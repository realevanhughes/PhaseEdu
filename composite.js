const baseLogger = require('./logger');
const path = require("path");
const logger = baseLogger.child({label: path.basename(__filename)});
const points = require('./points');
const org = require('./org');
const people = require('./people');
const db = require("./db");

async function point_dict(uuid) {
    const pts = {};
    const org_id = await people.uuid_org_id(uuid);
    const point_cats = await points.point_cats(org_id);
    for (const cat of point_cats) {
        const total = await points.total_by_cat(uuid, cat.pts_cat_id);
        pts[cat.name] = [total, cat.description];
    }
    return pts;
}

async function periods_dict(uuid) {
    const year = await people.year_group(uuid);
    const [rows] = await db.query("SELECT name, start_time, end_time FROM periods WHERE year_group = ?", [year]);
    let result = {}
    for (let row of rows) {
        result[row.name] = {"start_time": row.start_time, "end_time": row.end_time};
    }
    return result;
}

module.exports = {
    point_dict,
    periods_dict,
};