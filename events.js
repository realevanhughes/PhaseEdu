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

async function time_to_period(uuid, time) {
    let user_groupings = await people.groupings(uuid)
    const [rows] = await db.query("SELECT * FROM periods WHERE org = ? AND year_group = ?", [user_groupings.org, user_groupings.school_year]);
    for (const row of rows) {
        if (utils.isTimeInRange(time, row.start_time, row.end_time)) {
            return {"id": row.period_id, "name": row.name}
        }
    }
}

async function external_upcoming(uuid, days) {
    let now = new Date();
    let upcoming_events = []
    const all_classes = await classes.id_from_uuid(uuid)
    for (const one_class of all_classes) {
        const [rows] = await db.query("SELECT * FROM events WHERE class = ?", [one_class]);
        for (const row of rows) {
            if (all_classes.includes(row.class)) {
                const start_date = new Date(row.start_time);
                const end_date = new Date(row.end_time);
                const set_date = new Date(row.created_at);
                const room  = await utils.room_id_info(row.location)
                console.log(room)
                upcoming_events.push({
                    "event_id": row.event_id,
                    "description": row.description,
                    "location": room.name,
                    "start_time": start_date.toLocaleString(),
                    "end_time": end_date.toLocaleString(),
                    "set_time": set_date.toLocaleString()
                });
            }
        }
    }
    return {"result": "success", "events": upcoming_events};
}

module.exports = {
    upcoming,
    time_to_period,
    external_upcoming
};