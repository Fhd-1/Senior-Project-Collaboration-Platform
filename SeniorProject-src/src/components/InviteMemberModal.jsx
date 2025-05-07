import { useState } from "react";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
} from "firebase/firestore";
import styles from "./InviteMemberModal.module.css";

export default function InviteMemberModal({
  onClose,
  projectId,
  currentUser,
  projectName,
}) {
  const [email, setEmail] = useState("");
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("");

  const handleSearch = async () => {
    setStatus("Searching...");
    const db = getFirestore();
    const q = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(q);
    if (snap.empty) {
      setStatus("No user found.");
      setResult(null);
    } else {
      const userDoc = snap.docs[0];
      setResult({ uid: userDoc.id, ...userDoc.data() });
      setStatus("");
    }
  };

  const handleInvite = async () => {
    const db = getFirestore();
    const notifRef = doc(db, "users", result.uid);

    await updateDoc(notifRef, {
      notifications: arrayUnion({
        type: "invite",
        projectId,
        projectName,
        invitedBy: `${currentUser.firstName} ${currentUser.lastName}`,
        timestamp: Date.now(),
      }),
    });

    // ✅ Send email if notifyInvites is true

    setStatus("Invitation sent!");
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Invite a member</h3>
        <input
          type="email"
          placeholder="Search by email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
        />
        <button onClick={handleSearch} className={styles.button}>
          Search
        </button>
        {status && <p>{status}</p>}
        {result && (
          <div className={styles.userCard}>
            {result.firstName} {result.lastName} ({result.email})
            <button onClick={handleInvite} className={styles.inviteBtn}>
              Send Invite
            </button>
          </div>
        )}
        <button onClick={onClose} className={styles.closeBtn}>
          Close
        </button>
      </div>
    </div>
  );
}
