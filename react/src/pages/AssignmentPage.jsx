import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UserTooltip from "../Components/UserTooltip.jsx";
import MarkdownPreview from '@uiw/react-markdown-preview';
import {createTheme, IconButton, Snackbar, styled, ThemeProvider} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import { ChevronRight, Download, CloudUpload, Send } from '@mui/icons-material';

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
        const result = fetch(`/api/assignments/submissions/item/${submissionInfo.submission_id}/finalize`)
            .then(response => response.json())
            .then(json => {
                window.back();
                }
            )
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const assignmentRes = await fetch(`/api/assignments/item/${hw_id}`);
                const assignmentJson = await assignmentRes.json();
                const assignment = assignmentJson.assignment;
                setAssignmentInfo(assignment);

                const [markdownRes, submissionsRes] = await Promise.all([
                    fetch(`/api/object/${assignment.md}`),
                    fetch(`/api/assignments/submissions/${hw_id}`),
                ]);

                const [markdownText, submissionsJson] = await Promise.all([
                    markdownRes.text(),
                    submissionsRes.json(),
                ]);

                console.log({
                    md: markdownText,
                    submissions: submissionsJson,
                });

                setMarkdown(markdownText);
                setSubmissionInfo(submissionsJson.contents);
                console.log("submissionJSON", submissionsJson);

                const studentQuery = formatOids(submissionsJson.contents.linked_files);
                const teacherQuery = formatOids(assignment.linked_files);

                console.log("studentOIDS", studentQuery, "teacherOIDS", teacherQuery);

                const [studentFileRes, teacherFileRes] = await Promise.all([
                    fetch(`/api/object/bulk/info?oids=${studentQuery}`),
                    fetch(`/api/object/bulk/info?oids=${teacherQuery}`),
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

                console.log("teacher", linkedFileInfo, "student", submissionFileInfo);

            } catch (err) {
                console.error("Error fetching assignment data:", err);
            }
        };

        fetchData();
    }, [hw_id]);

    const theme = createTheme({
        components: {
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        fontFamily: "Inter, sans-serif",
                        fontOpticalSizing: "auto",
                        fontWeight: "normal",
                        fontStyle: "normal",
                        fontSize: "1.1rem",
                    },
                },
            },
        },
    });
    const paginationModel = { page: 0, pageSize: 5 };
    const columns = [
        { field: 'name', headerName: 'Name', width: 300 },
        { field: 'file_extension', headerName: 'Extension', width: 100 },
        { field: 'description', headerName: 'Description', width: 400 },
        { field: 'source', headerName: 'Source', width: 100 },
        {
            field: "open",
            headerName: "Open",
            width: 80,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <IconButton
                    component="a"
                    href={`/app#/Assignments/${params.row.hw_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <ChevronRight />
                </IconButton>
            ),
        },
        {
            field: "download",
            headerName: "Download",
            width: 120,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <IconButton
                    component="a"
                    href={`/api/object/download/${params.row.oid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Download />
                </IconButton>
            ),
        },
    ];


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

    const handleNotifClick = () => {
        sendSubmission()
        setOpenNotif(true);
    };

    const handleNotifClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenNotif(false);
    };


    if (!assignmentInfo) {
        return (
            <div className="page-layout">
                <main className="main-content">
                    <div style={{ width: "50em" }}>
                        <h1>Assignment info</h1>
                        <p>Loading...</p>
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
                            <Button variant="contained" endIcon={<Send />} onClick={handleNotifClick}>
                                Submit
                            </Button>
                            <Snackbar
                                open={openNotif}
                                autoHideDuration={6000}
                                onClose={handleNotifClose}
                                message="Homework submission sent!"
                                action={notifAction}
                            />
                            <Button variant="contained" color="error">
                                Delete Progress
                            </Button>
                        </Stack>
                    </div>
                    <h1>Task:</h1>
                    <div className="md-div" style={{ padding: 16 }}>
                        <MarkdownPreview source={markdown} wrapperElement={{ "data-color-mode": "light" }} />
                    </div>
                    <div style={{ width: "50em", gap: "0.5rem" }}>
                        <h1>Files</h1>
                        <Stack direction="row" spacing={2}>
                            <Button
                                component="label"
                                role={undefined}
                                variant="contained"
                                tabIndex={-1}
                                startIcon={<CloudUpload />}
                            >
                                Upload files
                                <VisuallyHiddenInput
                                    type="file"
                                    onChange={(event) => console.log(event.target.value) }
                                    multiple
                                />
                            </Button>
                        </Stack>
                        <ThemeProvider theme={theme}>
                            <Paper className="tbl">
                                <DataGrid
                                    rows={combinedRows}
                                    columns={columns}
                                    getRowId={(row) => row.oid}
                                    initialState={{ pagination: { paginationModel } }}
                                    pageSizeOptions={[5, 10]}
                                    checkboxSelection
                                    sx={{
                                        border: 0,
                                        '& .MuiDataGrid-row.student-attached-row': {
                                            backgroundColor: '#e0f7fa',
                                        },
                                        '& .MuiDataGrid-row.teacher-attached-row': {
                                            backgroundColor: '#fce4ec',
                                        },
                                    }}
                                    getRowClassName={(params) =>
                                        params.row.source === "Student"
                                            ? "student-attached-row"
                                            : "teacher-attached-row"
                                    }
                                />
                            </Paper>
                        </ThemeProvider>
                    </div>
                </div>
            </main>
        </div>
    );
}
