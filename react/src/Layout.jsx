import SideBar from "./Components/SideBar.jsx";
import Header from "./Components/Header.jsx";
import { Outlet } from "react-router-dom";

export function Layout() {
    return (
        <>
            <SideBar/>
            <Header/>
            <main>
                <Outlet/>
            </main>
        </>
    );
}