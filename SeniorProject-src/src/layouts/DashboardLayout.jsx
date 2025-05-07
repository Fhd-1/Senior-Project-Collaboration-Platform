import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import styles from "./DashboardLayout.module.css";

export default function DashboardLayout({ children }) {
  return (
    <div className={styles.dashboard}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
