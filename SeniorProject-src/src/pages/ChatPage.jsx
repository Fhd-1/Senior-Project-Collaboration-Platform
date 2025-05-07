import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import {
  sendChatMessage,
  listenToChatMessages,
} from "../services/firestoreService";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../contexts/authContext";
import styles from "./ChatPage.module.css";

export default function ChatPage() {
  const { projectId, chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const db = getFirestore();

  const [chatName, setChatName] = useState("Chat");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Fetch chat name
    const loadChatName = async () => {
      if (chatId === "general") {
        setChatName("General");
      } else {
        const ref = doc(db, "projects", projectId, "chats", chatId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setChatName(snap.data().name || "Chat");
        }
      }
    };
    loadChatName();
  }, [projectId, chatId, db]);

  useEffect(() => {
    const unsubscribe = listenToChatMessages(projectId, chatId, setMessages);
    return unsubscribe;
  }, [projectId, chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    await sendChatMessage(projectId, chatId, {
      senderId: user.uid,
      senderName: `${user.firstName} ${user.lastName}`,
      text: text.trim(),
    });

    setText("");
  };

  const formatDate = (date) => {
    const today = new Date();
    const d = new Date(date);
    const isToday = d.toDateString() === today.toDateString();
    const isYesterday =
      d.toDateString() ===
      new Date(today.setDate(today.getDate() - 1)).toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return d.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const renderMessagesWithDates = () => {
    let lastDate = null;
    return messages.map((msg, index) => {
      const msgDate = msg.timestamp?.toDate?.();
      const showDate =
        !lastDate || msgDate?.toDateString() !== lastDate?.toDateString();
      lastDate = msgDate;

      return (
        <div key={msg.id || index}>
          {showDate && (
            <div className={styles.dateDivider}>{formatDate(msgDate)}</div>
          )}
          <div
            className={`${styles.message} ${
              msg.senderId === user.uid ? styles.own : ""
            }`}
          >
            <span className={styles.sender}>{msg.senderName}</span>
            <p className={styles.text}>{msg.text}</p>
            {msg.timestamp && (
              <span className={styles.timestamp}>
                {msg.timestamp.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <DashboardLayout>
      <div className={styles.chatWrapper}>
        <div className={styles.chatHeader}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ←
          </button>
          <h2>{chatName}</h2>
        </div>

        <div className={styles.messages}>
          {renderMessagesWithDates()}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className={styles.inputForm}>
          <input
            type="text"
            placeholder="Type your message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </DashboardLayout>
  );
}
