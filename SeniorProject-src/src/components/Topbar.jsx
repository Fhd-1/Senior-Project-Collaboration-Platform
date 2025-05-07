import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";
import { logout } from "../services/authService";
import styles from "./Topbar.module.css";

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const getInitial = () => {
    if (user?.displayName) return user.displayName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "?";
  };

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className={styles.topbar}>
      <div className={styles.spacer}></div>
      <div className={styles.menuContainer} ref={menuRef}>
        {user?.photoURL ? (
          <img
            src={user.photoURL}
            alt="User"
            className={styles.avatar}
            onClick={() => setOpen((prev) => !prev)}
          />
        ) : (
          <div
            className={styles.avatarLetter}
            onClick={() => setOpen((prev) => !prev)}
          >
            {getInitial()}
          </div>
        )}

        {open && (
          <div className={styles.dropdown}>
            <button onClick={handleLogout}>Log out</button>
          </div>
        )}
      </div>
    </div>
  );
}
