import React, { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import EventViewer from "./EventViewer.jsx";
import NewEventForm from "./NewEventForm";

import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

export default function UpcomingCalendar() {
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch("/api/events/all");
                if (!res.ok) throw new Error("Failed to fetch events");
                let data = await res.json();
                data = data.contents
                console.log("raw", data)

                const formatted = data.map((event) => ({
                    id: event.id || event.event_id,
                    title: event.title || event.description,
                    start: new Date(event.start),
                    end: new Date(event.end),
                    allDay: event.allDay || false,
                    resource: event.resource || {
                        class: event.class_name,
                        location: event.location_name,
                        color: event.color,
                        creator_uuid: event.creator_name,
                    },
                }));
                console.log("form", formatted);
                setEvents(formatted);
                console.log(events.map(e => ({
                    title: e.title,
                    startType: typeof e.start,
                    isDate: e.start instanceof Date,
                    endType: typeof e.end,
                    isDateEnd: e.end instanceof Date
                })));

            } catch (err) {
                console.error("Error fetching events:", err);
            }
        }
        fetchEvents();
    }, []);

    return (
        <>
            <div style={{ height: "70vh", width: "45em", paddingTop: "0.5em", paddingRight: "1em" }}>
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: "100%", background: "white", borderRadius: "1rem", boxShadow: "0 2px 8px rgba(0,0,0,0.07)" }}
                    onSelectEvent={(event) => setSelectedEvent(event)}
                    eventPropGetter={(event) => ({
                        style: {
                            backgroundColor: event.resource?.color || "#3174ad",
                            borderRadius: "8px",
                            color: "white",
                            border: "none",
                            padding: "2px 6px",
                            fontWeight: 500,
                            fontFamily: "Inter, sans-serif",
                        },
                    })}
                />
            </div>
            <div style={{ flex: 1 }}>
                {selectedEvent?.resource?.createdByClient ? (
                    <NewEventForm
                        event={selectedEvent}
                        onSave={(newEvent) => {
                            setEvents((prev) =>
                                prev.map((e) =>
                                    e.id === newEvent.id ? newEvent : e
                                )
                            );
                            setSelectedEvent(newEvent);
                        }}
                        onCancel={() => {
                            setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id));
                            setSelectedEvent(null);
                        }}
                    />
                ) : (
                    <EventViewer event={selectedEvent} />
                )}
            </div>
        </>
    );
}
