const baseLogger = require('./logger');
const people = require('./people');
const points = require('./points');
const orgs = require('./org');
const composite = require('./composite');
const presence = require('./presence');
const events = require('./events');
const classes = require('./classes');
const utils = require('./utils');
const assignments = require('./assignments');
const path = require("path");
const fs = require("fs");
const readline = require("readline-sync");
const multer = require("multer");
const mime = require("mime-types");
const { promisify } = require("util");
const libre = require("libreoffice-convert");

const upload = multer({ storage: multer.memoryStorage() });
const logger = baseLogger.child({label: path.basename(__filename)});
const libreConvert = promisify(libre.convert);

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
            const mimeType = mime.lookup(object_info.file_extension) || "application/octet-stream";

            res.setHeader("Content-Type", mimeType);
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${(object_info.name+"."+object_info.file_extension)}"`
            );
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
        logger.http({ message: `API call made to getObject (SID: ${req.sessionID}) for the object ${oid}` });

        try {
            const object_info = await utils.object_info(oid);
            if (!object_info) return res.status(404).send("Object not found");

            const accessList = JSON.parse(object_info.access);
            if (!accessList.includes(req.session.uuid) && !accessList.includes("*")) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const filePath = path.join(object_info.location, oid);
            const ext = object_info.file_extension.toLowerCase();

            // Supported office formats for conversion
            const convertible = ["docx", "doc", "pptx", "ppt", "xlsx", "xls"];
            if (convertible.includes(ext)) {
                try {
                    const fileBuffer = fs.readFileSync(filePath);
                    const pdfBuf = await libreConvert(fileBuffer, ".pdf", undefined);

                    res.setHeader("Content-Type", "application/pdf");
                    res.setHeader(
                        "Content-Disposition",
                        `inline; filename="${object_info.name}.pdf"`
                    );
                    return res.send(pdfBuf);
                } catch (err) {
                    logger.error(`Error converting ${ext} to PDF: ${err}`);
                    return res.status(500).send("Error converting document to PDF");
                }
            }
            else {
                const mimeType = mime.lookup(ext) || "application/octet-stream";
                res.setHeader("Content-Type", mimeType);
                res.setHeader(
                    "Content-Disposition",
                    `inline; filename="${object_info.name}.${ext}"`
                );
                return res.sendFile(filePath, (err) => {
                    if (err) {
                        logger.error(`Error sending file: ${err}`);
                        res.status(404).send("Object not found");
                    }
                });
            }
        } catch (error) {
            logger.error(`Error in getObject: ${error}`);
            res.status(500).send("Internal Server Error");
        }
    },
    uploadObject: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }

            if (!req.access) {
                let access = '["'+req.session.uuid+'"]'
            }
            else{
                let access = req.access.toString();
            }

            const originalName = req.file.originalname;
            const { name: baseName, ext } = path.parse(req.file.originalname);
            const fileExtension = ext.substring(1);

            const owner = req.session.uuid;
            const org = req.session.org;
            const access_arr = '["'+owner+'"]';
            const access = access_arr.toString();
            const description = `Uploaded file ${originalName}`;
            const type = req.file.mimetype;
            const location = process.env.OBJECT_STORE;

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
        let { uuid } = req.params;
        if (uuid === "me") {
            uuid = req.session.uuid;
        }
        logger.http({message: `API call made to getProfileInfo (SID: ${req.sessionID}) for the user ${uuid}`});
        let user_data = await people.general_user_data(uuid)
        user_data["result"] = "success";
        res.json(user_data);
    },
    getExtendedProfileInfo: async (req, res) => {
        let { uuid } = req.params;
        if (uuid === "me") {
            uuid = req.session.uuid;
        }
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
        let { target } = req.params;
        if (target === "me") {
            target = req.session.uuid;
        }
        logger.http({message: `Admin API call made to resetProfileIcon (SID: ${req.sessionID})`});
        const org_id = await people.uuid_org_id(target);
        const result = await utils.reset_profile_image(target, org_id);
        res.json(result);
    },
    getClassMembers: async (req, res) => {
        const { class_id } = req.params;
        logger.http({message: `API call made to getClassMembers (SID: ${req.sessionID})`});
        if (await classes.is_in_class(req.session.uuid, class_id)) {
            let li = []
            const members = await classes.members(class_id);
            console.log(members);
            for (let item of members.members) {
                let user_data = await people.reduced_user_data(item)
                user_data.uuid = item;
                li.push(user_data);
            }
            res.json({"result": "success", "members": li});
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
        let upcoming = await events.getCalendarEvents(list);
        console.log("before", upcoming);
        for (let item of upcoming) {
            item.resource.class_name = await classes.get_name(item.resource.class);
            item.resource.creator_name = await people.uuid_to_name(item.resource.creator_uuid)
            item.resource.location_name = await utils.room_id_name(item.resource.location);
            item.resource.creator_color = await people.get_color(item.resource.creator_uuid)
        }
        console.log("after", upcoming);
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
            item.status = await assignments.hw_status(item.hw_id, req.session.uuid, item.due_date_time)
        }
        res.json({"result": "success", "list": assignment_li});
    },
    getAssignment : async (req, res) => {
        const { hw_id } = req.params;
        const check = assignments.is_locked_hw(hw_id, );
        logger.http({message: `API call made to getAssignment (SID: ${req.sessionID})`});
        const assignment = await assignments.get_hw(hw_id, req.session.uuid)
        assignment.teacher_name = await people.uuid_to_name(assignment.assignee_uuid);
        assignment.teacher_color = await people.get_color(assignment.assignee_uuid);
        assignment.class_name = await classes.get_name(assignment.class_id);
        assignment.set_date = utils.formatUTC(utils.toUTC(assignment.set_date));
        assignment.due_date_time = utils.formatUTC(utils.toUTC(assignment.due_date_time));
        assignment.status = await assignments.hw_status(assignment.hw_id, req.session.uuid, assignment.due_date_time)
        if (await check) {
            res.json({"result": "failed", "message": "You are unable to modify a submitted assignment"});
        }
        else {
            res.json({"result": "success", "assignment": assignment});
        }
    },
    getBulkFileInfo: async (req, res) => {
        const oids = JSON.parse(req.query.oids);
        if (oids.length === 0) {
            res.json({"result": "failed", "message": "no objects"});
        }
        else {
            logger.http({message: `API call made to getBulkFileInfo (SID: ${req.sessionID})`});
            const files = await utils.get_bulk_file_info(oids, req.session.uuid);
            res.json(files);
        }
    },
    getSubmission: async (req, res) => {
        const { sub_id } = req.params;
        console.log("sub", sub_id);
        const check = assignments.is_locked_sub(sub_id);
        logger.http({message: `API call made to getSubmission (SID: ${req.sessionID})`});
        const result = await assignments.get_submission(sub_id)
        if (await check) {
            res.json({"result": "failed", "message": "You are unable to modify a submitted assignment"});
        }
        else {
            res.json({"result": "success", "contents": result});
        }
    },
    getSubmissions: async (req, res) => {
        const { hw_id } = req.params;
        const check = assignments.is_locked_hw(hw_id, req.session.uuid);
        logger.http({message: `API call made to getSubmissions (SID: ${req.sessionID})`});
        const result = await assignments.get_submissions(hw_id, req.session.uuid)
        if (await check) {
            res.json({"result": "failed", "message": "You are unable to modify a submitted assignment"});
        }
        else {
            res.json({"result": "success", "contents": result});
        }
    },
    newSubmission: async (req, res) => {
        let {homework_id, linked_files} = req.body;
        const oids = linked_files.map(f => f.oid);
        const linked_files_str = JSON.stringify(oids);
        const check = assignments.is_locked_hw(homework_id, req.session.uuid);
        logger.http({message: `API call made to newSubmission (SID: ${req.sessionID})`});
        const result = await assignments.new_submission(homework_id, req.session.uuid, utils.getCurrentTimestamp(), linked_files_str)
        if (await check) {
            res.json({"result": "failed", "message": "You are unable to modify a submitted assignment"});
        }
        else {
            res.json(result);
        }
    },
    updateSubmission: async (req, res) => {
        let {linked_files} = req.body;
        const oids = linked_files.map(f => f.oid);
        const linked_files_str = JSON.stringify(oids);
        const { sub_id } = req.params;
        const check = assignments.is_locked_sub(sub_id)
        logger.http({message: `API call made to updateSubmission (SID: ${req.sessionID})`});
        console.log("linked_files", linked_files);
        const result = await assignments.update_submission(sub_id, utils.getCurrentTimestamp(), linked_files_str)
        if (await check) {
            res.json({"result": "failed", "message": "You are unable to modify a submitted assignment"});
        }
        else {
            res.json(result);
        }
    },
    finalizeSubmission: async (req, res) => {
        const { hw } = req.params;
        const check = await assignments.is_locked_hw(hw, req.session.uuid)
        if (check) {
            console.log("islocked")
            res.json({"result": "failed", "message": "You are unable to modify a submitted assignment"});
        }
        else {
            logger.http({message: `API call made to finalizeSubmission (SID: ${req.sessionID})`});
            let sub = await assignments.get_submissions(hw, req.session.uuid)
            if (hw.length < 10) {
                res.json({"result": "failed", "message": "No such submission to finalize"});
            }
            else {
                const result = await assignments.finalize_submission(sub.submission_id)
                res.json(result);
            }

        }
    },
    getPoints: async (req, res) => {
        logger.http({message: `API call made to getPoints (SID: ${req.sessionID})`});
        const all = await points.view(req.session.uuid)
        for (let item of all) {
            item.class_name = await classes.get_name(item.class_id)
            item.assignee_name = await people.uuid_to_name(item.assignee_id)
            item.category_name = (await points.cat_id_info(item.category)).name
            item.good_date_time = utils.formatUTC(utils.toUTC(item.date_time));
            item.teacher_name = await people.uuid_to_name(item.assignee_id);
            item.teacher_color = await people.get_color(item.assignee_id);
        }
        res.json({"result": "success", "pts": all});
    },
    rmSubmission: async (req, res) => {
        const { hw } = req.params;
        console.log("hw", hw)
        const check = await assignments.is_locked_hw(hw, req.session.uuid)
        if (check) {
            res.json({"result": "failed", "message": "You are unable to modify a submitted assignment"});
        }
        else {
            logger.http({message: `API call made to finalizeSubmission (SID: ${req.sessionID})`});
            let sub = (await assignments.get_submission(hw, req.session.uuid))
            console.log("sub", sub)
            if (hw.length < 10) {
                res.json({"result": "failed", "message": "No such submission to remove"});
            }
            else {
                console.log("linked_files",sub.linked_files )
                const oids = JSON.parse(sub.linked_files);
                console.log("oids", oids);
                for (let object of oids) {
                    console.log("object", object);
                    let data = await utils.object_info(object)
                    console.log("data", data)
                    fs.rmSync(path.join(__dirname, data.location, object));
                    await utils.delete_object(object);
                }
                const result = await assignments.rm_submission(sub.submission_id)
                res.json(result);
            }
        }
    },
    getObjectInfo: async (req, res) => {
        const { oid } = req.params;
        logger.http({message: `API call made to getObjectInfo (SID: ${req.sessionID})`});
        if (oid === undefined) {
            res.status(404).send("Object not found");
        }
        let object_info = await utils.object_info(oid);
        if (JSON.parse(object_info.access).includes(req.session.uuid) || JSON.parse(object_info.access).includes("*")) {
            let file = await utils.object_info(oid);
            console.log("file", file);
            file.owner_name = await people.uuid_to_name(file.owner);
            file.owner_color = await people.get_color(file.owner);
            console.log("file", file);
            res.json({"result": "success", "info": file});
        }
        else {
            return res.status(401).json({error: 'Unauthorized'});
        }
    },
    newHomework: async (req, res) => {
        let {class_id, due_date_time, marked, in_person, points, name, md, linked_files} = req.body;
        logger.http({message: `API call made to newHomework (SID: ${req.sessionID})`});
        if (!class_id || !due_date_time || !name || !md) {
            res.json({"result": "failed", "message": "Incomplete data"});
        }
        else {
            const oids = linked_files.map(f => f.oid);
            const linked_files_str = JSON.stringify(oids);
            const check = await classes.is_in_class(req.session.uuid, class_id);
            const result = await assignments.new_homework(req.session.uuid, class_id, utils.getCurrentDate(), due_date_time, marked, in_person, points, name, md, linked_files_str)
            if (await check) {
                res.json({"result": "failed", "message": "You are unable to create assignment for the given class"});
            }
            else {
                res.json(result);
            }
        }
    },
    getRole: async (req, res) => {
        let { uuid } = req.params;
        if (uuid === "me") {
            uuid = req.session.uuid;
        }
        logger.http({message: `API call made to getRole (SID: ${req.sessionID}) for the user ${uuid}`});
        let user_data = await people.get_role(uuid)
        user_data["result"] = "success";
        res.json(user_data);
    },
    getMyRole: async (req, res) => {
        logger.http({message: `API call made to getMyRole (SID: ${req.sessionID}) for the user ${req.session.uuid}`});
        let user_data = await people.get_role(req.session.uuid)
        user_data["result"] = "success";
        res.json(user_data);
    },
    rmHomework: async (req, res) => {
        logger.http({message: `API call made to rmHomework (SID: ${req.sessionID})`});
        const { hw } = req.params;
        const hw_info = await assignments.get_hw(hw)
        if (!hw_info) {
            res.json({"result": "failed", "message": "homework not found"});
        }
        else {
            try {
                if (hw_info.assignee_uuid === req.session.uuid) {
                    const oids = JSON.parse(hw_info.linked_files);
                    oids.push(hw_info.md);
                    const all_submissions = await assignments.get_all_submissions(hw);
                    console.log("all sub", all_submissions);
                    if (all_submissions) {
                        for (let item of all_submissions) {
                            console.log("sub", item)
                            let student_oids = JSON.parse(item.linked_files);
                            for (let object of student_oids) {
                                let student_oid_data = await utils.object_info(object)
                                fs.rmSync(path.join(__dirname, student_oid_data.location, object));
                                await utils.delete_object(object);
                            }
                            await assignments.rm_submission(item.submission_id)
                        }
                    }
                    let result = await assignments.rm_homework(hw)
                    for (let object of oids) {
                        let oid_data = await utils.object_info(object)
                        fs.rmSync(path.join(__dirname, oid_data.location, object));
                        await utils.delete_object(object);
                    }
                    res.json(result);
                }
                else {
                    res.json({"result": "failed", "message": "not allowed to edit this assignment"});
                }
            }
            catch (err) {
                res.json({"result": "failed", "message": "unknown reasons for fail"});
            }

        }
    },
    editObject: async (req, res) => {
        try {
            const {oid} = req.body;
            if (!req.file) {
                return res.status(400).json({ error: "No file uploaded" });
            }
            let object_info = await utils.object_info(oid);
            if (object_info.access.includes(req.session.uuid) || object_info.access.includes("*")) {
                const filePath = path.join(__dirname, "objects", oid);
                fs.writeFileSync(filePath, req.file.buffer);

                logger.http({ message: `Object modified (OID: ${oid}, SID: ${req.sessionID})` });

                res.json({"result": "success"});
            }
            else {
                return res.status(401).json({error: 'Unauthorized'});
            }

        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "File upload failed" });
        }
    },
    changeAccess: async (req, res) => {
        const { oid } = req.params;
        const { access_level } = req.body;
        logger.http({message: `API call made to changeAccess (SID: ${req.sessionID}) for the object ${oid}`});
        let object_info = await utils.object_info(oid);
        if (!object_info){
            res.status(500).json({ error: "No such object" });
        }
        else {
            if (object_info.access.includes(req.session.uuid) || object_info.access.includes("*")) {
                let result = await utils.change_access(oid, access_level.toString());
                res.json(result);
            }
        }
    },
    changeUserDetails: async (req, res) => {
        logger.http({message: `API call made to changeUserDetails (SID: ${req.sessionID}) for the user ${req.session.uuid}`});
        const { update } = req.body;
        if (!update) {
            res.status(400).json({ error: "No such person" });
        }
        if (update === {}) {
            res.status(400).json({ error: "No updates to apply" });
        }
        const result = await people.update_user_details(req.session.uuid, update);
        res.json(result);
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
    favicon: async (req, res) => {
        try {
            const { ico } = req.params;
            res.sendFile(path.join(__dirname, "react/src/assets/favicon_io", ico));
        }
        catch (err) {
            logger.error(err);
            res.status(500).json({ error: "Failed to load favicon" });
        }

    }
};

const dev_handlers = {
    account: async (req, res) => {
        res.send(`Session data: username=${req.session.user} uuid=${req.session.uuid} org=${req.session.org}`);
    },
    getEnvType: async (req, res) => {
        res.json({"result": "success", "type": process.env.NODE_ENV});
    },
    getEnvDetails: async (req, res) => {
        if (process.env.NODE_ENV === "dev") {
            res.json({"result": "success", "type": process.env.NODE_ENV, "port": process.env.HOSTPORT, "hostname": process.env.HOSTPORT, "db_port": process.env.DB_PORT, "db_host": process.env.DB_HOST});
        }
        else {
            res.json({"result": "failed", "message": "This is not a development server so server details are hidden."});
        }
    },
    newAuthToken: async (req, res) => {
        const now = new Date();
        const oneYearFromNow = new Date(now);
        oneYearFromNow.setFullYear(now.getFullYear() + 1);
        const response = await utils.new_token("auth", 0, oneYearFromNow, "Generated auth token by "+req.session.uuid, req.session.uuid);
        res.json(response);
    }
};

const internal_handlers = {
    login: async (req, res) => {
        logger.log({level: 'http', message: `Login requested`});
        console.log(req.body)
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
                res.status(401).json({
                    success: false,
                    error: "invalid_credentials",
                    message: "Invalid username or password",
                });
            }
        }).catch(err => {
            logger.error(`Login failed: ${err.message || err}`);
            res.status(500).json({
                success: false,
                error: "server_error",
                message: "An unexpected error occurred. Please try again later.",
            });

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
    },
    authViaToken: async (req, res) => {
        logger.log({level: 'http', message: `Login requested via token`});
        const token = req.query.token;
        if (!token || token.length !== 25) {
            logger.log({level: 'http', message: `Login failed!`});
            res.status(401).json({
                success: false,
                error: "invalid_credentials",
                message: "Invalid token!",
            });
        }
        else {
            const details = await utils.view_token(token)
            if (details === null) {
                res.status(401).json({
                    success: false,
                    error: "invalid_credentials",
                    message: "Token is not recognised!",
                });
            }
            if (details.single_use) {
                if (await utils.delete_token(token).result !== "success") {
                    res.status(500).send('Internal server error');
                }
            }
            if (details.token_type === "auth") {
                const uuid = details.uuid;
                req.session.user = await people.uuid_to_username(uuid);
                req.session.uuid = uuid;
                    people.year_group(uuid).then(year_group => {
                        req.session.year_group = year_group;
                        people.uuid_org_id(uuid).then(org_id => {
                            const org = org_id;
                            req.session.org = org;
                            logger.log({level: 'http', message: `Token login granted (SID: ${req.sessionID}), sending uuid=${uuid} org=${org}`});
                            res.redirect('/app');
                        });
                    })
            }
            else {
                res.status(401).json({
                    success: false,
                    error: "invalid_credentials",
                    message: "Incorrect token type! Cannot be used for auth.",
                });
            }
        }
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
    '/api/people/:uuid/role': {type: "api", method: 'get', handler: api_handlers.getRole, roles: [], authRequired: true  },
    '/api/myrole': {type: "api", method: 'get', handler: api_handlers.getMyRole, roles: [], authRequired: true  },
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
    '/api/assignments/item/:hw_id': {type: "api", method: 'get', handler: api_handlers.getAssignment, roles: [], authRequired: true  },
    '/api/assignments/submissions/:hw_id': {type: "api", method: 'get', handler: api_handlers.getSubmissions, roles: ['dev', 'student'], authRequired: true  },
    '/api/assignments/submissions/item/:sub_id': {type: "api", method: 'get', handler: api_handlers.getSubmission, roles: ['dev', 'student'], authRequired: true  },
    '/api/assignments/submissions/new': {type: "api", method: 'post', handler: api_handlers.newSubmission, roles: ['dev', 'student'], authRequired: true  },
    '/api/assignments/submissions/item/:sub_id/update': {type: "api", method: 'post', handler: api_handlers.updateSubmission, roles: ['dev', 'student'], authRequired: true  },
    '/api/assignments/submissions/item/:hw/finalize': {type: "api", method: 'get', handler: api_handlers.finalizeSubmission, roles: ['dev', 'student'], authRequired: true  },
    '/api/points/list': {type: "api", method: 'get', handler: api_handlers.getPoints, roles: [], authRequired: true  },
    '/api/classes/:class_id/members': {type: "api", method: 'get', handler: api_handlers.getClassMembers, roles: [], authRequired: true  },
    '/api/assignments/submissions/item/:hw/delete': {type: "api", method: 'get', handler: api_handlers.rmSubmission, roles: ['dev', 'student'], authRequired: true  },
    '/api/assignments/new': {type: "api", method: 'post', handler: api_handlers.newHomework, roles: ['teacher', 'dev', 'admin'], authRequired: true  },
    '/api/assignments/:hw/delete': {type: "api", method: 'get', handler: api_handlers.rmHomework, roles: ['teacher', 'dev', 'admin'], authRequired: true  },
    '/api/people/update': {type: "api", method: 'post', handler: api_handlers.changeUserDetails, roles: [], authRequired: true  },

    '/api/object/item/:oid/info': {type: "api", method: 'get', handler: api_handlers.getObjectInfo, roles: [], authRequired: true  },
    '/api/object/item/:oid/access': {type: "api", method: 'post', handler: api_handlers.changeAccess, roles: [], authRequired: true  },
    '/api/object/bulk/info/': {type: "api", method: 'get', handler: api_handlers.getBulkFileInfo, roles: [], authRequired: true  },
    '/api/object/download/:oid': {type: "api", method: 'get', handler: api_handlers.getFile, roles: [], authRequired: true  },
    '/api/object/:oid': {type: "api", method: 'get', handler: api_handlers.getObject, roles: [], authRequired: true  },
    '/api/object/upload': {type: "api", method: 'post', handler: api_handlers.uploadObject, roles: [], authRequired: true, middleware: [ upload.single("file") ] },
    '/api/object/modify': {type: "api", method: 'post', handler: api_handlers.editObject, roles: [], authRequired: true, middleware: [ upload.single("file") ] },

    '/api/login': {type: "login", method: 'post', handler: internal_handlers.login, roles: [], authRequired: false },
    '/api/quick-login': {type: "login", method: 'post', handler: internal_handlers.quick_login, roles: [], authRequired: false },
    '/api/logout': {type: "internal", method: 'get', handler: internal_handlers.logout, roles: ['student', 'dev', 'admin', 'teacher']},
    '/api/warning/dismiss': {type: "warning", method: 'post', handler: internal_handlers.dismissWarning, roles: [], authRequired: true },
    '/api/token/login': {type: "login", method: 'post', handler: internal_handlers.authViaToken, roles: [], authRequired: false },

    '/dev/account': {type: "page", method: 'get', handler: dev_handlers.account, roles: ['dev'], authRequired: true  },
    '/dev': {type: "page", method: 'get', handler: page_handlers.file("web/html/dev-panel.html"), roles: ['dev'], authRequired: true  },
    '/api/server/env': {type: "login", method: 'get', handler: dev_handlers.getEnvType, roles: [], authRequired: false  },
    '/api/server/details': {type: "api", method: 'get', handler: dev_handlers.getEnvDetails, roles: ['dev'], authRequired: true  },
    '/dev/token/new/auth': {type: "api", method: 'get', handler: dev_handlers.newAuthToken, roles: ['dev'], authRequired: true  },


    '/': {type: "page", method: 'get', handler: page_handlers.redirect("/app"), roles: [], authRequired: true },
    '/dash': {type: "page", method: 'get', handler: page_handlers.file("web/html/dash.html"), roles: [], authRequired: true },
    '/login': {type: "login-page", method: 'get', handler: page_handlers.file("web/html/login.html"), roles: [], authRequired: false },
    '/warning': {type: "warning", method: 'get', handler: page_handlers.specialMessage, roles: [], authRequired: true },
    '/login-via-token': {type: "login-page", method: 'get', handler: internal_handlers.authViaToken, roles: [], authRequired: false },
    '/ico/:ico': {type: "login-page", method: 'get', handler: page_handlers.favicon, roles: [], authRequired: false },

    '/internal/login': {type: "login", method: 'post', handler: internal_handlers.login, roles: [], authRequired: false },
    '/internal/quick-login': {type: "login", method: 'post', handler: internal_handlers.quick_login, roles: [], authRequired: false },
    '/internal/logout': {type: "internal", method: 'get', handler: internal_handlers.logout, roles: ['student', 'dev', 'admin', 'teacher']},
    '/internal/warning/dismiss': {type: "warning", method: 'post', handler: internal_handlers.dismissWarning, roles: [], authRequired: true },


    '/app': {type: "page", method: 'get', handler: page_handlers.file("/react-build/index.html"), roles: [], authRequired: true },
};

module.exports = {
    routeMap,
    api_handlers,
    page_handlers,
    dev_handlers,
    internal_handlers
}