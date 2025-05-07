import { useState } from "react";
import styles from "./CreateProjectModal.module.css"; // reuse modal style

export default function EditTaskModal({ task, onClose, onSave, members }) {
  const [name, setName] = useState(task.name);
  const [status, setStatus] = useState(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [assignedTo, setAssignedTo] = useState(task.assignedTo || []);

  const handleCheckboxChange = (uid) => {
    if (assignedTo.includes(uid)) {
      setAssignedTo(assignedTo.filter((id) => id !== uid));
    } else {
      setAssignedTo([...assignedTo, uid]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(task.id, { name, status, dueDate, assignedTo });
    onClose();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Edit Task</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <label className={styles.label}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
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
