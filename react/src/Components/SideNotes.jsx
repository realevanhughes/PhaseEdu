import { ExpandMore } from "@mui/icons-material";

export default function SideBar() {
    return (
        <nav className="side-notes">
            <button type="button" className="notes-btn">PINNED<ExpandMore style={{ verticalAlign: "bottom"}}/></button>
            <a href="#" alt="placeholder" className="notes">placeholder notes</a>
            <button type="button" className="notes-btn">RECENT<ExpandMore style={{ verticalAlign: "bottom"}} /></button>
            <a href="#" alt="placeholder" className="notes">placeholder notes</a>
        </nav>
    );
}   
