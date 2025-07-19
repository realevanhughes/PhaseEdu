const db = require('./db');
const people = require('./people');

async function total(uuid) {
    let total = 0;
    const [rows] = await db.query("SELECT value FROM points WHERE uuid = ?", [uuid]);
    for (let row of rows) {
        total = total + row.value
    }
    return rows.length > 0 ? total : null;
}

module.exports = {
    total
};