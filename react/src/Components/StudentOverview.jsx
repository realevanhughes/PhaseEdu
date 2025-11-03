import React, { useEffect, useState, useRef } from "react";
import fallback from "../assets/fallback.png";
import { useNavigate } from "react-router-dom";
import { Logout } from '@mui/icons-material';


const StudentOverviewDropdown = ({accountData, uuid}) => {
    const navigate = useNavigate();
    let organisationName = "Bristol Free School";  /* needs to be made dynamic */
    return (
        <div className="dropdown-menu">
                <div className="account-overview" onClick={() => navigate("/people/"+ uuid)}>
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
                <div className="account-logout" style={{ verticalAlign: "middle"}} onClick={() => (window.location.href = "/internal/logout")}>
                    <Logout style={{ verticalAlign: "middle", color: "#6b7280", paddingRight: "0.2em" }}/>
                    <p className="account-logout-text">Logout</p>
                </div>
        </div>
    );
}

export default StudentOverviewDropdown;
