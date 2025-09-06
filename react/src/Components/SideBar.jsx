import SideNav from "./SideNav"
import SideNotes from "./SideNotes.jsx"

export default function SideBar() {
    return (
        <section className="side-bar">
            <SideNav/>
            <SideNotes/>
        </section>
    );
}