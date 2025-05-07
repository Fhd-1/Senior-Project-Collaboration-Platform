import { useEffect, useState } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { useAuth } from "../contexts/authContext";
import DashboardLayout from "../layouts/DashboardLayout";
import styles from "./Notifications.module.css";
import { useNavigate } from "react-router-dom";

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setNotifications(snap.data().notifications || []);
      }
    };
    load();
  }, [user, db]);

  const removeNotification = async (notif) => {
    const ref = doc(db, "users", user.uid);
    const updated = notifications.filter((n) => n !== notif);
    await updateDoc(ref, { notifications: updated });
    setNotifications(updated);
  };

  const handleAccept = async (notif) => {
    const projectRef = doc(db, "projects", notif.projectId);
    await updateDoc(projectRef, {
      members: arrayUnion(user.uid),
    });

    await removeNotification(notif);
  };

  return (
    <DashboardLayout>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ←
          </button>
          <h2>Notifications</h2>
        </div>
        {notifications.length === 0 ? (
          <p>No notifications</p>
        ) : (
          notifications.map((notif, i) => (
            <div key={i} className={styles.card}>
              <p>
                You were invited to join <strong>{notif.projectName}</strong> by{" "}
                <strong>{notif.invitedBy}</strong>
              </p>
              <div className={styles.actions}>
                <button onClick={() => handleAccept(notif)}>Accept</button>
                <button onClick={() => removeNotification(notif)}>
                  Decline
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
