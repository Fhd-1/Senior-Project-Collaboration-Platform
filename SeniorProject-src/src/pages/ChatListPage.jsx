import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import DashboardLayout from "../layouts/DashboardLayout";
import CreateChatModal from "../components/CreateChatModal";
import styles from "./ChatListPage.module.css";
import { useAuth } from "../contexts/authContext";

export default function ChatListPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const db = getFirestore();

  const [chats, setChats] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [creator, setCreator] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRef = useRef(null);

  const isCreator = user?.uid === creator;

  const loadChats = async () => {
    const snap = await getDocs(collection(db, "projects", projectId, "chats"));
    const chatList = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setChats(chatList);
  };

  useEffect(() => {
    const fetch = async () => {
      const ref = doc(db, "projects", projectId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setCreator(snap.data().creator);
      }
      loadChats();
    };
    fetch();
  }, [projectId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEdit = async (chat) => {
    const newName = prompt("New chat name:", chat.name);
    if (!newName || newName.trim() === "") return;
    await updateDoc(doc(db, "projects", projectId, "chats", chat.id), {
      name: newName.trim(),
    });
    loadChats();
  };

  const handleDelete = async (chat) => {
    const confirm = window.confirm("Delete this chat?");
    if (!confirm) return;
    await deleteDoc(doc(db, "projects", projectId, "chats", chat.id));
    loadChats();
  };

  return (
    <DashboardLayout>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ←
          </button>
          <h2 style={{ flex: 1 }}>Project Chats</h2>
          {isCreator && (
            <button
              onClick={() => setShowModal(true)}
              className={styles.newBtn}
              title="New Chat"
            >
              ＋
            </button>
          )}
        </div>

        <div className={styles.cardGrid}>
          <div
            className={styles.chatCard}
            onClick={() => navigate(`/project/${projectId}/chat/general`)}
          >
            <h4>General</h4>
            <p>Default project-wide chat</p>
          </div>

          {chats.map((chat) => (
            <div key={chat.id} className={styles.chatCard}>
              <div
                className={styles.cardTop}
                onClick={() =>
                  menuOpenId !== chat.id &&
                  navigate(`/project/${projectId}/chat/${chat.id}`)
                }
              >
                <h4>{chat.name}</h4>
                {isCreator && (
                  <div
                    className={styles.dots}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpenId((prev) => (prev === chat.id ? null : chat.id));
                    }}
                  >
                    ⋯
                  </div>
                )}
              </div>
              <p>Click to open</p>

              {menuOpenId === chat.id && (
                <div className={styles.dropdown} ref={menuRef}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(chat);
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(chat);
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {showModal && (
          <CreateChatModal
            projectId={projectId}
            onClose={() => setShowModal(false)}
            onCreated={loadChats}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
