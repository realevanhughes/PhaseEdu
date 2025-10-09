import React from "react";
import { Box, Typography, LinearProgress, Paper, Stack } from "@mui/material";
import dayjs from "dayjs";

export default function AssignmentDueIndicator({ assignmentInfo }) {
    if (!assignmentInfo) return null;

    const { set_date, due_date_time, status } = assignmentInfo;

    const startDate = dayjs(set_date);
    const dueDate = dayjs(due_date_time);
    const today = dayjs();

    const totalDays = dueDate.diff(startDate, "day"); // total assignment duration
    const daysPassed = today.diff(startDate, "day"); // days passed since set date
    const daysLeft = dueDate.diff(today, "day"); // remaining days

    const progress = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);

    let color;
    if (daysLeft <= 0) color = "error.main";
    else if (daysLeft <= totalDays * 0.25) color = "warning.main";
    else color = "success.main";

    return (
        <Paper sx={{ padding: 2, width: "100%" }}>
            <Stack spacing={1}>
                <Typography variant="h6">Assignment Status: {status}</Typography>
                <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Set Date:</Typography>
                    <Typography variant="body2">{startDate.format("MMM D, YYYY, HH:mm")}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Due Date:</Typography>
                    <Typography variant="body2">{dueDate.format("MMM D, YYYY, HH:mm")}</Typography>
                </Box>
                <Box>
                    <Typography variant="body2" gutterBottom>
                        Days Left: {daysLeft >= 0 ? daysLeft : 0} day{daysLeft === 1 ? "" : "s"}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 10,
                            borderRadius: 5,
                            "& .MuiLinearProgress-bar": {
                                backgroundColor: color,
                            },
                        }}
                    />
                </Box>
            </Stack>
        </Paper>
    );
}
