import Schedule from "./Schedule.jsx";
import StudentSummary from "./StudentSummary.jsx";
import Classes from "./Classes.jsx";

export default function Main() {
    return (
        <main className="main-content">
            <div className="left-side-dashboard">
                <StudentSummary/>
                <Schedule/>
            </div>
            <Classes/>
        </main>
    );
}