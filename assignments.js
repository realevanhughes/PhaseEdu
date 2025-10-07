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

async function get_submissions(hw_id, uuid) {
    const [rows] = await db.query("SELECT * FROM homework_submissions WHERE homework_id = ? AND uuid = ?", [hw_id, uuid]);
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
    console.log("sub", submission_id);
    let result = await db.query("UPDATE homework_submissions SET final = ? WHERE submission_id = ?", [true, submission_id]);
    console.log("res", result);
    if (result.affectedRows > 0) {
        return {"result": "success"};
    }
    else {
        return {"result": "failed", "message": "no submission found or already finalized"};
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

async function is_locked_sub(submission_id) {
    const [rows] = await db.query(
        "SELECT final, homework_id FROM homework_submissions WHERE submission_id = ?",
        [submission_id]
    );

    // No submission → locked
    if (rows.length === 0) {
        console.log("no submission found");
        return true;
    }

    const [rows2] = await db.query(
        "SELECT due_date_time FROM homework WHERE hw_id = ?",
        [rows[0].homework_id]
    );

    const targetDate = utils.toUTC(rows2[0].due_date_time.replace(' ', 'T') + 'Z');
    const now = new Date();

    // Final submission → locked
    if (rows[0].final === 1) {
        console.log("handed in");
        return true;
    }

    // Past due date → locked
    if (targetDate <= now) {
        console.log("overdue");
        return true;
    }

    // Otherwise → unlocked
    console.log("no lock")
    return false;
}



async function is_locked_hw(hw_id, uuid) {
    const [rows] = await db.query(
        "SELECT final FROM homework_submissions WHERE uuid = ? AND homework_id = ?",
        [uuid, hw_id]
    );

    // No submission → locked
    if (rows.length === 0) {
        console.log("no submission found");
        return false;
    }

    const [rows2] = await db.query(
        "SELECT due_date_time FROM homework WHERE hw_id = ?",
        [hw_id]
    );

    // Convert due date safely
    const pretarget = rows2[0].due_date_time.toString();
    const targetDate = utils.toUTC(pretarget.replace(' ', 'T') + 'Z');
    const now = new Date();

    // Final submission → locked
    if (rows[0].final === 1) {
        console.log("handed in");
        return true;
    }

    // Past due date → locked
    if (targetDate <= now) {
        console.log("overdue");
        return true;
    }

    // Otherwise → unlocked
    console.log("no lock")
    return false;
}

async function rm_submission(submission_id) {
    let response = await db.query("DELETE FROM homework_submissions WHERE submission_id = ?", [submission_id]);
    if (response.affectedRows > 0) {
        return {"result": "success"};
    }
    else {
        return {"result": "failed", "message": "no submission found to delete"};
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
    is_locked_sub,
    is_locked_hw,
    rm_submission,
}