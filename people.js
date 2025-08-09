const db = require('./db');
const bcrypt = require("bcrypt");
const baseLogger = require('./logger');
const path = require("path");
const logger = baseLogger.child({label: path.basename(__filename)});



async function username_to_uuid(username) {
    const [rows] = await db.query("SELECT uuid FROM people WHERE username = ?", [username]);
    return rows.length > 0 ? rows[0].uuid : null;
}

async function email_to_uuid(email) {
    const [rows] = await db.query("SELECT uuid FROM people WHERE email = ?", [email]);
    return rows.length > 0 ? rows[0].uuid : null;
}

async function uuid_exists(uuid) {
    const [rows] = await db.query("SELECT uuid FROM people WHERE uuid = ?", [uuid]);
    if (rows.length === 0) {
        return false;
    }
    else {
        return true;
    }
}

async function uuid_org_id(uuid) {
    const [rows] = await db.query("SELECT org FROM people WHERE uuid = ?", [uuid]);
    return rows.length > 0 ? rows[0].org : null;
}

async function check_uuid_password(uuid, password) {
    const [rows] = await db.query("SELECT password FROM people WHERE uuid = ?", [uuid]);
    if (rows.length === 0) {
        return {"result": "failed", "message": "Invalid credentials!"};
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (match) {
        return {"result": "success", "message": "Login  successful!"}
    }
    else {
        return {"result": "failed", "message": "Invalid credentials"};
    }
}

async function general_user_data(uuid){
    const [rows] = await db.query("SELECT firstname, lastname, email, role FROM people WHERE uuid = ?", [uuid]);
    return rows.length > 0 ? rows[0] : null;
}

async function check_role(uuid, role) {
    const [rows] = await db.query("SELECT role FROM people WHERE uuid = ?", [uuid]);
    if (rows.length === 0) {
        return {"result": "failed", "message": "Invalid role or uuid!"}
    }
    if (rows[0].role === role) {
        return {"result": "success", "message": "Role check successful!"}
    }
    else {
        return {"result": "failed", "message": "User does not posses the role."}
    }
}


module.exports = {
    username_to_uuid,
    email_to_uuid,
    uuid_exists,
    check_uuid_password,
    uuid_org_id,
    general_user_data,
    check_role
};