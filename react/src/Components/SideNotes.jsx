import downArrow from "../assets/down-arrow.png";

export default function SideBar() {
    return (
        <nav className="side-notes">
            <button type="button" className="notes-btn">PINNED<img src={downArrow} /></button>
            <a href="#" alt="placeholder" className="notes">placeholder notes</a>
            <button type="button" className="notes-btn">RECENT<img src={downArrow} /></button>
            <a href="#" alt="placeholder" className="notes">placeholder notes</a>
        </nav>
    );
}   
