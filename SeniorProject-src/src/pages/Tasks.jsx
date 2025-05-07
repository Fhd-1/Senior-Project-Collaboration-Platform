import { useEffect, useState } from "react";
import {
  getUserProjects,
  getTasksByProject,
  updateTask,
  deleteTask,
} from "../services/firestoreService";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/authContext";
import DashboardLayout from "../layouts/DashboardLayout";
import TaskItem from "../components/TaskItem";
import EditTaskModal from "../components/EditTaskModal";
import styles from "./TasksPage.module.css";
import { FaFilter } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function TasksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [projectCreators, setProjectCreators] = useState({});
  const [projectsMap, setProjectsMap] = useState({});
  const [memberNames, setMemberNames] = useState({});
  const [projectMembers, setProjectMembers] = useState({});
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState("default");

  useEffect(() => {
    const fetch = async () => {
      const db = getFirestore();
      const projects = await getUserProjects();
      const allTasks = [];
      const creators = {};
      const names = {};
      const members = {};
      const assignedUIDs = new Set();

      for (const project of projects) {
        const projectTasks = await getTasksByProject(project.id);
        projectTasks.forEach((t) => {
          allTasks.push({ ...t, projectId: project.id });
          t.assignedTo?.forEach((uid) => assignedUIDs.add(uid));
        });

        creators[project.id] = project.creator;
        names[project.id] = project.name;

        // ✅ Load project members from the `members` array in project doc
        const userRefs = project.members || [];
        const membersList = [];

        await Promise.all(
          userRefs.map(async (uid) => {
            const ref = doc(db, "users", uid);
            const snap = await getDoc(ref);
            if (snap.exists()) {
              const d = snap.data();
              const name = `${d.firstName} ${d.lastName}`;
              membersList.push({ uid, name });
              assignedUIDs.add(uid);
            }
          })
        );

        members[project.id] = membersList;
      }

      // Map userId to full name
      const uidMap = {};
      await Promise.all(
        Array.from(assignedUIDs).map(async (uid) => {
          const ref = doc(db, "users", uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const d = snap.data();
            uidMap[uid] = `${d.firstName} ${d.lastName}`;
          }
        })
      );

      setTasks(allTasks);
      setProjectCreators(creators);
      setProjectsMap(names);
      setMemberNames(uidMap);
      setProjectMembers(members);
    };

    fetch();
  }, []);

  const handleUpdateTask = async (taskId, updates) => {
    if (!updates || typeof updates !== "object") {
      console.error("Invalid task updates:", updates);
      return;
    }
    await updateTask(taskId, updates);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Delete this task?")) {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    }
  };

  const getFilteredTasks = () => {
    const sorted = [...tasks];
    if (filter === "a-z")
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (filter === "z-a")
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    if (filter === "earliest")
      return sorted.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    if (filter === "latest")
      return sorted.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
    if (filter === "progress") {
      const rank = { "in-progress": 1, todo: 2, done: 3 };
      return sorted.sort((a, b) => rank[a.status] - rank[b.status]);
    }
    return sorted;
  };

  return (
    <DashboardLayout>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ←
          </button>
          <h2>All Tasks</h2>
          <div className={styles.filterWrap}>
            <FaFilter className={styles.filterIcon} />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="default">-- Filter --</option>
              <option value="a-z">A–Z</option>
              <option value="z-a">Z–A</option>
              <option value="earliest">Earliest Deadline</option>
              <option value="latest">Latest Deadline</option>
              <option value="progress">By Progress</option>
            </select>
          </div>
        </div>

        <ul className={styles.taskUl}>
          {getFilteredTasks().map((task) => (
            <li key={task.id}>
              <p className={styles.projectLabel}>
                From Project: <strong>{projectsMap[task.projectId]}</strong>
              </p>
              <TaskItem
                task={task}
                isCreator={user?.uid === projectCreators[task.projectId]}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
                onEdit={() => setEditingTask(task)}
                memberNames={memberNames}
              />
            </li>
          ))}
        </ul>

        {editingTask && (
          <EditTaskModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={handleUpdateTask}
            members={projectMembers[editingTask.projectId] || []}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
