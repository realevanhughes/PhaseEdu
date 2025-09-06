// Notification image needs to change to notification-icon-ping.png when there are new notifications

import notificationIcon from "../assets/notification-icon.png";
import settingsIcon from "../assets/settings-icon.png";
import profilePicture from "../assets/profile-picture.png";

export default function Header() {
    const ACCOUNT_TYPE = "Student"; // Needs to be made dynamic
    return (
        <header className="header">
            <a href="#"><h1>EduCore</h1></a>
            <section className="header-btns">
                <button type="button" className="rlv-btn-head"><img id="notification-btn" src={notificationIcon} alt="Notifications button-- no new notifications" /></button>
                <button type="button" className="rlv-btn-head"><img id="settings-btn" src={settingsIcon} alt="Settings button" /></button>
                <button type="button"><img id="pfp-btn" src={profilePicture} alt="User profile picture" /></button>
                <p id="account-type-text">| {ACCOUNT_TYPE}  </p>
            </section>
        </header>
    );
}
