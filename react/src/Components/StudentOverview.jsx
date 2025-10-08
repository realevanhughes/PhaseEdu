import React, { useEffect, useState, useRef } from "react";
import fallback from "../assets/fallback.png";

const StudentOverviewDropdown = () => {
    const [accountData, setAccountData] = useState({"username":"Loading","firstname":"Loading","lastname":"Loading","email":"Loading","role":"student","profile_icon":"EkT1S2Ss2z2iTXHMPHYH","pronouns":"They/Them","result":"success"});
    let organisationName = "Bristol Free School";  /* needs to be made dynamic */

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

    return (
        <div className="dropdown-menu">
            <div className="account-overview">
                <button type="button">
                    <img id="pfp-btn"
                        src={`/api/object/${accountData.profile_icon}`}
                        alt="profile"
                        onError={(e) => { e.target.onerror = null; e.target.src = fallback; }}
                    />
                </button>
                <div className="user-info">
                    <p className="user-name">{accountData.firstname} {accountData.lastname}</p>
                    <p className="user-email">{accountData.email}</p>
                    <p className="organisation-name">{organisationName}</p>
                </div>
            </div>
        </div>
    );
}

export default StudentOverviewDropdown;
