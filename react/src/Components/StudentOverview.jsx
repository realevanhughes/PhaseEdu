import React, { useEffect, useState, useRef } from "react";
import fallback from "../assets/fallback.png";

const StudentOverviewDropdown = ({accountData}) => {
    let organisationName = "Bristol Free School";  /* needs to be made dynamic */

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
