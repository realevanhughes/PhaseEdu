import React, {useEffect, useState} from "react";
import { Box, TextField, Button, Paper, Typography } from "@mui/material";
import MDEditor from "@uiw/react-md-editor";
import {useParams} from "react-router-dom";
import MarkdownPreview from "@uiw/react-markdown-preview";

export default function NotePage() {
    const { note_id } = useParams();
    const [note, setNote] = useState({"name": "Loading note..."});
    const [mdContent, setMdContent] = useState("");


    useEffect(() => {
        fetch(`/api/notes/item/${note_id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.result === "success") {
                    setNote(data.note);
                    fetch(`/api/object/${data.note.md}`)
                        .then((res) => res.text())
                        .then((md_data) => {
                            setMdContent(md_data);
                        })
                        .catch((err) => console.error("Error fetching note contents:", err));
                }
            })
            .catch((err) => console.error("Error fetching note:", err));
    }, []);

    return (
        <div className="page-layout">
            <main className="main-content">
                <Paper sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2, margin: "auto" }} className="form-div">
                    <h1 style={{ paddingBottom: "0.5em" }}>{note.name}</h1>
                    <Box sx={{ mt: 3 }}>
                        <div className="md-div" style={{ padding: 16 }}>
                            <MarkdownPreview source={mdContent} wrapperElement={{ "data-color-mode": "light" }} />
                        </div>
                    </Box>
                </Paper>
            </main>
        </div>
    );
}
