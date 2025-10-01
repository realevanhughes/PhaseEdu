import React, { useEffect, useState } from "react";
import UserTooltip from "../Components/UserTooltip";

import {createTheme, IconButton, ThemeProvider} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { ChevronRight } from '@mui/icons-material';

export function AssignmentsPage() {
    const [assignmentInfo, setAssignmentInfo] = useState([]);

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
        { field: 'set_date', headerName: 'Set', width: 200, sortable: true, },
        { field: 'due_date_time', headerName: 'Due', width: 200, sortable: true, },
        {
            field: "in_person",
            headerName: "Submission type",
            width: 180,
            renderCell: (params) => (
                params.row.in_person === 1 ? "In person" : "Online"
            ),
        },
        {
            field: "marked",
            headerName: "Marked",
            width: 140,
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
    ];

    return (
        <div className="page-layout">
            <main className="main-content">
                <div style={{ width: "50em" }}>
                    <h1>Assignments</h1>
                    <ThemeProvider theme={theme}>
                        <Paper className="tbl">
                            <DataGrid
                                rows={assignmentInfo}
                                columns={columns}
                                initialState={{ pagination: { paginationModel } }}
                                pageSizeOptions={[5, 10]}
                                checkboxSelection
                                sx={{ border: 0 }}
                            />
                        </Paper>
                    </ThemeProvider>
                </div>
            </main>
        </div>
    );
}