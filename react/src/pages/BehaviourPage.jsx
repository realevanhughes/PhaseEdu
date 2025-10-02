import React, { useEffect, useState } from "react";
import UserTooltip from "../Components/UserTooltip";
import BehaviourDash from "../Components/BehaviourDash.jsx";
import {createTheme, IconButton, ThemeProvider} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';
import PointsDashboard from "../Components/BehaviourDash.jsx";

export function BehaviourPage() {
    const [pointInfo, setPointInfo] = useState([]);

    useEffect(() => {
        fetch("/api/points/list")
        .then((response) => response.json())
        .then((json) => {
            setPointInfo(json.pts);
            console.log(json.pts);
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
        { field: 'good_date_time', headerName: 'Date / Time', width: 180 },
        { field: 'class_name', headerName: 'Class', width: 250 },
        {
            field: "assignee_name",
            headerName: "Assignee",
            disableClickEventBubbling: true,
            width: 200,
            renderCell: (params) => (
                <UserTooltip uuid={params.row.assignee_id}>
                <span className="user-tag" style={{"background-color": params.row.teacher_color}} onClick={() => (window.location = `/#/People/${row.assignee_id}`)}>{params.row.teacher_name}</span>
                </UserTooltip>
            ),
        },
        { field: 'value', headerName: 'Value', width: 100 },
        { field: 'comments', headerName: 'Class', width: 200 },
        { field: 'category_name', headerName: 'Category', width: 200 },
    ];



    return (
        <>
            <div className="page-layout">
                <main className="main-content">
                    <div style={{ width: "50em" }}>
                        <PointsDashboard pointsData={pointInfo} />
                        <h1>Points</h1>
                        <ThemeProvider theme={theme}>
                            <Paper className="tbl">
                                <DataGrid
                                    rows={pointInfo}
                                    columns={columns}
                                    initialState={{ pagination: { paginationModel } }}
                                    pageSizeOptions={[5, 10]}
                                    getRowId={(row) => row.point_id}
                                    checkboxSelection
                                    sx={{ border: 0 }}
                                    className="tbl-txt"
                                />
                            </Paper>
                        </ThemeProvider>
                    </div>
                </main>
            </div>
        </>
    );
}
