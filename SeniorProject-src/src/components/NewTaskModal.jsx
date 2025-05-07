import { useState } from "react";
import styles from "./CreateProjectModal.module.css"; // reuse the modal styles

export default function NewTaskModal({ onClose, onCreate, members }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState("todo");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState([]);

  const handleCheckboxChange = (uid) => {
    if (assignedTo.includes(uid)) {
      setAssignedTo(assignedTo.filter((id) => id !== uid));
    } else {
      setAssignedTo([...assignedTo, uid]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate({ name, status, dueDate, assignedTo });
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Create New Task</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Task name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className={styles.label}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          <label className={styles.label}>Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <label className={styles.label}>Assign To</label>
          <div className={styles.checkboxGroup}>
            {members.map((member) => (
              <label key={member.uid} className={styles.checkbox}>
                <input
                  type="checkbox"
                  value={member.uid}
                  checked={assignedTo.includes(member.uid)}
                  onChange={() => handleCheckboxChange(member.uid)}
                />
                {member.name}
              </label>
            ))}
          </div>

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
