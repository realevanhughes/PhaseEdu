import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import UserTooltip from "../Components/UserTooltip.jsx";
import MarkdownPreview from '@uiw/react-markdown-preview';
import {createTheme, IconButton, styled, ThemeProvider} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { ChevronRight, Download, CloudUpload, Send } from '@mui/icons-material';

export function AssignmentPage() {
    const { hw_id } = useParams();
    const [assignmentInfo, setAssignmentInfo] = useState(null);
    const [markdown, setMarkdown] = useState(`> Loading...
    Please be patient, some large tasks take a minute to fetch.`);
    const [linkedFileInfo, setLinkedFileInfo] = useState(null);

    useEffect(() => {
        fetch(`/api/assignments/item/${hw_id}`)
            .then((response) => response.json())
            .then((json) => {
                setAssignmentInfo(json.assignment);
                console.log(json.assignment);
                fetch(`/api/object/${json.assignment.md}`)
                    .then((response) => response.text())
                    .then((text) => {
                        setMarkdown(text);
                        console.log(text);
                        console.log(json.assignment.linked_files);
                        fetch(`/api/object/bulk/info?oids=${json.assignment.linked_files}`)
                            .then((response) => response.json())
                            .then((json) => {
                                let li = json.list
                                for (let i = 0; i < li.length; i++) {
                                    li[i].id = i;
                                }
                                setLinkedFileInfo(li);
                                console.log(li);
                            })
                            .catch((err) => console.error("Error fetching linked items:", err));
                    })
                    .catch((err) => console.error("Error fetching markdown:", err));
            });
    }, []);

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
                            <Button variant="contained" endIcon={<Send />}>
                                Submit
                            </Button>
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
                                    rows={linkedFileInfo}
                                    columns={columns}
                                    initialState={{ pagination: { paginationModel } }}
                                    pageSizeOptions={[5, 10]}
                                    checkboxSelection
                                    sx={{ border: 0 }}
                                />
                            </Paper>
                        </ThemeProvider>
                    </div>
                </div>
            </main>
        </div>
    );
}
