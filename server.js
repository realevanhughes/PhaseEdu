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
const points = require('./points');
const orgs = require('./org');
const composite = require('./composite');
const presence = require('./presence');
const events = require('./events');
const classes = require('./classes');
const {username_to_uuid, get_profile_oid} = require("./people");
const utils = require('./utils');
const assignments = require('./assignments');
const {route} = require("express/lib/application");
const util = require("node:util");
const {object_info} = require("./utils");

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

// START TESTING


// END TESTING

// routes mapped to functions
const api_handlers = {
    getPointDict: async (req, res) => {
        logger.http({message: `API call made to getPointDict (SID: ${req.sessionID})`});
        const point_dict = await composite.point_cats_basic(req.session.uuid);
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
    },
    getFile: async (req, res) => {
        const { oid } = req.params;
        logger.http({message: `API call made to getFile (SID: ${req.sessionID}) for the object ${oid}`});
        let object_info = await utils.object_info(oid);
        if (object_info.access.includes(req.session.uuid) || object_info.access.includes("*")) {
            res.download((object_info.location+oid), (object_info.name+"."+object_info.file_extension), (err) => {
                if (err) {
                    res.status(404).send("Object not found");
                }
            });
        }
        else {
            return res.status(401).json({error: 'Unauthorized'});
        }
    },
    getObject: async (req, res) => {
        const { oid } = req.params;
        logger.http({message: `API call made to getObject (SID: ${req.sessionID}) for the object ${oid}`});
        let object_info = await utils.object_info(oid);
        if (object_info === undefined) {
            res.status(404).send("Object not found");
        }
        if (JSON.parse(object_info.access).includes(req.session.uuid) || JSON.parse(object_info.access).includes("*")) {
            res.sendFile((object_info.location+oid), { root: path.join(__dirname) }, (err) => {
                if (err) {
                    res.status(404).send("Object not found");
                }
            });
        }
        else {
            return res.status(401).json({error: 'Unauthorized'});
        }
    },
    uploadObject: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            const originalName = req.file.originalname;
            const fileExtension = path.extname(originalName).substring(1);
            const baseName = path.basename(originalName, fileExtension);

            const owner = req.session.uuid;
            const org = req.session.org;
            const access_arr = [owner]
            const access = access_arr.toString();
            const description = `Uploaded file ${originalName}`;
            const type = req.file.mimetype;
            const location = path.join("objects", "/");

            const objectInfo = await utils.new_object(
                baseName,
                fileExtension,
                owner,
                org,
                access,
                description,
                type,
                location
            );
            const oid = objectInfo.oid;
            const filePath = path.join(__dirname, "objects", oid);
            fs.writeFileSync(filePath, req.file.buffer);

            logger.http({ message: `New object uploaded (OID: ${oid}, SID: ${req.sessionID})` });

            res.json(objectInfo);

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "File upload failed" });
        }
    },
    getProfileInfo: async (req, res) => {
        const { uuid } = req.params;
        logger.http({message: `API call made to getProfileInfo (SID: ${req.sessionID}) for the user ${uuid}`});
        let user_data = await people.general_user_data(uuid)
        user_data["result"] = "success";
        res.json(user_data);
    },
    getExtendedProfileInfo: async (req, res) => {
        const { uuid } = req.params;
        logger.http({message: `API call made to getExtendedProfileInfo (SID: ${req.sessionID}) for the user ${uuid}`});
        let user_data = await people.extended_user_data(uuid)
        user_data["result"] = "success";
        console.log(user_data);
        res.json(user_data);
    },
    whoami: async (req, res) => {
        logger.http({message: `API call made to whoami (SID: ${req.sessionID})`});
        res.json({"result": "success", "uuid": req.session.uuid})
    },
    getPointPolarity: async (req, res) => {
        logger.http({message: `API call made to getPointPolarity (SID: ${req.sessionID})`});
        const point_polarity = await points.total_by_polarity(req.session.uuid);
        res.json(point_polarity);
    },
    getClassList: async (req, res) => {
        logger.http({message: `API call made to getClassList (SID: ${req.sessionID})`});
        const classes_list = await classes.names_from_uuid(req.session.uuid);
        res.json(classes_list);
    },
    getUpcoming: async (req, res) => {
        logger.http({message: `API call made to getUpcoming (SID: ${req.sessionID})`});
        const upcoming = await events.external_upcoming(req.session.uuid)
        res.json(upcoming);
    },
    getClassInfo: async (req, res) => {
        const { class_id } = req.params;
        logger.http({message: `API call made to getClassInfo (SID: ${req.sessionID})`});
        if (await classes.is_in_class(req.session.uuid, class_id)) {
            const info = await classes.class_information(class_id);
            res.json({"result": "success", "contents": info});
        }
        else {
            res.json({"result": "failed", "message": "Not a memeber of class " + class_id + " or invalid class."});
        }
    },
    getDetailedClasses: async (req, res) => {
        logger.http({ message: `API call made to getDetailedClasses (SID: ${req.sessionID})` });
        let classes_list = await classes.details_from_uuid(req.session.uuid);
        for (let item of classes_list.list) {
            item.teacher_name = await people.uuid_to_name(item.teacher_uuid);
            item.teacher_color = await people.get_color(item.teacher_uuid);
            item.room_name = await utils.room_id_name(item.room_id);
        }
        res.json(classes_list);
    },
    resetProfileIcon: async (req, res) => {
        logger.http({message: `API call made to resetProfileIcon (SID: ${req.sessionID})`});
        const result = await utils.reset_profile_image(req.session.uuid, req.session.org);
        res.json(result);
    },
    forceResetProfileIcon: async (req, res) => {
        const { target } = req.params;
        logger.http({message: `Admin API call made to resetProfileIcon (SID: ${req.sessionID})`});
        const org_id = await people.uuid_org_id(target);
        const result = await utils.reset_profile_image(target, org_id);
        res.json(result);
    },
    getClassMembers: async (req, res) => {
        const { class_id } = req.params;
        logger.http({message: `API call made to getClassMembers (SID: ${req.sessionID})`});
        if (await classes.is_in_class(class_id)) {
            const members = await classes.members(class_id);
            res.json(members);
        }
        else {
            res.json({"result": "failed", "message": "Not a memeber of class " + class_id + " or invalid class."});
        }
    },
    getBulkRoles: async (req, res) => {
        const uuids = req.query.ids
        logger.http({message: `API call made to getBulkRoles (SID: ${req.sessionID})`});

    },
    getUpcomingCalendars: async (req, res) => {
        logger.http({message: `API call made to getUpcomingCalendars (SID: ${req.sessionID})`});
        let list = []
        const classes_li = await classes.from_uuid(req.session.uuid)
        classes_li.forEach((element) => {
            list.push(element.class_id)
        })
        const upcoming = await events.getCalendarEvents(list);
        res.json({"result": "success", "contents": upcoming});
    },
    bulkResetProfileIcon: async (req, res) => {
        const users = await people.list()
        for (let target of users){
            if (target.username !== null){
                const result = await utils.reset_profile_image(target.uuid, target.org);
            }
        }
        res.json({"result": "success"});
    },
    getAssignments: async (req, res) => {
        logger.http({message: `API call made to getAssignments (SID: ${req.sessionID})`});
        const assignment_li = await assignments.view(req.session.uuid)
        for (let item of assignment_li) {
            item.teacher_name = await people.uuid_to_name(item.assignee_uuid);
            item.teacher_color = await people.get_color(item.assignee_uuid);
            item.class_name = await classes.get_name(item.class_id);
            item.set_date = utils.formatUTC(utils.toUTC(item.set_date));
            item.due_date_time = utils.formatUTC(utils.toUTC(item.due_date_time));
        }
        res.json({"result": "success", "list": assignment_li});
    }
};

const page_handlers = {
    file: (file) => {
        return async (req, res) => {
            res.sendFile(path.join(__dirname, file));
        };
    },
    redirect: (url) => {
        return async (req, res) => {
            res.redirect(url);
        }
    },
    specialMessage: async (req, res) => {
        logger.http({message: `Dishing out warning (SID: ${req.sessionID})`});
        let special = await utils.view_conditional(req.session.uuid)
        if (!special) {
            res.redirect(`/dash`);
        }
        else {
            fs.readFile(warning_page_assignments[special.final], 'utf8', (err, data) => {
                if (err) {
                    res.status(404).send("Please contact your IT administrator immediately.");
                }
                else {
                let warning_html = data;
                warning_html = warning_html.replace("##MESSAGE##", special.message);
                warning_html = warning_html.replace("##REDIRECT##", special.redirect);
                res.send(warning_html);
                }
            });
        }

    },
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
                        res.redirect('/app');
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
            res.redirect('/app');
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
                        res.redirect('/app');
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
    dismissWarning: async (req, res) => {
        logger.http({message: `Dismissed warning (SID: ${req.sessionID})`});
        let special = await utils.view_conditional(req.session.uuid)
        if (!special) {
            res.redirect(`/app`);
        }
        if (special.final === 1){
            res.json({"result": "failed", "message": "This access restriction is final!"});
        }
        return await utils.delete_conditional(req.session.uuid)
    }
};

const routeMap = {
    '/api/points/dict': {type: "api", method: 'get', handler: api_handlers.getPointDict, roles: ['student', 'dev'], authRequired: true },
    '/api/points/polarity': {type: "api", method: 'get', handler: api_handlers.getPointPolarity, roles: ['student', 'dev'], authRequired: true },
    '/api/presence/count': {type: "api", method: 'get', handler: api_handlers.getCountPresence, roles: ['student', 'dev'], authRequired: true  },
    '/api/presence/dict': {type: "api", method: 'get', handler: api_handlers.getPresenceDict, roles: ['student', 'dev'], authRequired: true  },
    '/api/people/uuid-lookup': {type: "api", method: 'post', handler: api_handlers.getUsername, roles: ['student', 'dev', 'admin', 'teacher'], authRequired: true  },
    '/api/people/new': {type: "api", method: 'post', handler: api_handlers.newUser, roles: ['dev', 'admin'], authRequired: true  },
    '/api/periods': {type: "api", method: 'get', handler: api_handlers.getPeriods, roles: ['student', 'dev', 'admin', 'teacher'], authRequired: true  },
    '/api/orgs/list': {type: "api", method: 'get', handler: api_handlers.getOrgs, roles: ['dev'], authRequired: true  },
    '/api/roles/list': {type: "api", method: 'get', handler: api_handlers.getRoles, roles: ['dev', 'admin'], authRequired: true  },
    '/api/people/list': {type: "api", method: 'get', handler: api_handlers.getUsers, roles: ['dev', 'admin'], authRequired: true  },
    '/api/people/:uuid/about': {type: "api", method: 'get', handler: api_handlers.getProfileInfo, roles: [], authRequired: true  },
    '/api/people/:uuid/info': {type: "api", method: 'get', handler: api_handlers.getExtendedProfileInfo, roles: [], authRequired: true  },
    '/api/whoami': {type: "api", method: 'get', handler: api_handlers.whoami, roles: [], authRequired: true  },
    '/api/classes/list': {type: "api", method: 'get', handler: api_handlers.getClassList, roles: ['student', 'teacher', 'dev'], authRequired: true  },
    '/api/events/upcoming': {type: "api", method: 'get', handler: api_handlers.getUpcoming, roles: [], authRequired: true  },
    '/api/classes/:class_id/info': {type: "api", method: 'get', handler: api_handlers.getClassInfo, roles: [], authRequired: true  },
    '/api/classes/list/detailed': {type: "api", method: 'get', handler: api_handlers.getDetailedClasses, roles: [], authRequired: true  },
    '/api/reset-profile-image': {type: "api", method: 'get', handler: api_handlers.resetProfileIcon, roles: [], authRequired: true  },
    '/api/reset-profile-image/:target': {type: "api", method: 'get', handler: api_handlers.forceResetProfileIcon, roles: ['dev', 'admin'], authRequired: true  },
    '/api/dev/reset-profile-image/all': {type: "api", method: 'get', handler: api_handlers.bulkResetProfileIcon, roles: ['dev'], authRequired: true  },
    '/api/events/all': {type: "api", method: 'get', handler: api_handlers.getUpcomingCalendars, roles: [], authRequired: true  },
    '/api/assignments/list': {type: "api", method: 'get', handler: api_handlers.getAssignments, roles: [], authRequired: true  },

    '/api/object/download/:oid': {type: "api", method: 'get', handler: api_handlers.getFile, roles: [], authRequired: true  },
    '/api/object/:oid': {type: "api", method: 'get', handler: api_handlers.getObject, roles: [], authRequired: true  },
    '/api/object/upload': {type: "api", method: 'post', handler: api_handlers.uploadObject, roles: [], authRequired: true, middleware: [ upload.single("file") ] },

    '/api/login': {type: "login", method: 'post', handler: internal_handlers.login, roles: [], authRequired: false },
    '/api/quick-login': {type: "login", method: 'post', handler: internal_handlers.quick_login, roles: [], authRequired: false },
    '/api/logout': {type: "internal", method: 'get', handler: internal_handlers.logout, roles: ['student', 'dev', 'admin', 'teacher']},
    '/api/warning/dismiss': {type: "warning", method: 'post', handler: internal_handlers.dismissWarning, roles: [], authRequired: true },

    '/dev/account': {type: "page", method: 'get', handler: dev_handlers.account, roles: ['dev'], authRequired: true  },
    '/dev': {type: "page", method: 'get', handler: page_handlers.file("web/html/dev-panel.html"), roles: ['dev'], authRequired: true  },

    '/': {type: "page", method: 'get', handler: page_handlers.redirect("/app"), roles: [], authRequired: true },
    '/dash': {type: "page", method: 'get', handler: page_handlers.file("web/html/dash.html"), roles: [], authRequired: true },
    '/login': {type: "login-page", method: 'get', handler: page_handlers.file("web/html/login.html"), roles: [], authRequired: false },
    '/warning': {type: "warning", method: 'get', handler: page_handlers.specialMessage, roles: [], authRequired: true },

    '/internal/login': {type: "login", method: 'post', handler: internal_handlers.login, roles: [], authRequired: false },
    '/internal/quick-login': {type: "login", method: 'post', handler: internal_handlers.quick_login, roles: [], authRequired: false },
    '/internal/logout': {type: "internal", method: 'get', handler: internal_handlers.logout, roles: ['student', 'dev', 'admin', 'teacher']},
    '/internal/warning/dismiss': {type: "warning", method: 'post', handler: internal_handlers.dismissWarning, roles: [], authRequired: true },


    '/app': {type: "page", method: 'get', handler: page_handlers.file("/react-build/index.html"), roles: [], authRequired: true },
};

devOut("The following routes are active: "+Object.keys(routeMap).join(', '))


for (const [key, value] of Object.entries(routeMap)) {
    let new_path = key.split("/")
    if (value.type === "page" || value.type === "login-page") {
        for (const extension of permitted_route_extensions) {
            if (fs.existsSync("web/"+extension+"/"+new_path[new_path.length-1]+"."+extension)) {
                routeMap[key+"."+extension] = {type: value.type, method: value.method, handler: page_handlers.file("web/"+extension+"/"+new_path[new_path.length-1]+"."+extension), roles: value.roles, authRequired: value.authRequired };
            }
        }

    }
}

app.use('/app/assets', express.static(path.join(__dirname, 'react-build/assets')));


for (const [path, config] of Object.entries(routeMap)) {
    app[config.method](
        path,
        requireAuth(config.authRequired, config.type),
        requireRole(config.type, ...config.roles),
        ...(config.middleware || []),
        config.handler
    );
}

// React initialization




// Final webhost launch
app.listen(PORT, () => {
    logger.log({level: 'warn', message: `Server running on http://localhost:${PORT}`});
});