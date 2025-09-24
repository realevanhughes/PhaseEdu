const db = require('./db');
const utils = require('./utils');
const people = require('./people');
const classes = require('./classes');
const baseLogger = require('./logger');
const path = require("path");
const logger = baseLogger.child({label: path.basename(__filename)});

async function upcoming(uuid, days) {
    let now = new Date();
    let upcoming_events = []
    const all_classes = await classes.id_from_uuid(uuid)
    for (const one_class of all_classes) {
        const [rows] = await db.query("SELECT * FROM events WHERE class = ?", [one_class]);
        for (const row of rows) {
            if (all_classes.includes(row.class)) {
                upcoming_events.push(row)
            }
        }
    }

    return {"result": "success", "events": upcoming_events};
}

module.exports = {
    upcoming,
};