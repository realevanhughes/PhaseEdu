const db = require('./db');
const baseLogger = require('./logger');

function generate_id(length=10) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function get_unique_id(table, column, length=10) {
    let id;
    let exists = true;
    while (exists) {
        id = generate_id(length);
        const [rows] = await db.query(`SELECT COUNT(*) AS count FROM \`${table}\` WHERE \`${column}\` = ?`, [id]);
        exists = rows[0].count > 0; // true if already exists
    }
    return id;
}

async function list_roles() {
    let all = {};
    const [rows] = await db.query("SELECT * FROM roles");
    for (let org of rows) {
        all[org.name] = org.description;
    }
    return rows.length > 0 ? all : null;
}

async function object_info(oid) {
    const [rows] = await db.query("SELECT * FROM objects WHERE oid = ?", [oid]);
    return rows.length > 0 ? rows[0] : null;
}

async function new_object(name, file_extension, owner, org, access, description, type, location) {
    let oid = await get_unique_id("objects", "oid", 20)
    await db.query("INSERT INTO objects (oid, name, file_extension, owner, org, access, description, type, location) values (?, ?, ?, ?, ?, ?, ?, ?, ?)", [oid, name, file_extension, owner, org, access, description, type, location]);
    return {"result": "success", "message": "Created object "+oid+"!", "oid": oid};
}

async function view_conditional(uuid) {
    const [rows] = await db.query("SELECT * FROM special_action WHERE uuid = ?", [uuid]);
    return rows.length > 0 ? rows[0] : null;
}

async function delete_conditional(uuid) {
    let response = await db.query("DELETE FROM special_action WHERE uuid = ?", [uuid]);
    let response2 = await db.query("UPDATE people SET special_action = 0 WHERE uuid = ?", [uuid]);
    if ((response.affectedRows > 0) && (response2.affectedRows > 0)) {
        return {"result": "success", "message": "Removed conditional"};
    }
    else {
        return {"result": "failed", "message": "No conditional found"};
    }
}

async function add_conditional(uuid, on_action, message, redirect, final) {
    let response = await db.query("INSERT INTO special_action (uuid, on_action, message, redirect, final) values (?, ?, ?, ?, ?) WHERE uuid = ?", [uuid, uuid, on_action, message, redirect, final]);
    let response2 = await db.query("UPDATE people SET special_action = 1 WHERE uuid = ?", [uuid]);
    if ((response.affectedRows > 0) && (response2.affectedRows > 0)) {
        return {"result": "success", "message": "Added conditional"};
    }
    else {
        return {"result": "failed", "message": "Could not complete"};
    }
}

module.exports = {
    generate_id,
    get_unique_id,
    list_roles,
    object_info,
    new_object,
    view_conditional,
    delete_conditional,
};