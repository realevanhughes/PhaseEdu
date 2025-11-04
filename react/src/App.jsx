import { HashRouter as Router, Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import { AssignmentsPage } from "./pages/AssignmentsPage.jsx";
import { TimetablesPage } from "./pages/TimetablesPage.jsx";
import { FeedbackPage } from "./pages/FeedbackPage.jsx";
import { ClassesPage } from "./pages/ClassesPage.jsx";
import { CalendarPage } from "./pages/CalendarPage.jsx";
import { BehaviourPage } from "./pages/BehaviourPage.jsx";
import { AttendancePage } from "./pages/AttendancePage.jsx";
import ClassPage from "./pages/ClassPage.jsx";
import {UserPage} from "./pages/UserPage.jsx";
import { Layout } from "./Layout.jsx";
import {AssignmentPage} from "./pages/AssignmentPage.jsx";
import {Document} from "./pages/DocumentViewer.jsx"
import CreateHomework from "./pages/NewHomeworkPage.jsx"
import NewNotePage from "./pages/NewNotePage.jsx"
import NotePage from "./pages/NotePage.jsx"

function App() {

    return (
        <Router>
            <Routes>
                <Route element={<Layout/>}>
                    <Route path="/" element={<HomePage />}/>
                    <Route path="/Classes" element={<ClassesPage />}/>
                    <Route path="/Assignments" element={<AssignmentsPage />}/>
                    <Route path="/Feedback" element={<FeedbackPage />}/>
                    <Route path="/Calendar" element={<CalendarPage />}/>
                    <Route path="/Timetables" element={<TimetablesPage />}/>
                    <Route path="/Behaviour" element={<BehaviourPage />}/>
                    <Route path="/Attendance" element={<AttendancePage />}/>
                    <Route path="/Classes/:cid" element={<ClassPage />}/>
                    <Route path="/People/:uuid" element={<UserPage />}/>
                    <Route path="/Assignments/:hw_id" element={<AssignmentPage />}/>
                    <Route path="/Document/:oid" element={<Document />}/>
                    <Route path="/NewAssignment/" element={<CreateHomework />}/>
                    <Route path="/NewNote" element={<NewNotePage />}/>
                    <Route path="/Notes/:note_id" element={<NotePage />}/>
                </Route>
            </Routes>
        </Router>
    )
}

export default App;