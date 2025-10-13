import { Link, useLocation } from "react-router-dom";
import { ChevronRight, DoubleArrow, ArrowRight } from "@mui/icons-material";
import { useState } from "react";

export default function SideNav() {
    const location = useLocation();
    const [hovered, setHovered] = useState(null);

    const navItems = [
        { path: "/", label: "Home" },
        { path: "/Classes", label: "Classes" },
        {
            path: "/Assignments",
            label: "Assignments",
            related: ["/NewAssignment"],
        },
        { path: "/Feedback", label: "Feedback" },
        { path: "/Calendar", label: "Calendar" },
        { path: "/Timetables", label: "Timetables" },
        { path: "/Behaviour", label: "Behaviour" },
        { path: "/Attendance", label: "Attendance" },
    ];

    return (
        <ul className="side-nav">
            {navItems.map((item) => {
                const current = location.pathname;
                const isActive = current === item.path;
                const isSubpage =
                    current.startsWith(item.path + "/") && current !== item.path;
                const isRelated =
                    item.related?.some((r) => current.startsWith(r)) || false;
                const isHovered = hovered === item.path;

                return (
                    <li
                        key={item.path}
                        className={`nav-btn ${
                            isActive || isSubpage || isRelated ? "active" : ""
                        } transition-all`}
                        onMouseEnter={() => setHovered(item.path)}
                        onMouseLeave={() => setHovered(null)}
                    >
                        <Link
                            to={item.path}
                            className="flex justify-between items-center w-full"
                        >
                            <span>{item.label}</span>

                            {isSubpage || isRelated ? (
                                <DoubleArrow
                                    fontSize="small"
                                    style={{ verticalAlign: "middle", color: "#6b7280" }}
                                />
                            ) : isActive ? (
                                <ChevronRight
                                    fontSize="small"
                                    style={{ verticalAlign: "middle", color: "#6b7280" }}
                                />
                            ) : isHovered ? (
                                <ArrowRight
                                    fontSize="small"
                                    style={{ verticalAlign: "middle", color: "#9ca3af" }}
                                />
                            ) : null}
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
