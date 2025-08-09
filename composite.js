const baseLogger = require('./logger');
const path = require("path");
const logger = baseLogger.child({label: path.basename(__filename)});
const points = require('./points');
const org = require('./org');
const people = require('./people');

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

module.exports = {
    point_dict,
};