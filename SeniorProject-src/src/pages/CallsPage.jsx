import {
  HMSRoomProvider,
  useHMSStore,
  useHMSActions,
  selectIsConnectedToRoom,
  selectPeers,
  selectIsPeerAudioEnabled,
  selectDominantSpeaker,
} from "@100mslive/react-sdk";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import styles from "./CallsPage.module.css";
import { getProjectById } from "../services/firestoreService";
import { auth } from "../services/firebaseConfig";

const PeerBox = ({ peer }) => {
  const isAudioEnabled = useHMSStore(selectIsPeerAudioEnabled(peer.id));
  const dominantSpeaker = useHMSStore(selectDominantSpeaker);
  const isSpeaking = dominantSpeaker?.id === peer.id;

  return (
    <div className={`${styles.peerBox} ${isSpeaking ? styles.speaking : ""}`}>
      <div className={styles.peerName}>
        {peer.name} {isAudioEnabled ? "🔊" : "🔇"}
      </div>
    </div>
  );
};

const Conference = () => {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const hmsActions = useHMSActions();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [joined, setJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [project, setProject] = useState(null);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [currentTemplateId, setCurrentTemplateId] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      const data = await getProjectById(projectId);
      setProject(data);
    };
    fetchProject();
  }, [projectId]);

  const joinRoom = async (roomId, templateId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not logged in");

      const res = await fetch(
        "https://cpit499-backend-server.onrender.com/generate-token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            userId: user.uid,
            role: "host",
            templateId,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.token) throw new Error("Failed to generate token");

      await hmsActions.join({
        userName: user.displayName || user.email || "User",
        authToken: data.token,
        settings: {
          isAudioMuted: false,
          isVideoMuted: true,
        },
      });

      setSelectedRoomId(roomId);
      setCurrentTemplateId(templateId);
      setJoined(true);
    } catch (err) {
      console.error("Failed to join call:", err.message);
    }
  };

  const handleLeave = async () => {
    await hmsActions.leave();
    setJoined(false);
    setSelectedRoomId(null);
    setCurrentTemplateId(null);
    setIsRecording(false);
    navigate(`/project/${projectId}`);
  };

  const toggleMute = async () => {
    await hmsActions.setLocalAudioEnabled(isMuted);
    setIsMuted(!isMuted);
  };

  const toggleRecording = async () => {
    if (!selectedRoomId) return;
    if (!isRecording) {
      try {
        const res = await fetch(
          "https://cpit499-backend-server.onrender.com/start-recording",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId: selectedRoomId }),
          }
        );
        if (res.ok) {
          setIsRecording(true);
        }
      } catch (err) {
        console.error("❌ Error starting recording:", err.message);
      }
    } else {
      try {
        const res = await fetch(
          "https://cpit499-backend-server.onrender.com/stop-recording",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roomId: selectedRoomId }),
          }
        );
        if (res.ok) {
          setIsRecording(false);
        }
      } catch (err) {
        console.error("❌ Error stopping recording:", err.message);
      }
    }
  };

  if (!project || !project.rooms)
    return <DashboardLayout>Loading...</DashboardLayout>;

  return (
    <DashboardLayout>
      <div className={styles.wrapper}>
        {!isConnected ? (
          <>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
              ←
            </button>

            <div className={styles.pageCenter}>
              <h2 className={styles.pageTitle}>Select Call Type</h2>

              <div className={styles.cardContainer}>
                <div className={styles.callCard}>
                  <h3>Default Call</h3>
                  <p>No recording, no transcription</p>
                  <button
                    onClick={() =>
                      joinRoom(
                        project.rooms.default,
                        "6800e26e4b6eb78daeede4cd"
                      )
                    }
                  >
                    Join Call
                  </button>
                </div>
                <div className={styles.callCard}>
                  <h3>Transcript Only</h3>
                  <p>Enables post-call transcription</p>
                  <button
                    onClick={() =>
                      joinRoom(
                        project.rooms.transcript,
                        "680a324f8102660b706b6f80"
                      )
                    }
                  >
                    Join Call
                  </button>
                </div>
                <div className={styles.callCard}>
                  <h3>Full Call</h3>
                  <p>Enables transcript and AI summary</p>
                  <button
                    onClick={() =>
                      joinRoom(project.rooms.full, "6800e2f78102660b706b5f72")
                    }
                  >
                    Join Call
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`${styles.controlBtn} ${
                isMuted ? styles.redBtn : styles.greenBtn
              } ${styles.topLeft}`}
            >
              {isMuted ? "Unmute" : "Mute"}
            </button>

            {(currentTemplateId === "680a324f8102660b706b6f80" ||
              currentTemplateId === "6800e2f78102660b706b5f72") && (
              <button
                onClick={toggleRecording}
                className={`${styles.controlBtn} ${
                  isRecording ? styles.redBtn : styles.blueBtn
                } ${styles.topCenter}`}
              >
                {isRecording ? "Stop Recording" : "Start Recording"}
              </button>
            )}

            <button
              onClick={handleLeave}
              className={`${styles.controlBtn} ${styles.redBtn} ${styles.topRight}`}
            >
              Leave Call
            </button>

            <div className={styles.peersGrid}>
              {peers.map((peer) => (
                <PeerBox key={peer.id} peer={peer} />
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default function CallsPage() {
  return (
    <HMSRoomProvider>
      <Conference />
    </HMSRoomProvider>
  );
}
