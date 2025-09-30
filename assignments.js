const db = require('./db');
const utils = require('./utils');
const classes = require('./classes');
const bcrypt = require("bcrypt");
const baseLogger = require('./logger');
const path = require("path");
const logger = baseLogger.child({label: path.basename(__filename)});

async function view(uuid) {
    let class_li = []
    const all_classes = await classes.from_uuid(uuid);
    for (let item of all_classes){
        class_li.push(item.class_id);
    }
    const [rows] = await db.query("SELECT * FROM homework WHERE class_id IN (?)", [class_li]);
    return rows.length > 0 ? rows : null;
}

module.exports = {
    view,
}