import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Schedule() {
    const [htmlContent, setHtmlContent] = React.useState(
        ""
    );

    useEffect(() => {
        fetch('/api/events/upcoming')
            .then(response => response.json())
            .then(json => {
                let event_arr = json.events
                let add = ""
                for (let new_event of event_arr) {
                const eventDate = new Date(
                    Number(new_event.start_time.split(", ")[0].split("/")[2]),
                    Number(new_event.start_time.split(", ")[0].split("/")[1]) - 1,
                    Number(new_event.start_time.split(", ")[0].split("/")[0])
                );
                const now = new Date();
                const isToday =
                    eventDate.getDate() === now.getDate() &&
                    eventDate.getMonth() === now.getMonth() &&
                    eventDate.getFullYear() === now.getFullYear();

                let dayClass = isToday ? "today-circle" : "";

                    const {dayNum, monthName, weekday, timeRange} = formatEventTime(new_event.start_time, new_event.end_time);
                    let new_obj = `<li class="schedule-item">
                                        <p class="${dayClass}">${dayNum}</p>
                                        <p>${monthName}, ${weekday}</p>
                                        <div class="event-color" style="background-color: ${new_event.color};"></div>
                                        <p>${timeRange}</p>
                                        <p>${new_event.description} (${new_event.location})</p>
                                    </li>`
                    add = add + new_obj;
                }
                setHtmlContent(add);
            })
    }, []);

function formatEventTime(start_time, end_time) {
    const [startDate, startClock] = start_time.split(", ");
    const [endDate, endClock] = end_time.split(", ");

    const [sd, sm, sy] = startDate.split("/").map(Number);
    const [sh, smin] = startClock.split(":").map(Number);
    const [ed, em, ey] = endDate.split("/").map(Number);
    const [eh, emin] = endClock.split(":").map(Number);

    const start = new Date(sy, sm - 1, sd, sh, smin);
    const end = new Date(ey, em - 1, ed, eh, emin);

    const dayNum = start.getDate();
    const monthName = start.toLocaleString("default", { month: "short" });
    const weekday = start.toLocaleString("default", { weekday: "short" });

    const formatTime = (d) =>
    d.toLocaleTimeString([], { hour: "numeric", minute: undefined, hour12: true }).replace(" ", "");

    return {
        dayNum,
        monthName,
        weekday,
        timeRange: `${formatTime(start)} – ${formatTime(end)}`,
    };
}

    return (
        <section className="schedule">
            <Link to="/Calendar" className="h2"><h2>Schedule</h2></Link>
            <ul className="schedule-list" dangerouslySetInnerHTML={{ __html: htmlContent }}></ul>
        </section>
    );
}