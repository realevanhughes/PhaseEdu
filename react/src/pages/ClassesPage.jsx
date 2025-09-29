import React, { useEffect, useState } from "react";
import UserTooltip from "../Components/UserTooltip";

export function ClassesPage() {
    const [classInfo, setClassInfo] = useState([]);

    useEffect(() => {
        fetch("/api/classes/list/detailed")
            .then((response) => response.json())
            .then((json) => {
                setClassInfo(json.list);
            });
    }, []);

    return (
        <div className="page-layout">
            <main className="main-content">
                <div style={{ width: "50em" }}>
                    <h1>Classes</h1>
                    <table
                        style={{ width: "100%", padding: "15px" }}
                        className="classes-box"
                    >
                        <thead>
                        <tr>
                            <th>Class</th>
                            <th>Subject</th>
                            <th>Teacher</th>
                            <th>Year Group</th>
                            <th>Room</th>
                        </tr>
                        </thead>
                        <tbody>
                        {classInfo.map((new_class) => (
                            <tr
                                key={new_class.class_id}
                                onClick={() =>
                                    (window.location = `/#/Classes/${new_class.class_id}`)
                                }
                                style={{ cursor: "pointer" }}
                            >
                                <td>{new_class.name}</td>
                                <td>{new_class.subject}</td>
                                <td>
                                    <UserTooltip uuid={new_class.teacher_uuid}>
                                        {new_class.teacher_name}
                                    </UserTooltip>
                                </td>
                                <td>{new_class.year_group}</td>
                                <td>{new_class.room_name}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
