const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(cors());

const TEMPLATE_IDS = {
  default: "6800e26e4b6eb78daeede4cd",
  transcript: "680a324f8102660b706b6f80",
  full: "6800e2f78102660b706b5f72",
};

function generateManagementToken() {
  return jwt.sign(
    {
      access_key: process.env.HMS_ACCESS_KEY,
      type: "management",
      version: 2,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      jti: `token-${Date.now()}`,
    },
    process.env.HMS_SECRET,
    { algorithm: "HS256" }
  );
}

app.post("/create-room", async (req, res) => {
  const { type } = req.body;
  const templateId = TEMPLATE_IDS[type];
  if (!templateId) return res.status(400).json({ error: "Invalid template type" });

  try {
    const token = generateManagementToken();
    const response = await axios.post(
      "https://api.100ms.live/v2/rooms",
      {
        name: `room-${type}-${Date.now()}`,
        description: `Room for ${type} template`,
        template_id: templateId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("❌ Error creating room:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create room" });
  }
});

app.post("/generate-token", (req, res) => {
  const { roomId, userId, role, templateId } = req.body;
  if (!roomId || !userId || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const payload = {
    access_key: process.env.HMS_ACCESS_KEY,
    type: "app",
    version: 2,
    room_id: roomId,
    user_id: userId,
    role,
  };

  if (templateId) payload.template_id = templateId;

  const token = jwt.sign(payload, process.env.HMS_SECRET, {
    algorithm: "HS256",
    expiresIn: "24h",
    jwtid: `random-id-${Date.now()}`,
  });

  res.json({ token });
});

app.post("/start-recording", async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "Missing roomId" });

  try {
    const token = generateManagementToken();
    const response = await axios.post(
      `https://api.100ms.live/v2/recordings/room/${roomId}/start`,
      {
        resolution: { width: 1280, height: 720 },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("❌ Failed to start recording:", err.response?.data || err.message);
    res.status(500).json({ error: "Recording start failed" });
  }
});

app.post("/stop-recording", async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "Missing roomId" });

  try {
    const token = generateManagementToken();
    const response = await axios.post(
      `https://api.100ms.live/v2/recordings/room/${roomId}/stop`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    res.json(response.data);
  } catch (err) {
    console.error("❌ Failed to stop recording:", err.response?.data || err.message);
    res.status(500).json({ error: "Recording stop failed" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});

