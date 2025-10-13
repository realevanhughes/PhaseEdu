import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import {DataGrid} from "@mui/x-data-grid";
import {CircularProgress, createTheme, IconButton, ThemeProvider} from "@mui/material";
import {ChevronRight, Download, CloudUpload, Send, DeleteForever, Save, DeleteOutlined} from '@mui/icons-material';
import React from "react";


export default function CombinationFileTable({ combinedRows, handleFileChange }) {
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
                    href={`/app#/Document/${params.row.oid}`}
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
    const paginationModel = { page: 0, pageSize: 5 };
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
        <div>
            <Stack direction="row" spacing={2} style={{ paddingBottom: "0.5em" }}>
                <div>
                    <input
                        accept="*"
                        type="file"
                        id="file-upload"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload">
                        <Button variant="contained" component="span">
                            Upload File
                        </Button>
                    </label>
                </div>
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
    );
}