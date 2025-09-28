import SideNav from "./SideNav.jsx";
import SideNotes from "./SideNotes.jsx";

export default function SideBar() {
    return (
        <section className="side-bar">
            <SideNav/>
            <SideNotes/>
        </section>
    );
}