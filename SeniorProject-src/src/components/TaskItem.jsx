import { useState } from "react";
import styles from "./TaskItem.module.css";

export default function TaskItem({
  task,
  isCreator,
  onUpdate,
  onDelete,
  onEdit,
  memberNames,
}) {
  const [status, setStatus] = useState(task.status);

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    onUpdate(task.id, { status: newStatus });
  };

  const assignedLabels =
    task.assignedTo?.map((uid) => memberNames?.[uid] || "Unknown") || [];

  return (
    <li className={styles.item}>
      <div className={styles.left}>
        <div>
          <strong>{task.name}</strong>
          {task.dueDate && (
            <span className={styles.due}> 📅 {task.dueDate}</span>
          )}
        </div>
        {assignedLabels.length > 0 && (
          <div className={styles.assignedTo}>
            Assigned to:
            {assignedLabels.map((name, i) => (
              <span key={i} className={styles.userTag}>
                {name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <select
          value={status}
          onChange={handleStatusChange}
          className={styles.select}
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        {isCreator && (
          <>
            <button onClick={onEdit} className={styles.iconBtn} title="Edit">
              ✏️
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className={styles.iconBtn}
              title="Delete"
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </li>
  );
}
