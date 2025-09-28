import { HashRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import { AssignmentsPage } from "./pages/AssignmentsPage.jsx";
import { TimetablesPage } from "./pages/TimetablesPage.jsx";
import { FeedbackPage } from "./pages/FeedbackPage.jsx";
import { ClassesPage } from "./pages/ClassesPage.jsx";
import { CalendarPage } from "./pages/CalendarPage.jsx";
import { BehaviourPage } from "./pages/BehaviourPage.jsx";
import { AttendancePage } from "./pages/AttendancePage.jsx";
import { Layout } from "./Layout.jsx";

function App() {

    return (
        <Router>
            <Routes>
                <Route element={<Layout/>}>
                    <Route path="/" element={<HomePage />}/>
                    <Route path="/ClassesPage" element={<ClassesPage />}/>
                    <Route path="/AssignmentsPage" element={<AssignmentsPage />}/>
                    <Route path="/FeedbackPage" element={<FeedbackPage />}/>
                    <Route path="/CalendarPage" element={<CalendarPage />}/>
                    <Route path="/TimetablesPage" element={<TimetablesPage />}/>
                    <Route path="/BehaviourPage" element={<BehaviourPage />}/>
                    <Route path="/AttendancePage" element={<AttendancePage />}/>
                </Route>
            </Routes>
        </Router>
    )
}

export default App;