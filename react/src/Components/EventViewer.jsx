import UserTooltip from "./UserTooltip.jsx";
import React from "react";

export default function EventDetails({ event }) {
    if (!event) {
        return (
            <div className="p-4 text-gray-500">
                Click on an event to see details
            </div>
        );
    }

    return (
        <div className="p-4 border rounded bg-white shadow w-80">
            <h2 className="text-lg font-bold mb-2 relative inline-block">
                {event.title}
                <span
                    style={{
                        display: 'block',
                        width: '300px',
                        height: '3px',
                        backgroundColor: event.resource.color,
                        marginTop: '4px',
                    }}
                />
            </h2>
            <p><b>Start:</b> {event.start.toString()}</p>
            <p><b>End:</b> {event.end.toString()}</p>
            {event.resource && (
                <>
                    <p><b>Class:</b> {event.resource.class_name}</p>
                    <p><b>Location:</b> {event.resource.location_name}</p>
                    <b>Creator: </b>
                    <UserTooltip uuid={event.resource.creator_uuid}>
                        <span className="user-tag" style={{"background-color": event.resource.creator_color}} onClick={() => (window.location = `/#/People/${event.resource.creator_uuid}`)}>{event.resource.creator_name}</span>
                    </UserTooltip>
                </>
            )}
        </div>
    );
}