import { useParams } from "react-router-dom";
import React, {useEffect, useState} from "react";
import {ThemeProvider, createTheme, CircularProgress} from "@mui/material";
import Paper from "@mui/material/Paper";
import {DataGrid} from "@mui/x-data-grid";
import UserTooltip from "../Components/UserTooltip";

export default function ClassPage() {
    const {cid} = useParams();

    const [classInfo, setClassInfo] = useState(null);
    const [members, setMembers] = useState(null);

    useEffect(() => {
        fetch(`/api/classes/${cid}/info`)
            .then((response) => {
                return response.json();
            })
            .then((json) => {
                console.log(json);
                setClassInfo(json.contents);
            })
        fetch(`/api/classes/${cid}/members`)
            .then((response) => {
                return response.json();
            })
            .then((json) => {
                console.log(json);
                setMembers(json.members);
            })
    }, [cid]);

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
        {
            field: "uuid",
            headerName: "Name",
            disableClickEventBubbling: true,
            width: 200,
            renderCell: (params) => (
                <UserTooltip uuid={params.row.uuid}>
                    <span className="user-tag" style={{"background-color": params.row.color}} onClick={() => (window.location = `/#/People/${params.row.uuid}`)}>{params.row.firstname} {params.row.lastname}</span>
                </UserTooltip>
            ),
        },
        { field: 'role', headerName: 'Role', width: 185, sortable: true, },
    ];

    if (classInfo === null || members === null) {
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
    else {
        return(
            <>
                <div className="page-layout">
                    <main className="main-content">
                        <div>
                            <h1 className="text-2xl font-bold">{classInfo.name}</h1>
                            <table>

                            </table>
                            <p1>{classInfo.subject}</p1>
                            <h1>Members</h1>
                            <ThemeProvider theme={theme}>
                                <Paper className="tbl">
                                    <DataGrid
                                        rows={members}
                                        columns={columns}
                                        getRowId={(row) => row.uuid}
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
            </>
        )
    }
}

