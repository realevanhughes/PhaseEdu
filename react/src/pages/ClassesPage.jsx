import React, { useEffect, useState } from "react";
import UserTooltip from "../Components/UserTooltip";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {createTheme, ThemeProvider} from "@mui/material";
export function ClassesPage() {
    const [classInfo, setClassInfo] = useState([]);

    useEffect(() => {
        fetch("/api/classes/list/detailed")
            .then((response) => response.json())
            .then((json) => {
                setClassInfo(json.list);
                console.log(json.list);
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


    return (
        <div className="page-layout">
            <main className="main-content">
                <div style={{ width: "50em" }}>
                    <h1>Classes</h1>
                    <ThemeProvider theme={theme}>
                        <Table sx={{ minWidth: 1000 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell align="right">Subject</TableCell>
                                    <TableCell align="right">Teacher</TableCell>
                                    <TableCell align="right">Room</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {classInfo.map((row) => (
                                    <TableRow
                                        key={row.name}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 }}}
                                    >
                                        <TableCell component="th" scope="row">
                                            {row.name}
                                        </TableCell>
                                        <TableCell align="right">{row.subject}</TableCell>
                                        <TableCell onClick={() => (window.location = `/#/People/${row.teacher_uuid}`)} align="right">
                                            <UserTooltip uuid={row.teacher_uuid}>
                                                <span className="user-tag" style={{"background-color": row.teacher_color}}>{row.teacher_name}</span>
                                            </UserTooltip>
                                        </TableCell>
                                        <TableCell align="right">{row.room_name}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ThemeProvider>
                </div>
            </main>
        </div>
    );
}
