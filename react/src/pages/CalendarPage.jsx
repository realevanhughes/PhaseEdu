import UpcomingCalendar from "../Components/UpcomingCalendar.jsx";
export function CalendarPage() {
    return (
        <>
            <div className="page-layout">
                <main className="main-content">
                    <div>
                        <h1>Calendar</h1>
                        <UpcomingCalendar />
                    </div>
                </main>
            </div>
        </>
    );

}