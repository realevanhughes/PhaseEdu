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
    const [formData, setFormData] = useState({
        class_id: "",
        due_date_time: "",
        marked: false,
        in_person: false,
        points: "",
        name: "",
        md: "",
        linked_files: []
    });

    const [mdContent, setMdContent] = useState("");
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [classes, setClasses] = useState([]);
    const [myRole, setMyRole] = useState("teacher");
    const [files, setFiles] = useState([]);

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

    function formatOids(oids) {
        if (!Array.isArray(oids)) {
            try {
                oids = JSON.parse(oids);
            } catch {
                return "[]";
            }
        }
        return encodeURIComponent(JSON.stringify(oids));
    }

    useEffect(() => {
        fetch("/api/classes/list")
            .then((res) => res.json())
            .then((data) => {
                if (data.result === "success") setClasses(data.list);
            })
            .catch((err) => console.error("Error fetching classes:", err));
        fetch("/api/myrole")
            .then((response) => response.json())
            .then((json) => {
                setMyRole(json.role);
                console.log("Your role:", json.role);
            })
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleDateChange = (e) => {
        const dateValue = new Date(e.target.value);
        if (!isNaN(dateValue)) {
            setFormData({
                ...formData,
                due_date_time: formatDateTime(dateValue)
            });
        }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("/api/object/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();

            console.log("upload resp", data);

            if (data.oid) {
                let pre_existing_arr = formData.linked_files
                if (!pre_existing_arr) {
                    pre_existing_arr = [];
                }
                pre_existing_arr.push(data.oid)
                setFormData((prev) => ({ ...prev, linked_files: pre_existing_arr }));
                console.log(data.oid);
                fetch(`/api/object/bulk/info?oids=${formatOids([data.oid])}`)
                    .then(response => response.json())
                    .then(json => {
                        console.log("uploaded file info", json)
                        setFiles((prev) => [
                            ...prev,
                            ...(json.list || []).map(file => ({ ...file, source: "Teacher" })),
                        ]);
                    })

            }

            console.log("Upload complete:", data);
        } catch (error) {
            console.error("Error uploading file:", error);
        }

        event.target.value = "";
    };

    async function uploadMD() {
        console.log("sending MD");
        setUploading(true);
        setUploadError("");

        try {
            const blob = new Blob([mdContent], { type: "text/markdown" });
            const file = new File([blob], "task_description.md", { type: "text/markdown" });
            const data = new FormData();
            data.append("file", file);

            const response = await fetch("/api/object/upload", {
                method: "POST",
                body: data,
            });

            if (!response.ok) throw new Error("Upload failed");

            const json = await response.json();
            setFormData((prev) => ({ ...prev, md: json.oid }));
            return json.oid;
        } catch (err) {
            console.error(err);
            setUploadError("Error uploading markdown file.");
            return null;
        } finally {
            setUploading(false);
        }
    }


    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("sending HW", { ...formData, md: mdOid });

        const mdOid = await uploadMD();

        if (!mdOid) {
            alert("Please upload the markdown first!");
            return;
        }

        try {
            const response = await fetch("/api/assignments/new", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...formData, md: mdOid }),
            });

            if (response.ok) {
                alert("Homework created successfully!");
                window.history.back();
            } else {
                const error = await response.text();
                alert("Failed to create homework: " + error);
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while creating homework.");
        }
    };

    if (myRole === "student") {
        return (
            <div className="page-layout">
                <main className="main-content">
                    <div style={{ width: "50em" }}>
                        <h1 style={{color: "red"}}>You are not permitted to access this. Please go back.</h1>
                    </div>
                </main>
            </div>
        );
    }
    else {
        return (
            <div className="page-layout">
                <main className="main-content">
                    <Paper sx={{ p: 3, margin: "auto" }} className="form-div">
                        <h1 style={{ paddingBottom: "0.5em" }}>Create New Homework</h1>
                        <form onSubmit={handleSubmit}>
                            <Stack direction="row" spacing={3} alignItems="flex-start">
                                <Box sx={{ flex: 1 }}>
                                    <Stack spacing={2}>
                                        <FormControl fullWidth>
                                            <InputLabel id="class-select-label">Class</InputLabel>
                                            <Select
                                                labelId="class-select-label"
                                                name="class_id"
                                                value={formData.class_id}
                                                onChange={handleChange}
                                                required
                                                variant="filled"
                                            >
                                                {classes.map((cls) => (
                                                    <MenuItem key={cls.id} value={cls.id}>
                                                        <span
                                                            style={{
                                                                display: "inline-block",
                                                                width: 12,
                                                                height: 12,
                                                                borderRadius: "50%",
                                                                backgroundColor: cls.color,
                                                                marginRight: 8,
                                                            }}
                                                        />
                                                        {cls.name}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>

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
}
