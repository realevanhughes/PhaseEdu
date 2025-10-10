import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export function UserPage() {
    const { uuid } = useParams();
    const [userInfo, setUserInfo] = useState(null);

    useEffect(() => {
        fetch(`/api/people/${uuid}/info`)
            .then((response) => response.json())
            .then((json) => {
                setUserInfo(json);
                console.log(json);
            });
    }, [uuid]);

    if (!userInfo) {
        return (
            <div className="page-layout">
                <main className="main-content">
                    <div style={{ width: "50em" }}>
                        <h1>Loading...</h1>
                        <CircularProgress />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="page-layout">
            <main className="main-content">
                <div
                    style={{
                        width: "50em",
                        padding: "2em",
                        borderRadius: "1em",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        background: "#fff",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5em" }}>
                        <img
                            src={`/api/object/${userInfo.profile_icon}` || "https://via.placeholder.com/120"}
                            alt={`${userInfo.username}'s profile`}
                            style={{
                                width: "120px",
                                height: "120px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                marginRight: "1.5em",
                            }}
                        />
                        <div>
                            <h1 style={{ margin: 0 }}>{(userInfo.firstname+" "+userInfo.lastname) || userInfo.username}</h1>
                            <p style={{ margin: "0.3em 0", color: "#555" }}>
                                {userInfo.pronouns ? `(${userInfo.pronouns})` : ""}
                            </p>
                            <p style={{ margin: "0.3em 0", fontWeight: "bold" }}>{userInfo.role}</p>
                            <p style={{ margin: "0.3em 0", color: "#777" }}>{userInfo.org}</p>
                        </div>
                    </div>

                    <div style={{ lineHeight: "1.8" }}>
                        <p>
                            <strong>Username:</strong> {userInfo.username}
                        </p>
                        <p>
                            <strong>Email:  </strong><a onClick={() => (window.location = `mailto:${userInfo.email}`)} className="email-tag">{userInfo.email}</a>
                        </p>
                        <p>
                            <strong >School Year:</strong> {userInfo.school_year}
                        </p>
                        <p>
                            <strong>Date Joined:</strong>{" "}
                            {new Date(userInfo.date_joined).toLocaleDateString()}
                        </p>
                        <p>
                            <strong>Account Restrictions:</strong>{" "}
                            {userInfo.special_action === 1
                                ? "Restricted"
                                : "None"}
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
