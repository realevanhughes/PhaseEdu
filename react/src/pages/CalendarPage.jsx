import UpcomingCalendar from "../Components/UpcomingCalendar.jsx";
export function CalendarPage() {
    return (
        <>
            <div className="page-layout">
                <main className="main-content">
                    <div className="calendar-container">
                        <h1>Calendar</h1>
                        <div style={{ display: 'flex' }}>
                            <UpcomingCalendar />
                        </div>
                    </div>
                </main>
            </div>
        </>
    );

}