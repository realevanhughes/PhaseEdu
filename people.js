const db = require('./db');
const utils = require('./utils');
const bcrypt = require("bcrypt");
const baseLogger = require('./logger');
const path = require("path");
const logger = baseLogger.child({label: path.basename(__filename)});



async function username_to_uuid(username) {
    const [rows] = await db.query("SELECT uuid FROM people WHERE username = ?", [username]);
    return rows.length > 0 ? rows[0].uuid : null;
}

async function uuid_to_username(uuid) {
    const [rows] = await db.query("SELECT uuid FROM people WHERE uuid = ?", [uuid]);
    return rows.length > 0 ? rows[0].username : null;
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
    const [rows] = await db.query("SELECT username, firstname, lastname, email, role, profile_icon, pronouns FROM people WHERE uuid = ?", [uuid]);
    return rows.length > 0 ? rows[0] : null;
}

async function check_role(uuid, role) {
    const [rows] = await db.query("SELECT role, special_action FROM people WHERE uuid = ?", [uuid]);
    if (rows.length === 0) {
        return {"result": "failed", "message": "Invalid role or uuid!"}
    }
    if (rows[0].role === role) {
        return {"result": "success", "message": "Role check successful!", "special_action": rows[0].special_action};
    }
    else {
        return {"result": "failed", "message": "User does not posses the role."}
    }
}

async function role(uuid) {
    const [rows] = await db.query("SELECT role, special_action FROM people WHERE uuid = ?", [uuid]);
    return {"result": "success", "role": rows[0].role, "special_action": rows[0].special_action};
}

async function year_group(uuid) {
    const [rows] = await db.query("SELECT school_year FROM people WHERE uuid = ?", [uuid]);
    return rows.length > 0 ? rows[0].school_year : null;
}

async function new_user(username, password, email, org, firstname, lastname, role, date_joined, school_year) {
    let uuid = await utils.get_unique_id("people", "uuid", 10)
    let hashed_password = await bcrypt.hash(password, 10);
    await db.query("INSERT INTO people (username, uuid, password, email, org, firstname, lastname, role, date_joined, school_year) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [username, uuid, hashed_password, email, org, firstname, lastname, role, date_joined, school_year])
    return {"result": "success", "message": "Created user "+uuid+"!"}
}

async function list() {
    const [rows] = await db.query("SELECT * FROM people");
    return rows;
}

async function list_org(org_id) {
    const [rows] = await db.query("SELECT * FROM people WHERE org_id = ?", [org_id]);
    return rows;
}

async function get_profile_oid(uuid) {
    const [rows] = await db.query("SELECT profile_icon FROM people WHERE uuid = ?", [uuid]);
    return rows.length > 0 ? rows[0].profile_icon : null;
}

async function groupings(uuid) {
    const [rows] = await db.query("SELECT org, role, school_year FROM people WHERE uuid = ?", [uuid]);
    return rows.length > 0 ? rows[0] : null;
}

async function uuid_to_name(uuid) {
    const [rows] = await db.query("SELECT firstname, lastname FROM people WHERE uuid = ?", [uuid]);
    return rows.length > 0 ? (rows[0].firstname + " " + rows[0].lastname) : null;
}

module.exports = {
    username_to_uuid,
    uuid_to_username,
    email_to_uuid,
    uuid_exists,
    check_uuid_password,
    uuid_org_id,
    general_user_data,
    check_role,
    year_group,
    new_user,
    list,
    list_org,
    get_profile_oid,
    role,
    groupings,
    uuid_to_name
};