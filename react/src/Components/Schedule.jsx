import React, { useEffect, useState } from "react";

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
                    let new_obj = `<li className="schedule-item">
                                        <div style="background-color: ${new_event.color}; border-radius: 15px; padding: 5px;">
                                            <p>${new_event.start_time} - ${new_event.end_time}</p>
                                            <p>${new_event.description} (${new_event.location})</p>
                                        </div>
                                    </li>`
                    add = add + new_obj;
                }
                setHtmlContent(add);
            })
    }, []);

    return (
        <section className="schedule">
            <a href="#" className="h2"><h2>Schedule</h2></a>
            <ul className="schedule-list" dangerouslySetInnerHTML={{ __html: htmlContent }}></ul>
        </section>
    );
}