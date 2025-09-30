import React, { useEffect, useState } from "react";
import UserTooltip from "../Components/UserTooltip";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {createTheme, ThemeProvider} from "@mui/material";

export function AssignmentsPage() {
    const [assignmentInfo, setAssignmentInfo] = useState([]);

    useEffect(() => {
        fetch("/api/assignments/list")
            .then((response) => response.json())
            .then((json) => {
                setAssignmentInfo(json.list);
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
                    <h1>Assignments</h1>
                    <ThemeProvider theme={theme}>
                        <Table sx={{ minWidth: 1500 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell align="right">Class</TableCell>
                                    <TableCell align="right">Teacher</TableCell>
                                    <TableCell align="right">Set</TableCell>
                                    <TableCell align="right">Due</TableCell>
                                    <TableCell align="right">Submission type</TableCell>
                                    <TableCell align="right">Marked</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {assignmentInfo.map((row) => (
                                    <TableRow
                                        key={row.name}
                                        sx={{ '&:last-child td, &:last-child th': { border: 0 }}}
                                    >
                                        <TableCell component="th" scope="row">
                                            {row.name}
                                        </TableCell>
                                        <TableCell align="right">{row.class_name}</TableCell>
                                        <TableCell onClick={() => (window.location = `/#/People/${row.assignee_uuid}`)} align="right">
                                            <UserTooltip uuid={row.assignee_uuid}>
                                                <span className="user-tag" style={{"background-color": row.teacher_color}}>{row.teacher_name}</span>
                                            </UserTooltip>
                                        </TableCell>
                                        <TableCell align="right">{row.set_date}</TableCell>
                                        <TableCell align="right">{row.due_date_time}</TableCell>
                                        <TableCell align="right">{row.in_person === 1 ? "In person" : "Online"}</TableCell>
                                        <TableCell align="right">{row.marked === 1 ? "Yes" : "No"}</TableCell>
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