// NPM package imports
var pjson = require('./package.json');
const express = require('express');
const multer = require("multer");
const path = require('path');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const prompt = require("prompt-sync")({ sigint: true });
const fs = require("fs");
const readline = require("readline-sync");


// Local component imports
const db = require('./db');
const baseLogger = require('./logger');
const people = require('./people');
const routing = require('./routing');

// Logger setup with component script
const logger = baseLogger.child({label: path.basename(__filename)});

// Dev console
function devOut (message) {
    if (process.env.NODE_ENV === 'dev') {
        console.log(message);
    }
}

// Session store config to point to MySQL DB
const sessionStore = new MySQLStore({}, db);

// Banner
let dev_names = ""
pjson.contributors.forEach(function (key) {dev_names = dev_names+key.name+", "})
dev_names = dev_names.substring(0, dev_names.length - 2);
if (process.env.BANNER !== "") {

    try {
        const data = fs.readFileSync(process.env.BANNER, 'utf8');
        console.log(data);
        console.log("You are running version "+pjson.version+" built by "+dev_names+".\n");
    } catch (err) {
        logger.error(`Banner failed: ${err.message || err}`);
        console.log("You are running version "+pjson.version+" built by "+dev_names+".\n");
    }
}
else {
    console.log("\n"+pjson.name + " version "+pjson.version+" built by "+dev_names+"\n");
    console.log(pjson.version);
}

const permitted_route_extensions = [
    "css",
    "js"
]
const warning_page_assignments = {
    0: "./web/html/warn.html",
    1: "./web/html/block.html",
}

// Generic express setup with env referencing
const app = express();
const PORT = process.env.HOST_PORT;
app.use(express.static('web/static'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer in-memory uploads
const upload = multer({ storage: multer.memoryStorage() });

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
function requireAuth(authRequired, type) {
    return async (req, res, next) => {
        if ((!req.session || !req.session.uuid) && (authRequired === true)) {
            if (type === "page"){
                return res.redirect('/login');
            }
        else {
                return res.status(401).json({error: 'Unauthorized'});
            }
        }
        next();
    }
}

function requireRole(type, ...allowedRoles) {
    return async (req, res, next) => {
            try {
                if (type === "warning" || type === "login" || type === "login-page") {
                    return next()
                }
                const user = await people.role(req.session.uuid)
                if (allowedRoles.length === 0) {
                    if (user.special_action === 1) {
                        return res.redirect('/warning');
                    }
                    else {
                        return next();
                    }
                }
                if (allowedRoles.includes(user.role)) {
                    if (user.special_action === 1) {
                        return res.redirect('/warning');
                    }
                    else {
                        return next();
                    }
                }

                else {
                    if (type === "page" || type === "internal") {
                        return res.redirect('/login');
                    }
                    return res.status(403).json({error: 'Forbidden due to role requirements'});
                }
            } catch (err) {
                console.log(err)
                return res.status(500).json({ error: 'Internal Server Error' });

            }
    }
}

devOut("The following routes are active: "+Object.keys(routing.routeMap).join(', '))

// Mapping special case routes (such as login and dev)
for (const [key, value] of Object.entries(routing.routeMap)) {
    let new_path = key.split("/")
    if (value.type === "page" || value.type === "login-page") {
        for (const extension of permitted_route_extensions) {
            if (fs.existsSync("web/"+extension+"/"+new_path[new_path.length-1]+"."+extension)) {
                routing.routeMap[key+"."+extension] = {type: value.type, method: value.method, handler: routing.page_handlers.file("web/"+extension+"/"+new_path[new_path.length-1]+"."+extension), roles: value.roles, authRequired: value.authRequired };
            }
        }

    }
}

app.use('/app/assets', express.static(path.join(__dirname, 'react-build/assets')));


for (const [path, config] of Object.entries(routing.routeMap)) {
    app[config.method](
        path,
        requireAuth(config.authRequired, config.type),
        requireRole(config.type, ...config.roles),
        ...(config.middleware || []),
        config.handler
    );
}

// Final webhost launch
app.listen(PORT, () => {
    logger.log({level: 'warn', message: `Server running on http://localhost:${PORT}`});
});