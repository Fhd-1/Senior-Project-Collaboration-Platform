import {
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayRemove,
  arrayUnion,
  getDoc,
  deleteDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth } from "./firebaseConfig";

const db = getFirestore();

// ─────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────

export const createProject = async ({ name, description, deadline }) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  let rooms = {
    default: null,
    transcript: null,
    full: null,
  };

  // Call backend to create each room type
  const roomTypes = ["default", "transcript", "full"];

  for (const type of roomTypes) {
    try {
      const res = await fetch(
        "https://cpit499-backend-server.onrender.com/create-room",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        }
      );

      const data = await res.json();
      if (res.ok && data.id) {
        rooms[type] = data.id;
      } else {
        console.error(` Failed to create ${type} room:`, data);
      }
    } catch (err) {
      console.error(` Error creating ${type} room:`, err.message);
    }
  }

  // Save project to Firestore
  const docRef = await addDoc(collection(db, "projects"), {
    name,
    description,
    deadline,
    creator: user.uid,
    members: [user.uid],
    createdAt: new Date(),
    rooms, // ✅ Save all room IDs under 'rooms' field
  });

  return docRef.id;
};

export const getUserProjects = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const q = query(
    collection(db, "projects"),
    where("members", "array-contains", user.uid)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const leaveProject = async (projectId) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const ref = doc(db, "projects", projectId);
  await updateDoc(ref, {
    members: arrayRemove(user.uid),
  });
};

export const updateProject = async (projectId, updatedFields) => {
  const ref = doc(db, "projects", projectId);
  await updateDoc(ref, updatedFields);
};

export const getProjectById = async (projectId) => {
  const ref = doc(db, "projects", projectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Project not found");
  return { id: snap.id, ...snap.data() };
};

export const deleteProject = async (projectId) => {
  const ref = doc(db, "projects", projectId);
  await deleteDoc(ref);
};

// ─────────────────────────────────────
// TASKS
// ─────────────────────────────────────

export const createTask = async (projectId, taskData) => {
  await addDoc(collection(db, "tasks"), {
    ...taskData,
    projectId,
    assignedTo: taskData.assignedTo || [],
    createdAt: new Date(),
  });
};

export const getTasksByProject = async (projectId) => {
  const q = query(collection(db, "tasks"), where("projectId", "==", projectId));
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateTask = async (taskId, updates) => {
  const ref = doc(db, "tasks", taskId);
  await updateDoc(ref, updates);
};

export const deleteTask = async (taskId) => {
  const ref = doc(db, "tasks", taskId);
  await deleteDoc(ref);
};

// ─────────────────────────────────────
// CHAT MESSAGES
// ─────────────────────────────────────

export const sendChatMessage = async (projectId, chatId, message) => {
  const messagesRef = collection(
    db,
    "projects",
    projectId,
    "chats",
    chatId,
    "messages"
  );

  await addDoc(messagesRef, {
    ...message,
    timestamp: serverTimestamp(),
  });
};

export const listenToChatMessages = (projectId, chatId, callback) => {
  const messagesRef = collection(
    db,
    "projects",
    projectId,
    "chats",
    chatId,
    "messages"
  );
  const q = query(messagesRef, orderBy("timestamp"));

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(list);
  });
};
