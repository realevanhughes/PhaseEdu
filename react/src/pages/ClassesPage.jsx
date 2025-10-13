import React, { useEffect, useState } from "react";
import UserTooltip from "../Components/UserTooltip";
import {CircularProgress, createTheme, IconButton, ThemeProvider} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import { ChevronRight } from '@mui/icons-material';

export function ClassesPage() {
    const [classInfo, setClassInfo] = useState([]);

    useEffect(() => {
        fetch("/api/classes/list/detailed")
            .then((response) => response.json())
            .then((json) => {
                let li = json.list
                for (let i = 0; i < li.length; i++) {
                    li[i].id = i;
                }
                setClassInfo(li);
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
        { field: 'subject', headerName: 'Subject', width: 200 },
        {
            field: "teacher_name",
            headerName: "Teacher",
            disableClickEventBubbling: true,
            width: 200,
            renderCell: (params) => (
                <UserTooltip uuid={params.row.teacher_uuid}>
                    <span className="user-tag" style={{"background-color": params.row.teacher_color}} onClick={() => (window.location = `/#/People/${row.teacher_uuid}`)}>{params.row.teacher_name}</span>
                </UserTooltip>
            ),
        },
        { field: 'room_name', headerName: 'Room', width: 200 },
        {
            field: "actions",
            headerName: "Open",
            width: 80,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
            renderCell: (params) => (
                <IconButton
                    href={`/app#/Classes/${params.row.class_id}`}
                    component="a"
                >
                    <ChevronRight />
                </IconButton>
            ),
        },
    ];


    if ( classInfo.length === 0) {
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
    return (
        <div className="page-layout">
            <main className="main-content">
                <div style={{ width: "50em" }}>
                    
                    <ThemeProvider theme={theme}>
                        <Paper className="tbl" style={{ padding: "1em"}}>
                            
                                <h1>Classes</h1>
                                <DataGrid
                                    rows={classInfo}
                                    columns={columns}
                                    initialState={{ pagination: { paginationModel } }}
                                    pageSizeOptions={[5, 10]}
                                    checkboxSelection
                                    sx={{
                                        border: 0,
                                        '& .MuiDataGrid-footerContainer': {
                                            paddingBottom: '1em',
                                        }
                                    }}
                                    className="tbl-txt"
                                />
                            
                        </Paper>
                    </ThemeProvider>
                </div>
            </main>
        </div>
    );
}
