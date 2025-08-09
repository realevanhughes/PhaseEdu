// NPM package imports
var pjson = require('./package.json');
const express = require('express');
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const prompt = require("prompt-sync")({ sigint: true });
const fs = require("fs");

// Local component imports
const db = require('./db');
const baseLogger = require('./logger');
const people = require('./people');
const points = require('./points');
const org = require('./org');
const composite = require('./composite');
const {username_to_uuid} = require("./people");

// Logger setup with component script
const logger = baseLogger.child({label: path.basename(__filename)});

// Session store config to point to MySQL DB
const sessionStore = new MySQLStore({}, db);

// Banner
if (process.env.BANNER !== "") {
    try {
        const data = fs.readFileSync(process.env.BANNER, 'utf8');
        console.log(data);
        console.log("Version: "+pjson.version+" built by "+pjson.author+"\n");
    } catch (err) {
        logger.error(`Banner failed: ${err.message || err}`);
        console.log("\n"+pjson.name + " version "+pjson.version+" built by "+pjson.author+"\n");
    }
}
else {
    console.log("\n"+pjson.name + " version "+pjson.version+" built by "+pjson.author+"\n");
    console.log(pjson.version);
}

// Generic express setup with env referencing
const app = express();
const PORT = process.env.HOST_PORT;
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// More session config
app.use(session({
    key: process.env.SESSION_COOKIE_KEY,
    secret: process.env.APP_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

//Authentication and permissions check
function requireAuth(req, res, next) {
    if (!req.session || !req.session.uuid) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

function requireRole(...allowedRoles) {
    return async (req, res, next) => {
        try {
            for (const role of allowedRoles) {
                if ((await people.check_role(req.session.uuid, role)).result === "success") {
                    return next();
                }
            }
            return res.status(403).json({ error: 'Forbidden' });
        } catch (err) {
            console.error('Role check failed:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };
}

// Login handler
logger.log({ level: 'info', message: "Setting up express routes..." });

app.post('/login', (req, res) => {
    logger.log({level: 'http', message: `Login requested`});
    const { username, password } = req.body;
    let uuidPromise;
    let uuid;
    let org;
    if (username.includes("@")) {
        uuidPromise = people.email_to_uuid(username);
    } else {
        uuidPromise = people.username_to_uuid(username);
    }
    uuidPromise.then(ret_uuid => {
        uuid = ret_uuid;
        return people.check_uuid_password(ret_uuid, password);

    }).then(result => {
        if (result.result === "success") {

            req.session.user = username;
            req.session.uuid = uuid;

            people.uuid_org_id(uuid).then(org_id => {
                org = org_id;
                req.session.org = org;
                console.log(`sending username=${username} uuid=${uuid} org=${org}`);
                logger.log({level: 'http', message: `Login success (SID: ${req.sessionID}), sending username=${username} uuid=${uuid} org=${org}`});
                res.send('Login successful! Welcome, ' + username);
            });


        }
        else {
            logger.log({level: 'http', message: `Login failed!`});
            res.send('Invalid username or password');
        }
    }).catch(err => {
        logger.error(`Login failed: ${err.message || err}`);
        res.status(500).send('Internal server error');
    });
});

// Logout route
app.get('/logout', (req, res) => {
    logger.log({level: 'http', message: `Logout requested (SID: ${req.sessionID})`});
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.sendStatus(200);
    });
});

// Dash route
app.get('/dashboard', (req, res) => {
    if (req.session.user) {
        logger.log({level: 'http', message: `Dashboard requested (SID: ${req.sessionID})`});
        res.send(`Session data: username=${req.session.user} uuid=${req.session.uuid} org=${req.session.org}`);
    } else {
        logger.log({level: 'http', message: `Dashboard failed due to lack of credentials (SID: ${req.sessionID})`});
        res.redirect('/login.html');
    }
});

// Redirects to dashboard
app.get("/", (req, res) => {
    logger.log({level: 'http', message: `Root requested, forwarding to dash (SID: ${req.sessionID})`});
    res.redirect('/dashboard');
})

// Dev routes for testing - only authorized for dev roles
app.get(
    "/dev/account",
    requireAuth,
    requireRole("dev"),
    (req, res) => {
        res.send(
            `Session data: username=${req.session.user} uuid=${req.session.uuid} org=${req.session.org}`
        );
    }
);


// START TESTING

// END TESTING

// API routes mapped to functions
const handlers = {
    getPointDict: async (req, res) => {
        const point_dict = await composite.point_dict(req.session.uuid);
        res.json(point_dict);
    }
};

const routeMap = {
    '/API/pointdict': { method: 'get', handler: handlers.getPointDict, roles: ['user', 'admin', 'dev'] },
};

for (const [path, config] of Object.entries(routeMap)) {
    app[config.method](
        path,
        requireAuth,
        requireRole(...config.roles),
        config.handler
    );
}

// Final webhost launch
app.listen(PORT, () => {
    logger.log({level: 'warn', message: `Server running on http://localhost:${PORT}`});
});
