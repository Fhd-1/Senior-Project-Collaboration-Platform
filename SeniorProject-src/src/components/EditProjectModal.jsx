import { useState } from "react";
import styles from "./CreateProjectModal.module.css"; // reuse same styling

export default function EditProjectModal({ project, onClose, onSave }) {
  const [name, setName] = useState(project.name);
  const [desc, setDesc] = useState(project.description || "");
  const [deadline, setDeadline] = useState(project.deadline || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(project.id, { name, description: desc, deadline });
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Edit Project</h2>
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
            <button type="submit">Save</button>
            <button type="button" onClick={onClose} className={styles.cancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
