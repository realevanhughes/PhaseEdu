import Schedule from "./Schedule";
import StudentSummary from "./StudentSummary";
import Classes from "./Classes";

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