export default function Classes() {
    let subjectName = "Computer Science"; // Variables need to be made dynamic
    return (
        <section className="classes">
            <a href="#" className="h2"><h2>Classes</h2></a>
            <ul className="classes-list">
                <li className="class">
                    <a href="#">{subjectName}</a>
                </li>
            </ul>
        </section>
    );
}