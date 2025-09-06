export default function Schedule() {
    let dateNum = "17";
    let month = "July";
    let day = "Thursday";
    let dateWord = month.substring(0,3) + ", " + day.substring(0,3);
    let timeStart = "4";
    let timeEnd = "5:30pm";
    let period = timeStart + " - " + timeEnd;
    let activityDescription = "Work on CS NEA design section";
    // Variables need to be made dynamic
    return (
        <section className="schedule">
            <a href="#" className="h2"><h2>Schedule</h2></a>
            <ul className="schedule-list">
                <li className="schedule-item">
                    <p>{dateNum}</p>
                    <p>{dateWord}</p>
                    <div className="activity-type-colour"></div>
                    <p>{period}</p>
                    <p className="activity-description">{activityDescription}</p>
                </li>
            </ul>
        </section>
    );
}