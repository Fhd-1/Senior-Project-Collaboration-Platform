import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import {
  getAuth,
  updateProfile,
  updatePassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import DashboardLayout from "../layouts/DashboardLayout";
import styles from "./SettingsPage.module.css";

export default function SettingsPage() {
  const navigate = useNavigate();
  const db = getFirestore();
  const auth = getAuth();
  const user = auth.currentUser;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email] = useState(user.email);
  const [newPassword, setNewPassword] = useState("");
  const [notificationPrefs, setNotificationPrefs] = useState({
    invites: true,
    task: true,
  });

  useEffect(() => {
    const loadUserData = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setNotificationPrefs({
          invites: data.notifyInvites ?? true,
          task: data.notifyTask ?? true,
        });
      }
    };
    loadUserData();
  }, [user.uid, db]);

  const handleNameUpdate = async () => {
    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, { firstName, lastName });
    alert("Name updated successfully.");
  };

  const handlePasswordChange = async () => {
    if (!newPassword) return alert("Enter a new password.");
    try {
      await updatePassword(user, newPassword);
      alert("Password changed.");
      setNewPassword("");
    } catch (err) {
      alert("Error: You may need to re-authenticate.");
      console.error(err);
    }
  };

  const handlePrefToggle = async (field) => {
    const newPrefs = {
      ...notificationPrefs,
      [field]: !notificationPrefs[field],
    };
    setNotificationPrefs(newPrefs);
    await updateDoc(doc(db, "users", user.uid), {
      notifyInvites: newPrefs.invites,
      notifyTask: newPrefs.task,
    });
  };

  const handleDeleteAccount = async () => {
    const confirm = window.confirm(
      "Are you sure you want to permanently delete your account?"
    );
    if (!confirm) return;
    try {
      await deleteUser(user);
      alert("Account deleted.");
      navigate("/");
    } catch (err) {
      alert("Error deleting account. You may need to re-authenticate.");
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ←
          </button>
          <h2>Settings</h2>
        </div>

        <section className={styles.section}>
          <h3>Profile Information</h3>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
          />
          <input value={email} disabled />
          <button onClick={handleNameUpdate}>Update Name</button>
        </section>

        {user.providerData[0]?.providerId === "password" && (
          <section className={styles.section}>
            <h3>Account Security</h3>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button onClick={handlePasswordChange}>Change Password</button>
          </section>
        )}

        <section className={styles.danger}>
          <h3>Danger Zone</h3>
          <button onClick={handleDeleteAccount} className={styles.deleteBtn}>
            Delete My Account
          </button>
        </section>
      </div>
    </DashboardLayout>
  );
}
