import { useParams } from "react-router-dom";
import Paper from "@mui/material/Paper";
import React, { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import UserTooltip from "../Components/UserTooltip.jsx";

export function Document() {
    const { oid } = useParams();
    const [objectInfo, setObjectInfo] = useState(null);
    const fileUrl = `/api/object/${oid}`;

    useEffect(() => {
        fetch(`/api/object/item/${oid}/info`)
            .then((response) => response.json())
            .then((json) => {
                setObjectInfo(json.info);
            });
    }, [oid]);

    if (!objectInfo) {
        return (
            <div className="page-layout">
                <main className="main-content">
                    <div style={{ width: "50em" }}>
                        <h1>File info</h1>
                        <p>Loading...</p>
                    </div>
                </main>
            </div>
        );
    }

    const ext = objectInfo.file_extension?.toLowerCase();
    let content;

    if (["pdf"].includes(ext)) {
        content = (
            <iframe
                src={fileUrl}
                style={{ width: "100%", height: "100%", border: "none" }}
                title="PDF viewer"
            />
        );
    }
    else if (["png", "jpg", "jpeg", "gif", "bmp", "webp"].includes(ext)) {
        content = (
            <img
                src={fileUrl}
                alt={objectInfo.name}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
        );
    }
    else if (["mp3", "wav", "ogg", "m4a", "flac"].includes(ext)) {
        content = (
            <audio
                controls
                style={{ width: "100%" }}
            >
                <source src={fileUrl} type={`audio/${ext}`} />
                Your browser does not support the audio element.
            </audio>
        );
    }
    else if (["mp4", "webm", "mov", "avi", "mkv", "ogg"].includes(ext)) {
        content = (
            <video
                controls
                style={{ width: "100%", height: "100%", backgroundColor: "black" }}
            >
                <source src={fileUrl} type={`video/${ext === "mkv" ? "mp4" : ext}`} />
                Your browser does not support the video tag.
            </video>
        );
    }
    else {
        content = (
            <iframe
                src={fileUrl}
                style={{ width: "100%", height: "100%", border: "none" }}
                title="Document viewer"
            />
        );
    }

    return (
        <div className="page-layout">
            <main className="main-content">
                <div className="container">
                    <div style={{ paddingBottom: "1em" }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                            <h1>{objectInfo.name}.{objectInfo.file_extension}</h1>
                            <UserTooltip uuid={objectInfo.owner}>
                                <span
                                    className="user-tag"
                                    style={{ backgroundColor: objectInfo.owner_color }}
                                    onClick={() => (window.location = `/#/People/${objectInfo.owner}`)}
                                >
                                    {objectInfo.owner_name}
                                </span>
                            </UserTooltip>
                            <p>({objectInfo.description})</p>
                        </Stack>
                    </div>

                    <Paper sx={{ p: 1 }} className="md-div">
                        <div className="md-div" style={{ width: "100%", height: "77vh" }}>
                            {content}
                        </div>
                    </Paper>
                </div>
            </main>
        </div>
    );
}
