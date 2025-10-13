import React, { useEffect, useState } from "react";
import UserTooltip from "../Components/UserTooltip";

import {ButtonGroup, CircularProgress, createTheme, IconButton, Snackbar, ThemeProvider} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { ChevronRight, Lock, AddBox, DeleteSweep } from '@mui/icons-material';
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CloseIcon from "@mui/icons-material/Close";


export function AssignmentsPage() {
    const [assignmentInfo, setAssignmentInfo] = useState([]);
    const [myRole, setMyRole] = useState(null);
    const [selectedRows, setSelectedRows] = useState([]);
    const [openNotif, setOpenNotif] = React.useState(false);
    const [notifMessage, setNotifMessage] = React.useState("Complete!");

    useEffect(() => {
        fetch("/api/assignments/list")
            .then((response) => response.json())
            .then((json) => {
                setAssignmentInfo(json.list);
                console.log(json.list);
            });
        fetch("/api/myrole")
        .then((response) => response.json())
        .then((json) => {
            setMyRole(json.role);
            console.log("Your role:", json.role);
        })
    }, []);
    useEffect(() => {
        setSelectedRows([]);
    }, [myRole, assignmentInfo]);

    function deleteHomework(){
        for (let item of selectedRows) {
            console.log("deleting item", item)
            let result = fetch(`/api/assignments/${item}/delete`)
                .then(response => response.json())
                .then(json => {
                        if (json.result === "failed") {
                            alert(`Failed to delete item, ${json.message}`);
                        }
                    }
                )
        }
        if (selectedRows.length === 0) {
            setNotifMessage("Please select rows.")
        }
        else {
            setNotifMessage("Deleted successfully!")
            location.reload();
        }

    }


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
                    >
                        <ChevronRight />
                    </IconButton>
                );
            },
        }
    ];

    const handleNotifClick = (type) => {
        console.log("action", type);
        if (type === "delete") {
            deleteHomework()
        }
        setOpenNotif(true);
    };

    const handleNotifClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }

        setOpenNotif(false);
    };

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

    if (!Array.isArray(assignmentInfo) || assignmentInfo.length === 0) {
        console.log("Teacher page: data not ready yet");
        return (
            <div className="page-layout">
                <main className="main-content">
                    <div style={{ width: "50em" }}>
                        <h1>Loading assignments...</h1>
                        <CircularProgress />
                    </div>
                </main>
            </div>
        );
    }

    if (myRole === "student") {
        console.log("Using student page")
        return (
            <div className="page-layout">
                <main className="main-content">
                    <div style={{ width: "50em" }}>
                        <h1>Assignments (student view)</h1>
                        <ThemeProvider theme={theme}>
                            <Paper className="tbl">
                                <DataGrid
                                    rows={assignmentInfo}
                                    columns={[
                                        { field: "name", headerName: "Name", flex: 1 },
                                        { field: "class_name", headerName: "Class", flex: 1 },
                                        { field: "due_date_time", headerName: "Due", flex: 1 },
                                    ]}
                                    getRowId={(row) => row.hw_id}
                                    checkboxSelection
                                    sx={{ border: 0 }}
                                    className="tbl-txt"
                                    pageSizeOptions={[5, 10]}
                                    initialState={{
                                        pagination: { paginationModel: { pageSize: 5, page: 0 } },
                                    }}
                                    rowSelectionModel={selectedRows}
                                    onRowSelectionModelChange={(newSelection) => {
                                        setSelectedRows(newSelection);
                                    }}
                                />
                            </Paper>
                        </ThemeProvider>
                    </div>
                </main>
            </div>
        );
    }

    if (myRole === "teacher" || myRole === "dev" || myRole === "admin") {
        console.log("Using teacher page", assignmentInfo);
        return (
            <div className="page-layout">
                <main className="main-content">
                    <div style={{ width: "50em"}}>
                        <Snackbar
                            open={openNotif}
                            style={{ marginRight: "10em" }}
                            autoHideDuration={6000}
                            onClose={handleNotifClose}
                            message={notifMessage}
                            action={notifAction}
                        />

                        <ThemeProvider theme={theme}>
                            <Paper className="tbl" style={{ padding: "1em" }}>
                                <h1>Assignments (teacher view)</h1>
                                <Stack direction="row" spacing={2} marginTop="1em" marginBottom="1em" alignItems="center">
                                    <Button variant="contained" href="/app#/NewAssignment/" color="success">
                                        <AddBox />
                                    </Button>
                                    <span>Bulk actions:</span>
                                    <ButtonGroup variant="contained" aria-label="Basic button group">
                                        <Button variant="contained" onClick={() => handleNotifClick("delete")} color="error">
                                            <DeleteSweep />
                                        </Button>
                                    </ButtonGroup>
                                </Stack>
                                
                                <DataGrid
                                    rows={assignmentInfo}
                                    columns={columns}
                                    getRowId={(row) => row.hw_id}
                                    checkboxSelection
                                    sx={{ border: 0 }}
                                    className="tbl-txt"
                                    onRowSelectionModelChange={(newSelection) => {
                                        console.log("Selected IDs:", newSelection)
                                        setSelectedRows(newSelection.ids);
                                    }}
                                    initialState={{ pagination: { paginationModel } }}
                                    pageSizeOptions={[5, 10]}
                                />
                            </Paper>
                        </ThemeProvider>
                    </div>
                </main>
            </div>
        );
    }
    else {
        console.log("Role error")
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