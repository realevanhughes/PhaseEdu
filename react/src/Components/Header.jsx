import React, { useEffect, useState, useRef } from "react";
import StudentOverviewDropdown from "./StudentOverview"
import SineWaveHover from "./SineWaveHover"
import { Settings, Notifications } from '@mui/icons-material';
import fallback from "../assets/fallback.png";
import logo from "../assets/waves800.png";

export default function Header() {
    const [accountData, setAccountData] = useState({"username":"Loading","firstname":"Loading","lastname":"Loading","email":"Loading","role":"student","profile_icon":"EkT1S2Ss2z2iTXHMPHYH","pronouns":"They/Them","result":"success"});

    useEffect(() => {
        fetch("/api/whoami")
            .then((res) => res.json())
            .then((json) => {
                const uuid = json.uuid;
                return fetch(`/api/people/${uuid}/about`);
            })
            .then((res) => res.json())
            .then((json) => {
                setAccountData(json);
            })
            .catch((err) => console.error("Error fetching account type:", err));
    }, []);

    
    const [isDropdownVisible, setDropdownVisible] = useState(false);
    const hideTimeout = useRef(null);
    const handleMouseEnter = () => {
        if (hideTimeout.current) {
            clearTimeout(hideTimeout.current);
        }
        setDropdownVisible(true);
    };

    const handleMouseLeave = () => {
        hideTimeout.current = setTimeout(() => {
            setDropdownVisible(false);
        }, 250);
    };

    return (
        <header className="header">
            <div style={{ display: "flex", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", marginRight: "0.5em" }}>
                    <h1
                        style={{
                            margin: 0,
                            fontFamily: "'Source Code Pro', monospace",
                            fontWeight: 700,
                            fontSize: "1.5em",
                            color: "inherit",
                            lineHeight: "1em",
                        }}
                    >
                        Phase
                    </h1>
                    <span
                        style={{
                            fontFamily: "'Source Code Pro', monospace",
                            fontSize: "0.65em",
                            color: "inherit",
                            opacity: 0.8,
                        }}
                    >
                      education
                    </span>
                </div>
                <SineWaveHover />
            </div>


            <section className="header-btns">
            <button type="button" className="rlv-btn-head">
                    <Notifications style={{width:'1.5em', height:'1.5em'}} />
                </button>
                <button type="button" className="rlv-btn-head">
                    <Settings style={{width:'1.5em', height:'1.5em'}}/>
                </button>

                <div
                    className="menu"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <button type="button">
                        <img id="pfp-btn"
                            src={`/api/object/${accountData.profile_icon}`}
                            alt="profile"
                            onError={(e) => { e.target.onerror = null; e.target.src = fallback; }}
                        />
                    </button>

                    {isDropdownVisible && <StudentOverviewDropdown accountData={accountData} />}
                </div>
                
                <p id="account-type-text">| {accountData.firstname} {accountData.lastname} ({accountData.role})</p>
            </section>
        </header>
    );
}
