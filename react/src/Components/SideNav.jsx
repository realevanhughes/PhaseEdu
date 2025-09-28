import { Link } from "react-router-dom";

export default function SideNav() {
    return (
        <ul className="side-nav">
            <li className="nav-btn">
                <Link to="/">Home</Link>
            </li>
            <li className="nav-btn">
                <Link to="/ClassesPage">Classes</Link>
            </li>
            <li className="nav-btn">
                <Link to="/AssignmentsPage">Assignments</Link>
            </li>
            <li className="nav-btn">
                <Link to="/FeedbackPage">Feedback</Link>
            </li>
            <li className="nav-btn">
                <Link to="/CalendarPage">Calendar</Link>
            </li>
            <li className="nav-btn">
                <Link to="/TimetablesPage">Timetables</Link>
            </li>
            <li className="nav-btn">
                <Link to="/BehaviourPage">Behaviour</Link>
            </li>
            <li className="nav-btn">
                <Link to="/AttendancePage">Attendance</Link>
            </li>
        </ul>
    );
}
            