import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UserTooltip from "../Components/UserTooltip.jsx";
import AssignmentDueIndicator from "../Components/AssignmentDueIndicator.jsx";
import CombinationFileTable from "../Components/CombinationFileTable.jsx";
import MarkdownPreview from '@uiw/react-markdown-preview';
import {CircularProgress, IconButton, Snackbar, styled} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import {Send, DeleteForever, Save} from '@mui/icons-material';

export function AssignmentPage() {
    const { hw_id } = useParams();
    const [assignmentInfo, setAssignmentInfo] = useState(null);
    const [submissionInfo, setSubmissionInfo] = useState(null);
    const [markdown, setMarkdown] = useState(
        `> Loading...\nPlease be patient, some large tasks take a minute to fetch.`
    );
    const [linkedFileInfo, setLinkedFileInfo] = useState([]);
    const [submissionFileInfo, setSubmissionFileInfo] = useState([]);
    const [openNotif, setOpenNotif] = React.useState(false);
    const [notifMessage, setNotifMessage] = React.useState("Complete!");

    function formatOids(oids) {
        if (!Array.isArray(oids)) {
            try {
                oids = JSON.parse(oids); // if backend gives a JSON string
            } catch {
                return "[]";
            }
        }
        return encodeURIComponent(JSON.stringify(oids));
    }

    function sendSubmission() {
        console.log("sending ", submissionInfo.submission_id)
        const result = fetch(`/api/assignments/submissions/item/${assignmentInfo.hw_id}/finalize`)
            .then(response => response.json())
            .then(json => {
                window.history.back();
                }
            )
    }

    function rmSubmission() {
        const result = fetch(`/api/assignments/submissions/item/${submissionInfo.submission_id}/delete`)
            .then(response => response.json())
            .then(json => {
                window.history.back();
                }
            )
    }
    function saveSubmission() {
        const result = fetch(`/api/assignments/submissions/item/${submissionInfo.submission_id}/`)
            .then(response => response.json())
            .then(json => {
                    if (json.result === "failed") {
                        console.log("no submission, making new");
                        const result2 = fetch(`/api/assignments/submissions/new`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json; charset=UTF-8",
                            },
                            body: JSON.stringify({
                                linked_files: submissionFileInfo,
                                homework_id: assignmentInfo.hw_id,
                            }),
                        })
                        .then(response => response.json())
                        .then(json => {
                            location.reload();
                        }
                        )
                    }
                    else {
                        console.log("updating submission", submissionInfo.submission_id, submissionFileInfo);
                        const result2 = fetch(`/api/assignments/submissions/item/${submissionInfo.submission_id}/update`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json; charset=UTF-8",
                            },
                            body: JSON.stringify({
                                linked_files: submissionFileInfo,
                            }),
                        })
                            .then(res => res.json())
                            .then(json => {
                                location.reload();
                            });
                    }
                }
            )
    }

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            // POST to your upload endpoint
            const response = await fetch("/api/object/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            // Expecting a JSON response like { oid: "12345" }
            const data = await response.json();

            console.log("upload resp", data);

            if (data.oid) {
                console.log(data.oid);
                fetch(`/api/object/bulk/info?oids=${formatOids([data.oid])}`)
                    .then(response => response.json())
                .then(json => {
                    console.log("uploaded file info", json)
                    setSubmissionFileInfo((prev) => [
                        ...prev,
                        ...(json.list || []).map(file => ({ ...file, source: "Student" })),
                    ]);
                })

            }

            console.log("Upload complete:", data);
        } catch (error) {
            console.error("Error uploading file:", error);
        }

        // Reset the input so you can upload again
        event.target.value = "";
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const assignmentRes = await fetch(`/api/assignments/item/${hw_id}`);
                const assignmentJson = await assignmentRes.json();
                const assignment = assignmentJson.assignment;
                console.log("assignment", assignment);
                setAssignmentInfo(assignment);

                const [markdownRes, submissionsRes] = await Promise.all([
                    fetch(`/api/object/${assignment.md}`),
                    fetch(`/api/assignments/submissions/${hw_id}`),
                ]);

                const [markdownText, submissionsJson] = await Promise.all([
                    markdownRes.text(),
                    submissionsRes.json(),
                ]);

                setMarkdown(markdownText);

                // ✅ Protect against null contents
                const submission = submissionsJson.contents || { linked_files: [] };
                setSubmissionInfo(submission);

                const studentQuery = formatOids(submission.linked_files);

                const [studentFileRes, teacherFileRes] = await Promise.all([
                    fetch(`/api/object/bulk/info?oids=${studentQuery}`),
                    fetch(`/api/object/bulk/info?oids=${assignment.linked_files}`),
                ]);

                const [studentFiles, teacherFiles] = await Promise.all([
                    studentFileRes.json(),
                    teacherFileRes.json(),
                ]);

                setSubmissionFileInfo(
                    (studentFiles.list || []).map(file => ({ ...file, source: "Student" }))
                );
                setLinkedFileInfo(
                    (teacherFiles.list || []).map(file => ({ ...file, source: "Teacher" }))
                );

            } catch (err) {
                console.error("Error fetching assignment data:", err);
            }
        };

        fetchData();
    }, [hw_id]);


    const combinedRows = [...linkedFileInfo, ...submissionFileInfo];

    const VisuallyHiddenInput = styled('input')({
        clip: 'rect(0 0 0 0)',
        clipPath: 'inset(50%)',
        height: 1,
        overflow: 'hidden',
        position: 'absolute',
        bottom: 0,
        left: 0,
        whiteSpace: 'nowrap',
        width: 1,
    });

    const handleNotifClick = (type) => {
        console.log("action", type);
        if (type === "send") {
            sendSubmission()
            setNotifMessage("Sent successfully!")
        }
        if (type === "save") {
            saveSubmission()
            setNotifMessage("Saved successfully!")
        }

        if (type === "delete") {
            rmSubmission()
            setNotifMessage("Deleted successfully!")
        }
        setOpenNotif(true);
    };

    const handleNotifClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenNotif(false);
    };


    if (!assignmentInfo || combinedRows.length === 0) {
        return (
            <div className="page-layout">
                <main className="main-content">
                    <div style={{ width: "50em" }}>
                        <h1>Loading...</h1>
                        <CircularProgress />
                    </div>
                </main>
            </div>
        );
    }

    const notifAction = (
        <React.Fragment>
            <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleNotifClose}
            >
                <CloseIcon fontSize="small" />
            </IconButton>
        </React.Fragment>
    );

    return (
        <div className="page-layout">
            <main className="main-content">
                <div>
                    <h1>{assignmentInfo.name}</h1>
                    <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                        <p style={{ margin: 0 }}>Class: {assignmentInfo.class_name}</p>
                        <UserTooltip uuid={assignmentInfo.assignee_uuid}>
                            <span className="user-tag" style={{ backgroundColor: assignmentInfo.teacher_color }} onClick={() => (window.location = `/#/People/${assignmentInfo.assignee_uuid}`)}>
                              {assignmentInfo.teacher_name}
                            </span>
                        </UserTooltip>
                    </div>
                    <div style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}>
                        <Stack direction="row" spacing={2}>
                            <Button variant="contained" endIcon={<Send />} onClick={() => handleNotifClick("send")}>
                                Hand in
                            </Button>
                            <Button variant="contained" endIcon={<Save />} onClick={() => handleNotifClick("save")} color="success">
                                Save Progress
                            </Button>
                            <Snackbar
                                open={openNotif}
                                autoHideDuration={6000}
                                onClose={handleNotifClose}
                                message={notifMessage}
                                action={notifAction}
                            />
                            <Button
                                variant="contained"
                                color="error"
                                endIcon={<DeleteForever />}
                                onClick={() => handleNotifClick("delete")}
                            >
                                Delete progress
                            </Button>
                        </Stack>
                        <div className="due-indicator-div">
                            <AssignmentDueIndicator assignmentInfo={assignmentInfo} />
                        </div>
                    </div>
                    <h1>Task:</h1>
                    <div className="md-div" style={{ padding: 16 }}>
                        <MarkdownPreview source={markdown} wrapperElement={{ "data-color-mode": "light" }} />
                    </div>
                    <div style={{ width: "50em", gap: "0.5rem" }}>
                        <h1>Files</h1>
                        <CombinationFileTable combinedRows={combinedRows} handleFileChange={handleFileChange}/>
                    </div>
                </div>
            </main>
        </div>
    );
}
