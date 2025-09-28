import React, { useEffect, useState } from "react";

import notificationIcon from "../assets/notification-icon.png";
import settingsIcon from "../assets/settings-icon.png";
import fallback from "../assets/fallback.png";

export default function Header() {
    const [accountData, setAccountData] = useState("Student");

    useEffect(() => {
        fetch("/api/whoami")
            .then((res) => res.json())
            .then((json) => {
                const uuid = json.uuid;
                return fetch(`/api/people/${uuid}/about`);
            })
            .then((res) => res.json())
            .then((json) => {
                if (json.role) {
                    setAccountData(json);
                }
            })
            .catch((err) => console.error("Error fetching account type:", err));
    }, []);

    return (
        <header className="header">
            <a href="#"><h1>EduCore</h1></a>
            <section className="header-btns">
                <button type="button" className="rlv-btn-head">
                    <img
                        id="notification-btn"
                        src={notificationIcon}
                        alt="Notifications button"
                    />
                </button>
                <button type="button" className="rlv-btn-head">
                    <img id="settings-btn" src={settingsIcon} alt="Settings button" />
                </button>
                <button type="button">
                    <img id="pfp-btn" 
                    src={`/api/object/${accountData.profile_icon}`} 
                    alt="profile"
                    onError={(e) => {e.target.onerror = null; e.target.src = fallback; }}
                    />
                </button>
                <p id="account-type-text">| {accountData.firstname} {accountData.lastname} ({accountData.role})</p>
            </section>
        </header>
    );
}
