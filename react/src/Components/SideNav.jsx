import { Link } from "react-router-dom";

export default function SideNav() {
    return (
        <ul className="side-nav">
            <li className="nav-btn">
                <Link to="/">Home</Link>
            </li>
            <li className="nav-btn">
                <Link to="/Classes">Classes</Link>
            </li>
            <li className="nav-btn">
                <Link to="/Assignments">Assignments</Link>
            </li>
            <li className="nav-btn">
                <Link to="/Feedback">Feedback</Link>
            </li>
            <li className="nav-btn">
                <Link to="/Calendar">Calendar</Link>
            </li>
            <li className="nav-btn">
                <Link to="/Timetables">Timetables</Link>
            </li>
            <li className="nav-btn">
                <Link to="/Behaviour">Behaviour</Link>
            </li>
            <li className="nav-btn">
                <Link to="/Attendance">Attendance</Link>
            </li>
        </ul>
    );
}
            