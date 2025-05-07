import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import DashboardLayout from "../layouts/DashboardLayout";
import { useAuth } from "../contexts/authContext";
import {
  uploadFileToS3,
  getDownloadUrl,
  listFilesFromS3,
} from "../services/awsUploadService";
import styles from "./FilesPage.module.css";

export default function FilesPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const db = getFirestore();

  const [activeTab, setActiveTab] = useState("projectFiles");
  const [files, setFiles] = useState([]);
  const [transcripts, setTranscripts] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [projectRooms, setProjectRooms] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [modalFileUrl, setModalFileUrl] = useState("");

  useEffect(() => {
    fetchFiles();
    fetchProjectRooms();
  }, []);

  useEffect(() => {
    if (projectRooms) {
      fetchTranscriptsAndSummaries();
    }
  }, [projectRooms]);

  async function fetchFiles() {
    const snap = await getDocs(collection(db, "projects", projectId, "files"));
    const fileData = await Promise.all(
      snap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        try {
          const url = await getDownloadUrl(data.fileKey);
          return { id: docSnap.id, ...data, fileUrl: url };
        } catch {
          await deleteDoc(doc(db, "projects", projectId, "files", docSnap.id));
          return null;
        }
      })
    );
    setFiles(fileData.filter(Boolean));
  }

  async function fetchProjectRooms() {
    const snap = await getDoc(doc(db, "projects", projectId));
    if (snap.exists()) {
      const data = snap.data();
      setProjectRooms(data.rooms || null);
    }
  }

  async function fetchTranscriptsAndSummaries() {
    if (!projectRooms) return;

    const transcriptRoomId = projectRooms.transcript;
    const fullRoomId = projectRooms.full;

    try {
      const allObjects = await listFilesFromS3();
      const transcriptFiles = [];
      const summaryFiles = [];

      for (const obj of allObjects) {
        const matchesTranscriptRoom =
          transcriptRoomId &&
          obj.Key.startsWith(`transcription/${transcriptRoomId}/`);
        const matchesFullRoom =
          fullRoomId && obj.Key.startsWith(`transcription/${fullRoomId}/`);

        if (!(matchesTranscriptRoom || matchesFullRoom)) continue;

        const isTranscriptFile =
          obj.Key.includes("Transcript-") && obj.Key.endsWith(".txt");
        const isSummaryFile =
          obj.Key.includes("Summary-") && obj.Key.endsWith(".json");

        const url = await getDownloadUrl(obj.Key);

        if (isTranscriptFile) {
          transcriptFiles.push({
            key: obj.Key,
            url,
            uploadedAt: obj.LastModified,
          });
        } else if (isSummaryFile) {
          summaryFiles.push({
            key: obj.Key,
            url,
            uploadedAt: obj.LastModified,
          });
        }
      }

      setTranscripts(transcriptFiles);
      setSummaries(summaryFiles);
    } catch (err) {
      console.error("Failed fetching transcription files:", err);
    }
  }
  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadSuccess(false);

    try {
      const fileKey = await uploadFileToS3(file);
      const fileUrl = await getDownloadUrl(fileKey);

      const metadata = {
        fileKey,
        originalName: file.name,
        uploadedBy: user.uid,
        uploadedByName: `${user.firstName} ${user.lastName}`,
        uploadedAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "projects", projectId, "files"),
        metadata
      );

      setFiles((prev) => [...prev, { ...metadata, fileUrl, id: docRef.id }]);
      setUploadSuccess(true);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      setTimeout(() => setUploadSuccess(false), 3000);
    }
  }

  async function handleSummaryClick(file) {
    try {
      const res = await fetch(file.url);
      const data = await res.json();

      let textToShow = "";

      if (data.sections && Array.isArray(data.sections)) {
        data.sections.forEach((section) => {
          textToShow += `🔵 ${section.title}\n`;
          if (section.format === "bullets" && section.bullets.length) {
            section.bullets.forEach((bullet) => {
              textToShow += `• ${bullet}\n`;
            });
          } else if (section.paragraph) {
            textToShow += `${section.paragraph}\n`;
          }
          textToShow += `\n`;
        });
      } else {
        textToShow = "Summary data not available.";
      }

      setModalContent(textToShow.trim());
      setModalFileUrl(file.url);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to load summary:", err);
      alert("Failed to load summary.");
    }
  }

  async function handleTranscriptClick(file) {
    try {
      const res = await fetch(file.url);
      const text = await res.text();

      setModalContent(text.trim());
      setModalFileUrl(file.url);
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to load transcript:", err);
      alert("Failed to load transcript.");
    }
  }

  function renderFiles(data, isTranscript = false) {
    return (
      <div className={styles.fileTable}>
        <div className={styles.fileHeader}>
          <span>File Name</span>
          {!isTranscript && <span>Uploaded By</span>}
          <span>Uploaded At</span>
        </div>
        {data.map((file) => {
          const fileName = file.originalName || file.key.split("/").pop();
          const isSummary = fileName.endsWith(".json");
          const isTranscriptFile = fileName.endsWith(".txt");

          return (
            <div key={file.id || file.key} className={styles.fileRow}>
              {isSummary ? (
                <button
                  onClick={() => handleSummaryClick(file)}
                  className={styles.fileLink}
                >
                  {fileName}
                </button>
              ) : isTranscriptFile ? (
                <button
                  onClick={() => handleTranscriptClick(file)}
                  className={styles.fileLink}
                >
                  {fileName}
                </button>
              ) : (
                <a
                  href={file.fileUrl || file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.fileLink}
                >
                  {fileName}
                </a>
              )}
              {!isTranscript && <span>{file.uploadedByName || "-"}</span>}
              <span>
                {file.uploadedAt ? formatDateTime(file.uploadedAt) : "-"}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  function formatDateTime(date) {
    if (!date) return "-";

    if (date.toDate) {
      date = date.toDate();
    }

    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };
    return new Date(date).toLocaleString(undefined, options);
  }

  return (
    <DashboardLayout>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate(-1)}>
            ←
          </button>
          <h2>Files</h2>
          {activeTab === "projectFiles" && (
            <label className={styles.uploadLabel}>
              Upload File
              <input
                type="file"
                onChange={(e) => handleUpload(e)}
                disabled={uploading}
                className={styles.fileInput}
              />
            </label>
          )}
        </div>

        <div className={styles.tabs}>
          <button
            className={
              activeTab === "projectFiles"
                ? styles.activeTab
                : styles.inactiveTab
            }
            onClick={() => setActiveTab("projectFiles")}
          >
            Project Files
          </button>
          <button
            className={
              activeTab === "transcripts"
                ? styles.activeTab
                : styles.inactiveTab
            }
            onClick={() => setActiveTab("transcripts")}
          >
            Transcripts
          </button>
          <button
            className={
              activeTab === "summaries" ? styles.activeTab : styles.inactiveTab
            }
            onClick={() => setActiveTab("summaries")}
          >
            Summaries
          </button>
        </div>

        {uploading && <div className={styles.statusInfo}>Uploading...</div>}
        {uploadSuccess && (
          <div className={styles.successInfo}>✅ Uploaded successfully!</div>
        )}

        <div className={styles.contentArea}>
          {activeTab === "projectFiles" && renderFiles(files)}
          {activeTab === "transcripts" && renderFiles(transcripts, true)}
          {activeTab === "summaries" && renderFiles(summaries, true)}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <div>{modalContent}</div>
              </div>
              <div className={styles.modalActions}>
                <button onClick={() => window.open(modalFileUrl, "_blank")}>
                  Open Full File
                </button>
                <button onClick={() => setIsModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
