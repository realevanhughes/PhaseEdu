const db = require('./db');
const baseLogger = require('./logger');
const orgs = require('./org');
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

async function delete_object(oid) {
    const response = await db.query("DELETE FROM objects WHERE oid = ?", [oid]);
    return response.affectedRows > 0 ? {"result": "success"} : {"result": "failed", "message": "no such object"};
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

function toUTC(isoString) {
    return new Date(isoString);
}

function formatUTC(date) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC'
    };

    return date.toLocaleString('en-US', options);
}

function getCurrentTimestamp() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0"); // 0-based
    const day = String(now.getDate()).padStart(2, "0");

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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

    const colors = ["#fbf8cc", "#fde4cf", "#ffcfd2", "#f1c0e8", "#cfbaf0", "#a3c4f3", "#90dbf4", "#8eecf5", "#98f5e1", "#b9fbc0"];
    const colorIndex = name.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const initial = name[0].toUpperCase();
    ctx.fillStyle = "#000000";
    ctx.font = `${canvasSize * 0.5}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initial, canvasSize / 2, canvasSize / 2);

    const buffer = canvas.toBuffer("image/png");

    return {buffer, extension: "png", baseName: `${initial}_avatar`, bgColor: bgColor};
}

async function save_generated_image(name, uuid, org) {
    const { buffer, extension, baseName, bgColor } = await generate_profile_icon(name);

    const owner = uuid;
    const access = '["*"]'
    const description = `Generated profile avatar for ${name}`;
    const type = "image/png";
    const location = path.join("objects", "/");

    const objectInfo = await new_object(baseName, extension, owner, org, access, description, type, location);
    const oid = objectInfo.oid;
    const filePath = path.join(__dirname, "objects", oid);

    fs.writeFileSync(filePath, buffer);

    return {"object": objectInfo, "color": bgColor};
}

async function set_generated_profile_icon(name, uuid, org) {
    let object_data = await save_generated_image(name, uuid, org);
    let response = await db.query("UPDATE people SET profile_icon = ?, color = ? WHERE uuid = ?", [object_data.object.oid, object_data.color, uuid]);
    return object_data;
}

async function reset_profile_image(uuid, org) {
    const people = require('./people');
    const old_pfp = await people.get_profile_oid(uuid);
    const old_pfp_data = await object_info(old_pfp);
    let user_fullname = await people.uuid_to_name(uuid);
    const result2 = await set_generated_profile_icon(user_fullname, uuid, org)

    if (old_pfp_data.owner === "0000000000"){
        return {"result": "success", "message": "had to generate profile icon", "object": result2};
    }
    fs.rmSync(path.join(__dirname, old_pfp_data.location, old_pfp));
    await delete_object(old_pfp);
    return {"result": "success", "message": "reset to default", "object": result2};
}

async function get_bulk_file_info(oids, uuid) {
    let [rows] = await db.query("SELECT * FROM objects WHERE oid IN (?)", [oids]);

    rows = rows.filter(row => {
        const access = JSON.parse(row.access);
        return access.includes(uuid) || access.includes("*");
    });

    return { result: "success", list: rows };
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
    delete_object,
    reset_profile_image,
    toUTC,
    formatUTC,
    get_bulk_file_info,
    getCurrentTimestamp
};