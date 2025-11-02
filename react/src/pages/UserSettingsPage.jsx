import React, {useEffect, useState} from "react";
import {
    TextField,
    Checkbox,
    FormControlLabel,
    Button,
    Paper,
    Stack, MenuItem, FormControl, Select, InputLabel, ThemeProvider, Box
} from "@mui/material";
import MDEditor from "@uiw/react-md-editor";
import HalfCombinationFileTable from "../Components/HalfCombinationFileTable.jsx";

export default function CreateHomework() {
    const [userData, setUserData] = useState({
        class_id: "",
        due_date_time: "",
        marked: false,
        in_person: false,
        points: "",
        name: "",
        md: "",
        linked_files: []
    });

    const formatDateTime = (date) => {
        const pad = (n) => String(n).padStart(2, "0");
        const year = date.getFullYear();
        const month = pad(date.getMonth() + 1);
        const day = pad(date.getDate());
        const hour = pad(date.getHours());
        const minute = pad(date.getMinutes());
        const second = pad(date.getSeconds());
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
    };


    useEffect(() => {
        fetch("/api/people/me/info")
            .then((res) => res.json())
            .then((data) => {
                if (data.result === "success") setUserData(data);
            })
            .catch((err) => console.error("Error fetching user data:", err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/people/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...userData}),
            });

            if (response.ok) {
                alert("User updated successfully!");
                window.history.back();
            } else {
                const error = await response.text();
                alert("Failed to update user: " + error);
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while modifying user.");
        }
    };
        return (
            <div className="page-layout">
                <main className="main-content">
                    <Paper sx={{ p: 3, margin: "auto" }} className="set-hw-div">
                        <h1 style={{ paddingBottom: "0.5em" }}>Create New Homework</h1>
                        <form onSubmit={handleSubmit}>
                            <Stack direction="row" spacing={3} alignItems="flex-start">
                                <Box sx={{ flex: 1 }}>
                                    <Stack spacing={2}>
                                        <TextField
                                            label="Homework Name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            fullWidth
                                        />

                                        <div>
                                            <label
                                                style={{
                                                    display: "block",
                                                    fontWeight: 500,
                                                    marginBottom: "0.3em",
                                                }}
                                            >
                                                Due Date and Time
                                            </label>
                                            <input
                                                type="datetime-local"
                                                onChange={handleDateChange}
                                                style={{
                                                    width: "100%",
                                                    padding: "0.5em",
                                                    fontSize: "1em",
                                                    border: "1px solid #ccc",
                                                    borderRadius: "4px",
                                                }}
                                            />
                                        </div>

                                        <TextField
                                            label="Points"
                                            name="points"
                                            type="number"
                                            value={formData.points}
                                            onChange={handleChange}
                                            required
                                            fullWidth
                                        />

                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={formData.marked}
                                                    onChange={handleChange}
                                                    name="marked"
                                                />
                                            }
                                            label="Marked"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={formData.in_person}
                                                    onChange={handleChange}
                                                    name="in_person"
                                                />
                                            }
                                            label="In Person"
                                        />
                                    </Stack>
                                </Box>

                                <Box sx={{ flex: 1 }}>
                                    <HalfCombinationFileTable
                                        combinedRows={files}
                                        handleFileChange={handleFileChange}
                                    />
                                </Box>
                            </Stack>
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
                                    <MDEditor value={mdContent} onChange={setMdContent} height={300} />
                                </div>
                            </Box>

                            <Button type="submit" variant="contained" color="success" sx={{ mt: 2 }}>
                                Create Homework
                            </Button>
                        </form>

                    </Paper>
                </main>
            </div>
        );
}
