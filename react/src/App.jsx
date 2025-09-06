import React from "react";
import { createRoot } from "react-dom/client";

import Header from "./Components/Header.jsx";
import Main from "./Components/Main.jsx";
import SideBar from "./Components/SideBar.jsx";


const root = createRoot(document.getElementById("root"));
root.render (
    <>
        <Header/>
        <div className="page-layout">
            <SideBar/>
            <Main/>
        </div>
    </>
);