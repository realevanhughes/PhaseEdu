const db = require('./db');
const baseLogger = require('./logger');
const orgs = require('./org');
const people = require('./people');
const { createCanvas } = require('canvas');
const path = require('path');
const fs = require("fs");

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

function timeToSeconds(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}
function isTimeInRange(target, start, end) {
    const targetSec = timeToSeconds(target);
    const startSec = timeToSeconds(start);
    const endSec = timeToSeconds(end);

    return targetSec >= startSec && targetSec <= endSec;
}

async function room_id_info(room_id) {
    const [rows] = await db.query("SELECT * FROM locations WHERE room_id = ?", [room_id]);
    return rows.length > 0 ? rows[0] : null;
}

async function room_id_name(room_id) {
    const [rows] = await db.query("SELECT name FROM locations WHERE room_id = ?", [room_id]);
    return rows.length > 0 ? rows[0].name : null;
}


async function generate_profile_icon(name) {
    const canvasSize = 200; // image size
    const canvas = createCanvas(canvasSize, canvasSize);
    const ctx = canvas.getContext('2d');

    const colors = ["#FFB6C1", "#FFD700", "#ADFF2F", "#00CED1", "#FF7F50", "#60ff57", "#09a800"];
    const colorIndex = name.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const initial = name[0].toUpperCase();
    ctx.fillStyle = "#fff";
    ctx.font = `${canvasSize * 0.5}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initial, canvasSize / 2, canvasSize / 2);

    const buffer = canvas.toBuffer("image/png");

    return {buffer, extension: "png", baseName: `${initial}_avatar`};
}

async function save_generated_image(name, uuid, org) {
    const { buffer, extension, baseName } = await generate_profile_icon(name);

    const owner = uuid;
    const access = '["*"]'
    const description = `Generated profile avatar for ${name}`;
    const type = "image/png";
    const location = path.join("objects", "/");

    const objectInfo = await new_object(baseName, extension, owner, org, access, description, type, location);
    const oid = objectInfo.oid;
    const filePath = path.join(__dirname, "objects", oid);

    fs.writeFileSync(filePath, buffer);

    return objectInfo;
}

async function set_generated_profile_icon(name, uuid, org) {
    let object_data = await save_generated_image(name, uuid, org);
    let response = await db.query("UPDATE people SET profile_icon = ? WHERE uuid = ?", [object_data.oid, uuid]);
    return object_data;
}

module.exports = {
    generate_id,
    get_unique_id,
    list_roles,
    object_info,
    new_object,
    view_conditional,
    delete_conditional,
    timeToSeconds,
    isTimeInRange,
    room_id_info,
    room_id_name,
    set_generated_profile_icon,
    save_generated_image,
    generate_profile_icon,
};