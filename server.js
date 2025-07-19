const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const db = require('./db');

const people = require('./people');
const points = require('./points');

const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));

// Login handler
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM people WHERE username = ? OR email = ?', [username, username], async (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.send('Invalid username or password');
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (match) {
            req.session.user = user.username;
            res.send('Login successful! Welcome, ' + user.username);
        } else {
            res.send('Invalid username or password');
        }
    });
});

// Optional: a route to check if logged in
app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        res.send(`Welcome to your dashboard, ${req.session.user}`);
    } else {
        res.redirect('/login.html');
    }
});

people.username_to_uuid("19charleston.t").then(uuid => {
    points.total(uuid).then(total => {
        console.log("total: "+total.toString());
    })
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
