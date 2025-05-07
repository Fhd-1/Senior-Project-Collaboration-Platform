import { useState } from "react";
import styles from "./CreateProjectModal.module.css";

export default function CreateProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [deadline, setDeadline] = useState("");

  function isValidFutureDate(dateString) {
    if (!dateString) return true; // optional field
    const today = new Date();
    const selected = new Date(dateString);
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);
    return selected >= today;
  }
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!isValidFutureDate(deadline)) {
      alert("Deadline must be today or in the future.");
      return;
    }

    onCreate({ name, description: desc, deadline });
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Create New Project</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="Short description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <label className={styles.label}>Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <div className={styles.actions}>
            <button type="submit">Create</button>
            <button type="button" onClick={onClose} className={styles.cancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
