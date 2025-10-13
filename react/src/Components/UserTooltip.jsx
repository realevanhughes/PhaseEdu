import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const UserTooltip = ({ uuid, children }) => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef();

    useEffect(() => {
        if (visible && !userData) {
            setLoading(true);
            fetch(`/api/people/${uuid}/about`)
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch user data");
                    return res.json();
                })
                .then((data) => setUserData(data))
                .catch((err) => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [visible, uuid, userData]);

    useEffect(() => {
        if (visible && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const tooltipWidth = 250;
            const tooltipHeight = 200;

            let top = rect.bottom + window.scrollY + 6; // below element
            let left = rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2;

            if (left < 4) left = 4;
            if (left + tooltipWidth > window.innerWidth - 4)
                left = window.innerWidth - tooltipWidth - 4;

            if (top + tooltipHeight > window.innerHeight + window.scrollY)
                top = rect.top + window.scrollY - tooltipHeight - 6;

            setPosition({ top, left });
        }
    }, [visible]);

    const tooltipContent = (
        <div
            style={{
                position: "absolute",
                top: position.top,
                left: position.left,
                backgroundColor: "#fff",
                color: "#000",
                padding: "12px",
                borderRadius: "8px",
                whiteSpace: "normal",
                zIndex: 9999,
                boxShadow: "0px 4px 16px rgba(0,0,0,0.25)",
                width: "250px",
                pointerEvents: "none",
            }}
        >
            {loading ? (
                "Loading..."
            ) : userData ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {userData.profile_icon && (
                        <img
                            src={`/api/object/${userData.profile_icon}`}
                            alt={userData.username}
                            style={{
                                width: "80px",
                                height: "80px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                alignSelf: "center",
                            }}
                        />
                    )}
                    <div style={{ fontWeight: "bold", textAlign: "center" }}>
                        {userData.firstname} {userData.lastname}
                    </div>
                    {userData.pronouns && (
                        <div style={{ fontStyle: "italic", textAlign: "center" }}>
                            {userData.pronouns}
                        </div>
                    )}
                    {userData.role && (
                        <div style={{ textAlign: "center" }}>{userData.role}</div>
                    )}
                    {userData.email && (
                        <div
                            style={{
                                textAlign: "center",
                                fontSize: "13px",
                                wordBreak: "break-word",
                            }}
                        >
                            {userData.email}
                        </div>
                    )}
                </div>
            ) : (
                "No data"
            )}
        </div>
    );

    return (
        <>
      <span
          ref={triggerRef}
          style={{ position: "relative", display: "inline-block", cursor: "pointer" }}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
      >
        {children}
      </span>
            {visible && createPortal(tooltipContent, document.body)}
        </>
    );
};

export default UserTooltip;
