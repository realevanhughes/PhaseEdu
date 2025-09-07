const db = require('./db');
const classes = require('./classes');
const baseLogger = require('./logger');
const path = require("path");
const logger = baseLogger.child({label: path.basename(__filename)});

async function count(uuid) {
    let all_records = []
    for (let given_class of await classes.from_uuid(uuid)) {
        let class_register = await db.query("SELECT contents FROM registers WHERE class = ?", [given_class.class_id])
        all_records = all_records.concat(class_register[0])
    }
    let status_types = []
    let count = []
    let statuses = {}
    for (let entry of all_records) {
        if (!status_types.includes(entry.contents[uuid])){
            status_types.push(entry.contents[uuid])
        }
        statuses[entry.contents[uuid]] = (statuses[entry.contents[uuid]] || 0) + 1;
    }
    for (const [key, value] of Object.entries(statuses)) {
        count.push(value)
    }
    return {"result": "success","status_types": status_types, "count": count};
}

async function percent(uuid) {
    const statuses = await count(uuid);
    const total = Object.values(statuses).reduce((sum, current) => sum + current, 0);
    let percents = statuses;
    Object.keys(percents).forEach(key => {
        percents[key] /= total;
        percents[key] *= 100;
    });
    return percents;
}

async function percentage_by_status(uuid, status) {
    const statuses = await percent(uuid);
    return statuses[status] || 0;
}

async function count_by_status(uuid, status) {
    const statuses = await count(uuid);
    return statuses[status] || 0;
}


async function presence_dict(uuid) {
    const [rows] = await db.query("SELECT contents, submit_date_time FROM registers");
    let result = []
    for (let row of rows) {
        if (uuid in row.contents) {
            const ts = new Date(row.submit_date_time);
            result.push({"day" : ts.toISOString().split("T")[0], "period" : row.period, "state": row.contents[uuid]});
        }
    }
    return result;
}

module.exports = {
    percentage_by_status,
    count_by_status,
    count,
    percent,
    presence_dict
};