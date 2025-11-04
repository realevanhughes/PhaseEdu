import React, { useState } from "react";
import { Box, TextField, Button, Paper, Typography } from "@mui/material";
import MDEditor from "@uiw/react-md-editor";

export default function NewNotePage() {
    const [title, setTitle] = useState("");
    const [mdContent, setMdContent] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [formDat, setFormDat] = useState({});

    async function uploadMD() {
        console.log("sending MD");
        setUploading(true);
        setUploadError("");

        try {
            const blob = new Blob([mdContent], { type: "text/markdown" });
            const file = new File([blob], "note.md", { type: "text/markdown" });
            const data = new FormData();
            data.append("file", file);

            const response = await fetch("/api/object/upload", {
                method: "POST",
                body: data,
            });

            if (!response.ok) throw new Error("Upload failed");

            const json = await response.json();
            let modifiedForm = formDat
            modifiedForm["md"] = json.oid;
            setFormDat(modifiedForm);
            return json.oid;
        } catch (err) {
            console.error(err);
            setUploadError("Error uploading markdown file.");
            return null;
        } finally {
            setUploading(false);
        }
    }

    const handleSave = async () => {
        console.log("Saving note:", {title, mdContent});
        const mdOid = await uploadMD();

        if (!mdOid) {
            alert("Please upload the markdown first!");
            return;
        }

        let modifiedForm = formDat
        modifiedForm["name"] = title;
        setFormDat(modifiedForm);

        try {
            const response = await fetch("/api/notes/new", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(formDat),
            });

            if (response.ok) {
                alert("Note created successfully!");
                window.history.back();
            } else {
                const error = await response.text();
                alert("Failed to create Note: " + error);
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while creating note.");
        }
    };

    return (
        <div className="page-layout">
            <main className="main-content">
                    <Paper sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2, margin: "auto" }} className="form-div">
                        <h1 style={{ paddingBottom: "0.5em" }}>New note</h1>

                        <TextField
                            label="Note Title"
                            variant="outlined"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            fullWidth
                        />

                        <Box sx={{ mt: 3 }}>
                            <div data-color-mode="light">
                                <label
                                    style={{
                                        fontWeight: 500,
                                        marginBottom: "0.5em",
                                        display: "block",
                                    }}
                                >
                                    Task Description (Markdown)
                                </label>
                                <MDEditor value={mdContent} onChange={setMdContent} height={500} />
                            </div>
                        </Box>

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSave}
                            sx={{ alignSelf: "flex-end" }}
                        >
                            Save
                        </Button>
                    </Paper>
            </main>
        </div>
    );
}
