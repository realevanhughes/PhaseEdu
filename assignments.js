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

async function get_hw(hw_id) {
    const [rows] = await db.query("SELECT * FROM homework WHERE hw_id IN (?)", [hw_id]);
    return rows.length > 0 ? rows[0] : null;
}

async function get_submission(submission_id) {
    const [rows] = await db.query("SELECT * FROM homework_submissions WHERE submission_id = ?", [submission_id]);
    return rows.length > 0 ? rows[0] : null;
}

async function get_submissions(hw_id) {
    const [rows] = await db.query("SELECT * FROM homework_submissions WHERE homework_id = ?", [hw_id]);
    return rows.length > 0 ? rows[0] : null;
}

async function new_submission(homework_id, uuid, submission_date_time, linked_files) {
    const submission_id = await utils.get_unique_id("homework_submissions", "submission_id", 10)
    let result = await db.query("INSERT INTO homework_submissions (submission_id, homework_id, uuid, submission_date_time, linked_files, final) values (?, ?, ?, ?, ?, false)", [submission_id, homework_id, uuid, submission_date_time, linked_files])
    if (result.affectedRows > 0) {
        return {"result": "success", "submission_id": submission_id};
    }
    else {
        return {"result": "failed", "message": "invalid submission"};
    }
}

async function update_submission(submission_id, submission_date_time, linked_files) {
    let result = await db.query("INSERT INTO homework_submissions (submission_date_time, linked_files) values (?, ?) WHERE submission_id = ?", [submission_date_time, linked_files, submission_id])
    if (result.affectedRows > 0) {
        return {"result": "success"};
    }
    else {
        return {"result": "failed", "message": "no submission found"};
    }
}

async function finalize_submission(submission_id) {
    let result = await db.query("UPDATE homework_submissions SET final = ? WHERE submission_id = ?", [true, submission_id]);
    if (result.affectedRows > 0) {
        return {"result": "success"};
    }
    else {
        return {"result": "failed", "message": "no submission found"};
    }
}

async function hw_status(hw_id, uuid, due_date_time) {
    const [rows] = await db.query("SELECT final FROM homework_submissions WHERE uuid = ? AND homework_id = ?", [uuid, hw_id]);
    const targetDate = utils.toUTC(due_date_time.replace(' ', 'T') + 'Z');
    const now = new Date();
    if (rows.length > 0) {
        if (rows[0].final === 1) {
            return "Handed in";
        }
    }
    if (targetDate <= now) {
        return "Overdue"
    }
    else {
        return "Not due"
    }
}

module.exports = {
    view,
    get_hw,
    get_submission,
    get_submissions,
    new_submission,
    update_submission,
    finalize_submission,
    hw_status,
}