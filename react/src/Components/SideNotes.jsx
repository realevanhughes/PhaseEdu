import { ExpandMore, Add } from "@mui/icons-material";
import { useEffect, useState } from "react";

export default function SideBar() {
    const [notes, setNotes] = useState([]);

    useEffect(() => {
        fetch("/api/notes/all")
            .then((res) => res.json())
            .then((data) => {
                if (data.result === "success") setNotes(data.notes);
            })
            .catch((err) => console.error("Error fetching notes:", err));
    }, []);

    return (
        <nav className="side-notes">
            <a href="/app#/NewNote" className="notes-btn">
                <button type="button">
                    <Add style={{ verticalAlign: "bottom" }} /> New note
                </button>
            </a>

            <button type="button" className="notes-btn">
                PINNED
                <ExpandMore style={{ verticalAlign: "bottom" }} />
            </button>
            <div className="notes-list">
                <span className="notes muted">No pinned notes</span>
            </div>

            <button type="button" className="notes-btn">
                RECENT
                <ExpandMore style={{ verticalAlign: "bottom" }} />
            </button>
            <div className="notes-list">
                {notes.length > 0 ? (
                    notes.map((note) => (
                        <a
                            key={note.note_id}
                            href={`/app#/Notes/${note.note_id}`}
                            className="notes"
                            title={note.name}
                        >
                            {note.name || "Untitled Note"}
                        </a>
                    ))
                ) : (
                    <span className="notes muted">No recent notes</span>
                )}
            </div>
        </nav>
    );
}
