import React, { useState } from "react";

export default function NewEventForm({ event, onSave, onCancel }) {
    const [title, setTitle] = useState(event?.title || "");
    const [location, setLocation] = useState(event?.resource?.location || "");
    const [classId, setClassId] = useState(event?.resource?.class || "");

    const handleSubmit = (e) => {
        e.preventDefault();

        const newEvent = {
            ...event,
            title,
            resource: {
                ...event.resource,
                location,
                class: classId,
            },
        };

        onSave(newEvent);
    };

    return (
        <form
            className="p-4 border rounded bg-white shadow w-80 flex flex-col gap-3"
            onSubmit={handleSubmit}
        >
            <h2 className="text-lg font-bold">Create New Event</h2>

            <label className="flex flex-col">
                <span className="text-sm font-medium">Title</span>
                <input
                    type="text"
                    className="border p-2 rounded"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </label>

            <label className="flex flex-col">
                <span className="text-sm font-medium">Location</span>
                <input
                    type="text"
                    className="border p-2 rounded"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </label>

            <label className="flex flex-col">
                <span className="text-sm font-medium">Class ID</span>
                <input
                    type="text"
                    className="border p-2 rounded"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                />
            </label>

            <div className="flex gap-2 mt-3">
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Save
                </button>
                <button
                    type="button"
                    className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    onClick={onCancel}
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}
