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
const readline = require("readline-sync");


// Local component imports
const db = require('./db');
const baseLogger = require('./logger');
const people = require('./people');
const points = require('./points');
const orgs = require('./org');
const composite = require('./composite');
const presence = require('./presence');
const classes = require('./classes');
const {username_to_uuid} = require("./people");
const utils = require('./utils');
const {route} = require("express/lib/application");
const util = require("node:util");

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

// Generic express setup with env referencing
const app = express();
const PORT = process.env.HOST_PORT;
app.use(express.static('web/static'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
            for (const role of allowedRoles) {
                if ((await people.check_role(req.session.uuid, role)).result === "success") {
                    return next();
                }
            }
            if (allowedRoles.length === 0) {
                return next();
            }
            else {
                if (type === "page" || type === "internal") {
                    return res.redirect('/login');
                }
                return res.status(403).json({error: 'Forbidden due to role requirements'});
            }
        } catch (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    };
}

// START TESTING

// END TESTING

// routes mapped to functions
const api_handlers = {
    getPointDict: async (req, res) => {
        logger.http({message: `API call made to getPointDict (SID: ${req.sessionID})`});
        const point_dict = await composite.point_dict(req.session.uuid);
        res.json(point_dict);
    },
    getCountPresence: async (req, res) => {
        logger.http({message: `API call made to getCountPresence (SID: ${req.sessionID})`});
        const presence_dict = await presence.count(req.session.uuid);
        res.json(presence_dict);
    },
    getPresenceDict: async (req, res) => {
        logger.http({message: `API call made to getPresenceDict (SID: ${req.sessionID})`});
        const presence_dict = await presence.presence_dict(req.session.uuid);
        res.json({ data: presence_dict });
    },
    getUsername: async (req, res) => {
        logger.http({message: `API call made to getPresenceDict (SID: ${req.sessionID})`});
        const username = people.uuid_to_username(req.body)
        res.json({'status': 'success', 'username': username});
    },
    getPeriods: async (req, res) => {
        logger.http({message: `API call made to getPeriods (SID: ${req.sessionID})`});
        const periods = await composite.periods_dict(req.session.uuid)
        res.json(periods);
    },
    newUser: async (req, res) => {
        let result;
            if ((await people.check_role(req.session.uuid, "dev")).result === "success") {
                let {username, password, email, org, firstname, lastname, role, date_joined, year_group} = req.body;
                logger.http({message: `Dev API call made to newUser (SID: ${req.sessionID})`});
                org = await orgs.name_to_id(org)
                result = await people.new_user(username, password, email, org, firstname, lastname, role, date_joined, year_group);
            }
            else {
                const {username, password, email, firstname, lastname, role, date_joined, year_group} = req.body;
                logger.http({message: `Admin API call made to newUser (SID: ${req.sessionID})`});
                result = await people.new_user(username, password, email, req.session.org, firstname, lastname, role, date_joined, year_group);
            }
        res.json(result);
    },
    getOrgs: async (req, res) => {
        logger.http({message: `API call made to getOrgs (SID: ${req.sessionID})`});
        const all_orgs = await orgs.list_orgs()
        res.json({"result": "success", "orgs": all_orgs});
    },
    getRoles: async (req, res) => {
        logger.http({message: `API call made to getRoles (SID: ${req.sessionID})`});
        const all_roles = await utils.list_roles()
        res.json({"result": "success", "roles": all_roles});
    },
    getUsers: async (req, res) => {
        let result;
        if ((await people.check_role(req.session.uuid, "dev")).result === "success") {
            logger.http({message: `Dev API call made to getUsers (SID: ${req.sessionID})`});
            const users = await people.list();
            res.json({"result": "success", "users": users});
        }
        else {
            logger.http({message: `Admin API call made to getUsers (SID: ${req.sessionID})`});
            const users = await people.list_org(req.session.org);
            res.json({"result": "success", "users": users});
        }
    }
};

const page_handlers = {
    html: (file) => {
        return async (req, res) => {
            res.sendFile(path.join(__dirname, file));
        };
    },
    redirect: (url) => {
        return async (req, res) => {
            res.redirect(url);
        }
    }
};

const dev_handlers = {
    account: async (req, res) => {
        res.send(`Session data: username=${req.session.user} uuid=${req.session.uuid} org=${req.session.org}`);
    }
};

const internal_handlers = {
    login: async (req, res) => {
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
                people.year_group(uuid).then(year_group => {
                    req.session.year_group = year_group;
                    people.uuid_org_id(uuid).then(org_id => {
                        org = org_id;
                        req.session.org = org;
                        logger.log({level: 'http', message: `Login success (SID: ${req.sessionID}), sending username=${username} uuid=${uuid} org=${org}`});
                        res.redirect('/dash');
                    });
                })
            }
            else {
                logger.log({level: 'http', message: `Login failed!`});
                res.send('Invalid username or password');
            }
        }).catch(err => {
            logger.error(`Login failed: ${err.message || err}`);
            res.status(500).send('Internal server error');
        });
    },
    logout: async (req, res) => {
        logger.log({level: 'http', message: `Logout requested (SID: ${req.sessionID})`});
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            res.redirect('/dash');
        });
    },
    quick_login: async (req, res) => {
        let ans = String(readline.question("Quick login for dev requested. Would you like to accept (y/N): "))
        if ((ans === "y" || ans === "yes" || ans === "Yes" || ans === "Y") && (process.env.NODE_ENV === "dev")) {
            let username = String(readline.question("Username for login (leave blank for default): "))
            if (username === ""){
                username = process.env.ADMIN_EMAIL;
            }
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
                req.session.user = username;
                req.session.uuid = uuid;
                people.year_group(uuid).then(year_group => {
                    req.session.year_group = year_group;
                    people.uuid_org_id(uuid).then(org_id => {
                        org = org_id;
                        req.session.org = org;
                        logger.log({level: 'http', message: `Quick login granted (SID: ${req.sessionID}), sending username=${username} uuid=${uuid} org=${org}`});
                        res.redirect('/dash');
                    });
                })
            }).catch(err => {
                logger.error(`Login failed: ${err.message || err}`);
                res.status(500).send('Internal server error');
            });
        }
        else {
            res.status(500).send(`Your request was not granted by server operator! Please contact ${process.env.ADMIN_EMAIL} for more information.`);
        }
    },
};

const routeMap = {
    '/api/points/dict': {type: "api", method: 'get', handler: api_handlers.getPointDict, roles: ['student', 'dev'], authRequired: true },
    '/api/presence/count': {type: "api", method: 'get', handler: api_handlers.getCountPresence, roles: ['student', 'dev'], authRequired: true  },
    '/api/presence/dict': {type: "api", method: 'get', handler: api_handlers.getPresenceDict, roles: ['student', 'dev'], authRequired: true  },
    '/api/people/uuid-lookup': {type: "api", method: 'post', handler: api_handlers.getUsername, roles: ['student', 'dev', 'admin', 'teacher'], authRequired: true  },
    '/api/people/new': {type: "api", method: 'post', handler: api_handlers.newUser, roles: ['dev', 'admin'], authRequired: true  },
    '/api/periods': {type: "api", method: 'get', handler: api_handlers.getPeriods, roles: ['student', 'dev', 'admin', 'teacher'], authRequired: true  },
    '/api/orgs/list': {type: "api", method: 'get', handler: api_handlers.getOrgs, roles: ['dev'], authRequired: true  },
    '/api/roles/list': {type: "api", method: 'get', handler: api_handlers.getRoles, roles: ['dev', 'admin'], authRequired: true  },
    '/api/people/list': {type: "api", method: 'get', handler: api_handlers.getUsers, roles: ['dev', 'admin'], authRequired: true  },

    '/dev/account': {type: "page", method: 'get', handler: dev_handlers.account, roles: ['dev'], authRequired: true  },
    '/dev': {type: "page", method: 'get', handler: page_handlers.html("web/html/dev-panel.html"), roles: ['dev'], authRequired: true  },

    '/': {type: "page", method: 'get', handler: page_handlers.redirect("/dash"), roles: [], authRequired: false },
    '/dash': {type: "page", method: 'get', handler: page_handlers.html("web/html/dash.html"), roles: [], authRequired: true },
    '/login': {type: "page", method: 'get', handler: page_handlers.html("web/html/login.html"), roles: [], authRequired: false },

    '/internal/login': {type: "internal", method: 'post', handler: internal_handlers.login, roles: [], authRequired: false },
    '/internal/quick-login': {type: "internal", method: 'post', handler: internal_handlers.quick_login, roles: [], authRequired: false },
    '/internal/logout': {type: "internal", method: 'get', handler: internal_handlers.logout, roles: ['student', 'dev', 'admin', 'teacher']},
};

devOut("The following routes are active: "+Object.keys(routeMap).join(', '))

for (const [path, config] of Object.entries(routeMap)) {
    app[config.method](
        path,
        requireAuth(config.authRequired, config.type),
        requireRole(config.type, ...config.roles),
        config.handler
    );
}

// Final webhost launch
app.listen(PORT, () => {
    logger.log({level: 'warn', message: `Server running on http://localhost:${PORT}`});
});
