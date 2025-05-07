import { useState } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import styles from "./CreateChatModal.module.css";

export default function CreateChatModal({ projectId, onClose, onCreated }) {
  const [chatName, setChatName] = useState("");
  const [loading, setLoading] = useState(false);
  const db = getFirestore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!chatName.trim()) return;
    setLoading(true);
    await addDoc(collection(db, "projects", projectId, "chats"), {
      name: chatName.trim(),
      createdAt: serverTimestamp(),
    });
    setChatName("");
    setLoading(false);
    onCreated(); // refresh list
    onClose(); // close modal
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Create New Chat</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Chat name"
            value={chatName}
            onChange={(e) => setChatName(e.target.value)}
            className={styles.input}
          />
          <div className={styles.actions}>
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
