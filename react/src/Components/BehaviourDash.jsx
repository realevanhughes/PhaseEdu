import React, { useMemo } from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";
import {Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend,} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);
import { AccessTime, Category, Class, Person } from '@mui/icons-material';

const PointsDashboard = ({ pointsData }) => {
    const stats = useMemo(() => {
        const totalPoints = pointsData.reduce((sum, p) => sum + p.value, 0);
        const classesCount = {};
        const categoriesCount = {};
        const assigneesCount = {};
        const pointsOverTime = {};

        pointsData.forEach((p) => {
            classesCount[p.class_name] = (classesCount[p.class_name] || 0) + p.value;
            categoriesCount[p.category_name] =
                (categoriesCount[p.category_name] || 0) + p.value;
            assigneesCount[p.assignee_name] =
                (assigneesCount[p.assignee_name] || 0) + p.value;
            const month = new Date(p.date_time).toLocaleString("default", {
                month: "short",
                year: "numeric",
            });
            pointsOverTime[month] = (pointsOverTime[month] || 0) + p.value;
        });

        return {
            totalPoints,
            classesCount,
            categoriesCount,
            assigneesCount,
            pointsOverTime,
        };
    }, [pointsData]);

    const classData = {
        labels: Object.keys(stats.classesCount),
        datasets: [
            {
                label: "Points",
                data: Object.values(stats.classesCount),
                backgroundColor: "#4caf50",
            },
        ],
    };

    const categoryData = {
        labels: Object.keys(stats.categoriesCount),
        datasets: [
            {
                labels: Object.keys(stats.categoriesCount),
                data: Object.values(stats.categoriesCount),
                backgroundColor: [
                    "#ff6384",
                    "#36a2eb",
                    "#ffce56",
                    "#8e44ad",
                    "#2ecc71",
                ],
            },
        ],
    };

    const assigneeData = {
        labels: Object.keys(stats.assigneesCount),
        datasets: [
            {
                label: "Points",
                data: Object.values(stats.assigneesCount),
                backgroundColor: "#f39c12",
            },
        ],
    };

    const timeData = {
        labels: Object.keys(stats.pointsOverTime).sort(
            (a, b) => new Date(a) - new Date(b)
        ),
        datasets: [
            {
                label: "Points",
                data: Object.keys(stats.pointsOverTime)
                    .sort((a, b) => new Date(a) - new Date(b))
                    .map((k) => stats.pointsOverTime[k]),
                borderColor: "#2196f3",
                backgroundColor: "#2196f3",
                tension: 0.3,
            },
        ],
    };

    return (
        <>
            <section className="stats-container1">
                {/* Point total */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Total Points</Typography>
                    <Typography variant="h4">{stats.totalPoints}</Typography>
                </Paper>

                {/* Top Class */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Top Class</Typography>
                    <Typography variant="h5">
                        {Object.entries(stats.classesCount).sort(
                            (a, b) => b[1] - a[1]
                        )[0]?.[0] || "N/A"}
                    </Typography>
                </Paper>

                {/* Top Assignee */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6">Top Assignee</Typography>
                    <Typography variant="h5">
                        {Object.entries(stats.assigneesCount).sort(
                            (a, b) => b[1] - a[1]
                        )[0]?.[0] || "N/A"}
                    </Typography>
                </Paper>
            </section>
            
            {/* Points per category */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" mb={2}>
                    <Category className="vertical-center"></Category>
                    <spacer type="horizontal" width="800" height="10"> </spacer>
                    Points per Category
                </Typography>
                <Pie data={categoryData} />
            </Paper>

            
            <section className="stats-container2">
                {/* Points per class */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" mb={2}>
                        <Class className="vertical-center"></Class>
                        <spacer type="horizontal" width="800" height="10"> </spacer>
                        Points per Class
                    </Typography>
                    <Bar data={classData} />
                </Paper>
                
                {/* Points per assignee */}
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" mb={2}>
                        <Person className="vertical-center"></Person>
                        <spacer type="horizontal" width="800" height="10"> </spacer>
                        Points per Assignee
                    </Typography>
                    <Bar data={assigneeData} />
                </Paper>
            </section>
            
            {/* Points over time */}
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" mb={2}>
                    <AccessTime className="vertical-center"></AccessTime>
                    <spacer type="horizontal" width="800" height="10"> </spacer>
                    Points Over Time
                </Typography>
                <Line data={timeData} />
            </Paper>
        </>
    );
};

export default PointsDashboard;
