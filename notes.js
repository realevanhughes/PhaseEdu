const db = require('./db');
const people = require('./people');
const baseLogger = require('./logger');
const path = require("path");
const utils = require("./utils");
const logger = baseLogger.child({label: path.basename(__filename)});

async function view_all(uuid){
    const [rows] = await db.query("SELECT note_id, name FROM notes WHERE owner = ? ORDER BY modified DESC", [uuid]);
    return rows.length > 0 ? rows : [];
}

async function new_note(uuid, name, md){
    const id = await utils.get_unique_id("notes", "note_id", 20)
    const now = new Date();
    const date_time = new Date(now);
    const [rows] = await db.query("INSERT INTO notes (note_id, modified, md, owner, name) values (?, ?, ?, ?, ?)", [id, date_time, md, uuid, name])
    return rows.length > 0 ? {"result": "success", "note_id": id} : {"result": "failed"};
}

async function view(id) {
    const [rows] = await db.query("SELECT * FROM notes WHERE note_id = ?", [id]);
    return rows.length > 0 ? rows[0] : null;
}


module.exports = {
    view_all,
    new_note,
    view,

};