import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage";
import Dashboard from "./pages/Dashboard";
import PrivateRoute from "./routes/PrivateRoute";
import { useAuth } from "./contexts/authContext";
import ProjectPage from "./pages/ProjectPage";
import NotificationsPage from "./pages/Notifications";
import TasksPage from "./pages/Tasks";
import ChatPage from "./pages/ChatPage";
import FilesPage from "./pages/FilesPage";
import CallsPage from "./pages/CallsPage";
import SettingsPage from "./pages/SettingsPage";
import ChatListPage from "./pages/ChatListPage";

function App() {
  const { loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<WelcomePage />} />
        <Route
          path="/project/:projectId"
          element={
            <PrivateRoute>
              <ProjectPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <PrivateRoute>
              <NotificationsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <TasksPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/project/:projectId/files"
          element={
            <PrivateRoute>
              <FilesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/project/:projectId/calls"
          element={
            <PrivateRoute>
              <CallsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/project/:projectId/chat"
          element={
            <PrivateRoute>
              <ChatListPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/project/:projectId/chat/:chatId"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
