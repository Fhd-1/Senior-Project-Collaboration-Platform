import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  getProjectById,
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
} from "../services/firestoreService";
import { getDoc, doc, getFirestore } from "firebase/firestore";
import { useAuth } from "../contexts/authContext";
import styles from "./ProjectPage.module.css";
import TaskItem from "../components/TaskItem";
import NewTaskModal from "../components/NewTaskModal";
import EditTaskModal from "../components/EditTaskModal";
import InviteMemberModal from "../components/InviteMemberModal";
import { FaFilter } from "react-icons/fa";

export default function ProjectPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [memberNames, setMemberNames] = useState({});
  const [filter, setFilter] = useState("default");

  const updateStats = (tasks) => {
    const now = new Date();
    let total = tasks.length;
    let completed = 0;
    let inProgress = 0;
    let overdue = 0;

    tasks.forEach((task) => {
      if (task.status === "done") completed++;
      else if (task.status === "in-progress") inProgress++;
      if (task.dueDate) {
        const due = new Date(task.dueDate);
        if (task.status !== "done" && due < now) overdue++;
      }
    });

    setStats({ total, completed, inProgress, overdue });
  };

  const handleNewTask = async (task) => {
    await createTask(projectId, task);
    const updated = await getTasksByProject(projectId);
    setTasks(updated);
    updateStats(updated);
  };

  const handleUpdateTask = async (taskId, updates = null) => {
    if (updates) {
      await updateTask(taskId, updates);
      const updated = await getTasksByProject(projectId);
      setTasks(updated);
      updateStats(updated);
    } else {
      const task = tasks.find((t) => t.id === taskId);
      setEditingTask(task);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const confirm = window.confirm("Delete this task?");
    if (!confirm) return;
    await deleteTask(taskId);
    const updated = await getTasksByProject(projectId);
    setTasks(updated);
    updateStats(updated);
  };

  const loadMemberNames = async (uids) => {
    const db = getFirestore();
    const names = {};
    await Promise.all(
      uids.map(async (uid) => {
        const ref = doc(db, "users", uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          names[uid] = `${data.firstName} ${data.lastName}`;
        }
      })
    );
    setMemberNames(names);
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getProjectById(projectId);
        setProject(data);
        loadMemberNames(data.members || []);
        const loadedTasks = await getTasksByProject(projectId);
        setTasks(loadedTasks);
        updateStats(loadedTasks);
      } catch (err) {
        console.error("Error loading project page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [projectId]);

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

  if (loading)
    return (
      <DashboardLayout>
        <div className={styles.page}>Loading…</div>
      </DashboardLayout>
    );
  if (!project)
    return (
      <DashboardLayout>
        <div className={styles.page}>Project not found.</div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <div className={styles.leftHeader}>
            <button onClick={() => navigate(-1)} className={styles.backBtn}>
              ←
            </button>
            <h2>{project.name}</h2>
          </div>
        </div>

        <div className={styles.leftCard}>
          <h4>Description</h4>
          <p>{project.description}</p>
        </div>

        <div className={styles.centerCard}>
          <h4>Task Stats</h4>
          {!stats ? (
            <p>Loading tasks…</p>
          ) : (
            <ul>
              <li>Total: {stats.total}</li>
              <li>Completed: {stats.completed}</li>
              <li>In Progress: {stats.inProgress}</li>
              <li>Overdue: {stats.overdue}</li>
            </ul>
          )}
        </div>

        <div className={styles.rightCard}>
          <div className={styles.memberHeader}>
            <h4>Project Members</h4>
            {project.creator === user?.uid && (
              <button
                onClick={() => setShowInvite(true)}
                title="Add member"
                className={styles.addBtn}
              >
                +
              </button>
            )}
          </div>
          <ul>
            {project.members?.map((uid, i) => (
              <li key={i}>{memberNames[uid] || uid}</li>
            ))}
          </ul>
        </div>

        <div className={styles.taskHeader}>
          <h4>Project Tasks</h4>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => setShowTaskModal(true)}
              className={styles.newBtn}
            >
              ＋ New Task
            </button>
            <div className={styles.filterWrap}>
              <FaFilter title="Filter Tasks" className={styles.filterIcon} />
              <select
                className={styles.filterSelect}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
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
        </div>

        <div className={styles.taskList}>
          {tasks.length === 0 ? (
            <p>No tasks yet.</p>
          ) : (
            <ul className={styles.taskUl}>
              {getFilteredTasks().map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isCreator={user?.uid === project.creator}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  onEdit={() => setEditingTask(task)} // ✅ Enables modal
                  memberNames={memberNames}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {showTaskModal && (
        <NewTaskModal
          onClose={() => setShowTaskModal(false)}
          onCreate={handleNewTask}
          members={project.members.map((uid) => ({
            uid,
            name: memberNames[uid] || uid,
          }))}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleUpdateTask}
          members={project.members.map((uid) => ({
            uid,
            name: memberNames[uid] || uid,
          }))}
        />
      )}

      {showInvite && (
        <InviteMemberModal
          onClose={() => setShowInvite(false)}
          projectId={projectId}
          currentUser={user}
          projectName={project.name}
        />
      )}
    </DashboardLayout>
  );
}
