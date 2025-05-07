import { useState, useRef, useEffect } from "react";
import styles from "./ProjectCard.module.css";

export default function ProjectCard({
  title,
  description,
  deadline,
  isCreate,
  isCreator,
  onClick,
  onEdit,
  onDelete,
  onLeave,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isCreate) {
    return (
      <div className={`${styles.card} ${styles.create}`} onClick={onClick}>
        <span className={styles.plus}>＋</span>
      </div>
    );
  }

  return (
    <div
      className={styles.card}
      onClick={!isCreate ? onClick : undefined}
      style={{ cursor: !isCreate ? "pointer" : "default" }}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {!isCreate && (
          <div
            className={styles.dots}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            ⋯
          </div>
        )}
      </div>

      {!isCreate && (
        <>
          <p className={styles.description}>{description}</p>
          <div className={styles.footer}>
            {deadline && <span className={styles.deadline}>📅 {deadline}</span>}
          </div>

          {menuOpen && (
            <div className={styles.dropdown} ref={menuRef}>
              {isCreator ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                  >
                    🗑️ Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLeave();
                  }}
                >
                  🚪 Leave
                </button>
              )}
            </div>
          )}
        </>
      )}

      {isCreate && <span className={styles.plus}>＋</span>}
    </div>
  );
}
