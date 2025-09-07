import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';

import { Doughnut } from 'react-chartjs-2';
import React, { useEffect, useState } from "react";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

export default function StudentSummary() {
    const [behaviourData, setBehaviourData] = useState({
        labels: ['Loading...'],
        datasets: [{
            data: [0],
            backgroundColor: [
                'rgba(65, 204, 0, 0.8)',
                'rgba(255, 0, 0, 0.5)',
            ],
            borderColor: ['rgba(113, 206, 70)', 'rgba(255, 0, 0, 0.6)']
        }]
    });

    const [pointData, setPointData] = useState({
        labels: ['Loading...'],
        datasets: [{
            data: [0],
            backgroundColor: [
                'rgba(65, 204, 0, 0.8)',
                'rgba(255, 0, 0, 0.5)',
                'rgba(0,230,255,0.5)',
            ],
            borderColor: ['rgba(113, 206, 70)', 'rgba(255, 0, 0, 0.6)', 'rgba(0,230,255,0.77)']
        }]
    });

    const [attendanceData, setAttendanceData] = useState({
        labels: ['Loading...'],
        datasets: [{
            data: [0],
            backgroundColor: [
                'rgba(65, 204, 0, 0.8)',
                'rgba(255, 0, 0, 0.5)',
                'rgba(0,230,255,0.5)',
            ],
            borderColor: ['rgba(113, 206, 70)', 'rgba(255, 0, 0, 0.6)', 'rgba(0,230,255,0.77)']
        }]
    });

    useEffect(() => {
        fetch('/api/points/polarity')
            .then(response => response.json())
            .then(json => {
                console.log(json);
                setBehaviourData({
                    labels: ["Good", "Bad"],
                    datasets: [{
                        data: json.contents,
                        backgroundColor: [
                            'rgba(65, 204, 0, 0.8)',
                            'rgba(255, 0, 0, 0.5)',
                        ],
                        borderColor: ['rgba(113, 206, 70)', 'rgba(255, 0, 0, 0.6)']
                    }]
                });
            });

        fetch('/api/points/dict')
            .then(response => response.json())
            .then(json => {
                console.log(json);
                setPointData({
                    labels: json.cat_names,
                    datasets: [{
                        data: json.points,
                        backgroundColor: [
                            'rgba(156,0,204,0.8)',
                            'rgba(255,106,0,0.77)',
                            'rgba(0,230,255,0.5)',
                        ],
                        borderColor: ['rgba(156,0,204,0.95)', 'rgba(255,106,0,0.95)', 'rgba(0,230,255,0.77)']
                    }]
                });
            });
        fetch('/api/presence/count')
            .then(response => response.json())
            .then(json => {
                console.log(json);
                setAttendanceData({
                    labels: json.status_types,
                    datasets: [{
                        data: json.count,
                        backgroundColor: [
                            'rgba(65, 204, 0, 0.8)',
                            'rgba(255, 0, 0, 0.5)',
                            'rgba(0,230,255,0.5)',
                        ],
                        borderColor: ['rgba(113, 206, 70)', 'rgba(255, 0, 0, 0.6)', 'rgba(0,230,255,0.77)']
                    }]
                });
            });
    }, []);

    const behaviourOptions = {
        cutout: '75%',
    };
    const pointOptions = {
        cutout: '75%',
    };
    const attendanceOptions = {
        cutout: '75%',
    };

    return (
        <section className="student-summary">
            <a href="#" className="h2"><h2>Behaviour</h2></a>
            <a href="#" className="h2"><h2>Points</h2></a>
            <a href="#" className="h2"><h2>Attendance</h2></a>

            <div className="donught-chart" id="behaviour-chart" style={{ width: "200px", height: "200px" }}>
                <Doughnut
                    data={behaviourData}
                    options={behaviourOptions}
                />
            </div>

            <div className="donught-chart" id="point-chart" style={{ width: "200px", height: "200px" }}>
                <Doughnut
                    data={pointData}
                    options={pointOptions}
                />
            </div>

            <div className="donught-chart" id="attendance-chart" style={{ width: "200px", height: "200px" }}>
                <Doughnut
                    data={attendanceData}
                    options={attendanceOptions}
                />
            </div>
        </section>
    );
}
