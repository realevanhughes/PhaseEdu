const db = require('./db');
const people = require('./people');
const baseLogger = require('./logger');
const path = require("path");
const logger = baseLogger.child({label: path.basename(__filename)});

async function from_uuid(uuid){
    const [rows] = await db.query("SELECT class_id FROM class_members WHERE uuid = ?", [uuid]);
    return rows.length > 0 ? rows : null;
}

async function names_from_uuid(uuid){
    let li = []
    let rows = await from_uuid(uuid);
    for (const row of rows) {
        const [rows2] = await db.query("SELECT name, class_id, color FROM classes WHERE class_id = ?", [row.class_id]);
        li.push({"name": rows2[0].name, "id": rows2[0].class_id, "color": rows2[0].color});
    }
    return {"result": "success", "list": li};
}

async function details_from_uuid(uuid){
    let li = []
    let rows = await from_uuid(uuid);
    for (const row of rows) {
        const [rows2] = await db.query("SELECT * FROM classes WHERE class_id = ?", [row.class_id]);
        li.push(rows2[0]);
    }
    return {"result": "success", "list": li};
}

async function id_from_uuid(uuid){
    let li = []
    let rows = await from_uuid(uuid);
    for (const row of rows) {
        const [rows2] = await db.query("SELECT class_id FROM classes WHERE class_id = ?", [row.class_id]);
        li.push(rows2[0].class_id);
    }
    return li;
}

async function is_in_class(uuid, class_id){
    const classes = await id_from_uuid(uuid);
    return classes.includes(class_id);
}

async function class_information(class_id){
    const [rows] = await db.query("SELECT * FROM classes WHERE class_id = ?", [class_id]);
    return rows.length > 0 ? rows[0] : null;
}

async function members(class_id){
    let li = []
    let rows = await await db.query("SELECT * FROM class_members WHERE class_id = ?", [class_id]);
    for (const row of rows) {
        li.push(row[0].uuid);
    }
    return {"result": "success", "members": li};
}

async function bulk_role(uuids){
    const placeholders = uuids.map((_, i) => `$${i + 1}`).join(", ");
    let rows = await await db.query("SELECT uuid, role FROM users WHERE uuid IN ?", [placeholders]);
}

async function get_name(class_id){
    const [rows] = await db.query("SELECT name FROM classes WHERE class_id = ?", [class_id]);
    return rows.length > 0 ? rows[0].name : null;
}

module.exports = {
    from_uuid,
    names_from_uuid,
    is_in_class,
    id_from_uuid,
    class_information,
    details_from_uuid,
    members,
    get_name,
};