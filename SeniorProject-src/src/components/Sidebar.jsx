import { Link, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const location = useLocation();
  const isInProject = location.pathname.startsWith("/project/");
  const projectId = location.pathname.split("/")[2]; // grabs :projectId

  const topLinks = [
    { label: "Notifications", path: "/notifications" },
    { label: "Projects", path: "/dashboard" },
    { label: "Tasks", path: "/tasks" },
  ];

  const settingsLink = { label: "Settings", path: "/settings" };

  const projectLinks = [
    { label: "Chat", path: `/project/${projectId}/chat` },
    { label: "Calls", path: `/project/${projectId}/calls` },
    { label: "Files", path: `/project/${projectId}/files` },
  ];

  return (
    <aside className={styles.sidebar}>
      <div>
        <h1 className={styles.logo}>Collab</h1>
        <ul className={styles.nav}>
          {topLinks.map(({ label, path }) => (
            <li key={label}>
              <Link to={path} className={styles.link}>
                {label}
              </Link>
            </li>
          ))}

          {isInProject &&
            projectLinks.map(({ label, path }) => (
              <li key={label}>
                <Link to={path} className={styles.link}>
                  {label}
                </Link>
              </li>
            ))}

          {/* Now add Settings last, visually aligned */}
          <li>
            <Link to="/settings" className={styles.link}>
              Settings
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
