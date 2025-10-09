import React, { useEffect, useState } from "react";
import UserTooltip from "../Components/UserTooltip";

import {createTheme, IconButton, ThemeProvider} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { ChevronRight, Lock } from '@mui/icons-material';
import Button from "@mui/material/Button";

export function AssignmentsPage() {
    const [assignmentInfo, setAssignmentInfo] = useState([]);
    const [myRole, setMyRole] = useState("student");

    useEffect(() => {
        fetch("/api/assignments/list")
            .then((response) => response.json())
            .then((json) => {
                let li = json.list
                for (let i = 0; i < li.length; i++) {
                    li[i].id = i;
                }
                setAssignmentInfo(li);
                console.log(li);
            });
        fetch("/api/myrole")
        .then((response) => response.json())
        .then((json) => {
            setMyRole(json.role);
            console.log("Your role:", json.role);
        })
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
        { field: 'class_name', headerName: 'Class', width: 200 },
        {
            field: "teacher_name",
            headerName: "Teacher",
            disableClickEventBubbling: true,
            width: 200,
            renderCell: (params) => (
                <UserTooltip uuid={params.row.assignee_uuid}>
                    <span className="user-tag" style={{"background-color": params.row.teacher_color}} onClick={() => (window.location = `/#/People/${params.row.assignee_uuid}`)}>{params.row.teacher_name}</span>
                </UserTooltip>
            ),
        },
        { field: 'status', headerName: 'Status', width: 100, sortable: true, },
        { field: 'set_date', headerName: 'Set', width: 185, sortable: true, },
        { field: 'due_date_time', headerName: 'Due', width: 185, sortable: true, },
        {
            field: "in_person",
            headerName: "Submission type",
            width: 160,
            renderCell: (params) => (
                params.row.in_person === 1 ? "In person" : "Online"
            ),
        },
        {
            field: "marked",
            headerName: "Marked",
            width: 100,
            renderCell: (params) => (
                params.row.marked === 1 ? "Yes" : "No"
            ),
        },
        {
            field: "actions",
            headerName: "Open",
            width: 80,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => {
                if (params.row.status === "Handed in" || params.row.status === "Overdue") {
                    return (
                        <IconButton disabled>
                            <Lock />
                        </IconButton>
                    );
                }
                return (
                    <IconButton
                        component="a"
                        href={`/app#/Assignments/${params.row.hw_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <ChevronRight />
                    </IconButton>
                );
            },
        }
    ];

    if (myRole === "student") {
        return (
            <div className="page-layout">
                <main className="main-content">
                    <div style={{ width: "50em" }}>
                        <h1>Assignments (student view)</h1>
                        <ThemeProvider theme={theme}>
                            <Paper className="tbl">
                                <DataGrid
                                    rows={assignmentInfo}
                                    columns={columns}
                                    initialState={{ pagination: { paginationModel } }}
                                    pageSizeOptions={[5, 10]}
                                    checkboxSelection
                                    sx={{ border: 0 }}
                                    className="tbl-txt"
                                />
                            </Paper>
                        </ThemeProvider>
                    </div>
                </main>
            </div>
        );
    }
    if (myRole === "teacher" || myRole === "dev" || myRole === "admin") {
        return (
            <div className="page-layout">
                <main className="main-content">
                    <div style={{ width: "50em" }}>
                        <h1>Assignments (teacher view)</h1>
                        <Button variant="contained" href="/app#/NewAssignment/" color="success">
                            New
                        </Button>
                        <ThemeProvider theme={theme}>
                            <Paper className="tbl">
                                <DataGrid
                                    rows={assignmentInfo}
                                    columns={columns}
                                    initialState={{ pagination: { paginationModel } }}
                                    pageSizeOptions={[5, 10]}
                                    checkboxSelection
                                    sx={{ border: 0 }}
                                    className="tbl-txt"
                                />
                            </Paper>
                        </ThemeProvider>
                    </div>
                </main>
            </div>
        );
    }
    else {
        return (
            <div className="page-layout">
                <main className="main-content">
                    <div style={{ width: "50em" }}>
                        <h1>Cannot ascertain role</h1>
                    </div>
                </main>
            </div>
        );
    }
}