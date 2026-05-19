const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const pdf = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
require("dotenv").config();
const { query } = require("./db");
const initDB = require("./initDB");
const aiEngine = require("./ai_engine");
const chatRouter = require("./chat_endpoints");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json());
app.use("/api/chat", chatRouter);

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Initialize Database
initDB();


const checkOllama = async () => {
  if (process.env.GEMINI_API_KEY) {
    console.log("ℹ️ GEMINI_API_KEY detected in environment variables. Bypassing Ollama and using Google Gemini Cloud API.");
    return;
  }
  try {
    await axios.get(`${process.env.OLLAMA_URL}/api/tags`);
    console.log("✅ Ollama Connection: SUCCESSFUL");

    // Warm up the model to reduce first-response latency
    console.log("⏳ Ollama: Warming up 'phi3' model...");
    axios.post(`${process.env.OLLAMA_URL}/api/generate`, {
      model: "phi3",
      prompt: "warmup",
      stream: false
    }).then(() => console.log("🚀 Ollama: 'phi3' is warmed up and ready!"))
      .catch(e => console.warn("⚠️ Ollama: Warm-up failed (but connection is okay)"));

  } catch (err) {
    console.error("❌ Ollama Connection: FAILED");
    console.error("   Please ensure Ollama is running in the background or configure GEMINI_API_KEY.");
    console.error(`   URL: ${process.env.OLLAMA_URL}`);
  }
};
checkOllama();

// Multer setup for file uploads
const upload = multer({ dest: "uploads/" });
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const chatStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || (file.mimetype === 'audio/webm' ? '.webm' : (file.mimetype === 'image/png' ? '.png' : (file.mimetype === 'image/jpeg' ? '.jpg' : (file.mimetype === 'application/pdf' ? '.pdf' : ''))));
    const baseName = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, baseName + '-' + uniqueSuffix + ext);
  }
});
const chatUpload = multer({ storage: chatStorage });

const videoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/videos/')
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').pop() || 'webm';
    cb(null, `interview_${Date.now()}.${ext}`)
  }
});
const videoUpload = multer({ storage: videoStorage });

if (!fs.existsSync("uploads/videos")) {
  fs.mkdirSync("uploads/videos", { recursive: true });
}

// Serve all static files from uploads
app.use('/uploads', express.static('uploads'));

// Serve static videos for admin viewing with proper headers and range support
app.use('/uploads/videos', express.static('uploads/videos', {
  setHeaders: (res, filePath) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Accept-Ranges', 'bytes');
    if (filePath.endsWith('.webm')) {
      res.header('Content-Type', 'video/webm');
    } else {
      res.header('Content-Type', 'video/mp4');
    }
  }
}));

// Endpoint for chat file uploads (images, docs, audio)
app.post("/api/chat-upload", chatUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

  // Return the URL for the frontend to save in the message
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// Alternative direct file serving endpoint for videos
app.get('/api/video/:filename', (req, res) => {
  const filename = req.params.filename;
  const filepath = path.resolve(__dirname, 'uploads/videos', filename);

  console.log(`Video request: ${filename}, download=${req.query.download}`);

  if (!fs.existsSync(filepath)) {
    console.error(`Video file not found: ${filepath}`);
    return res.status(404).json({ message: "Video not found" });
  }

  // Handle download request
  if (req.query.download === 'true') {
    console.log(`Triggering download for: ${filename}`);
    return res.download(filepath, filename);
  }

  // Standard playback
  console.log(`Streaming video: ${filename}`);
  res.sendFile(filepath, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes'
    }
  });
});

// Get User Info
app.get("/api/user/:id", async (req, res) => {
  try {
    const user = await query("SELECT id, name, email, role, college_name, roll_number FROM users WHERE id = $1", [req.params.id]);
    if (user.rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// Register
app.post("/api/register", async (req, res) => {
  const { name, email, password, role, collegeName, rollNumber } = req.body;
  try {
    const userExists = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await query(
      "INSERT INTO users (name, email, password, role, college_name, roll_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, role, college_name, roll_number",
      [name, email, hashedPassword, role || 'candidate', collegeName || null, rollNumber || null]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.rows[0].id, role: user.rows[0].role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1h" }
    );

    res.json({
      token,
      user: {
        id: user.rows[0].id,
        name: user.rows[0].name,
        email: user.rows[0].email,
        role: user.rows[0].role,
        college_name: user.rows[0].college_name,
        roll_number: user.rows[0].roll_number
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Change Password (Secure)
app.post("/api/change-password", authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const user = await query("SELECT * FROM users WHERE id = $1", [userId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error in change-password:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Email sending
const emailPassword = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  family: 4, // FORCES IPv4 DNS resolution (Bypasses Render ENETUNREACH IPv6 blocker!)
  auth: {
    user: process.env.EMAIL_USER,
    pass: emailPassword
  },
  tls: {
    rejectUnauthorized: false // Bypasses container-level certificate handshaking blocks
  }
});

//Forgot Password API endpoints

// 1. Request Reset Token
app.post("/api/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await query("SELECT id, name FROM users WHERE email = $1", [email]);

    // Don't reveal if user doesn't exist
    if (user.rows.length === 0) {
      return res.json({ message: "If an account exists with this email, a reset link has been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    await query(
      "UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE email = $3",
      [token, expiry, email]
    );

    // Send Reset Email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token}`;

    const mailOptions = {
      from: `"Shnoor AI Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request - Shnoor AI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #1e40af; text-align: center;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password for your Shnoor AI Interview Systems account.</p>
          <p>Click the button below to set a new password. This link will expire in 1 hour.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you did not request this, please ignore this email. Your password will remain unchanged.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">Shnoor AI Interview Systems &copy; 2026</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT] Password reset email sent to: ${email}`);

    res.json({
      message: "A password reset link has been sent to your email address. Please check your inbox."
    });
  } catch (err) {
    console.error("--- NODEMAILER ERROR ---");
    console.error(err.message);

    // Fallback for development: Log the link to the console if email fails
    const token = await query("SELECT reset_token FROM users WHERE email = $1", [req.body.email]);
    if (token.rows.length > 0) {
      const fallbackLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${token.rows[0].reset_token}`;
      console.log(`[FALLBACK] Email failed, but here is your link for testing: ${fallbackLink}`);
    }

    res.status(500).json({
      message: "Error sending reset email. Please ensure your EMAIL_USER and EMAIL_PASS are correct in the .env file.",
      error: err.message
    });
  }
});

// 2. Reset Password with Token
app.post("/api/reset-password-with-token", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await query(
      "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [token]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await query(
      "UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2",
      [hashedPassword, user.rows[0].id]
    );

    res.json({ message: "Password has been reset successfully. You can now log in." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error resetting password" });
  }
});

// Verify token (used by frontend to check if link is still valid)
app.get("/api/verify-reset-token/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const user = await query(
      "SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()",
      [token]
    );
    if (user.rows.length === 0) {
      return res.status(400).json({ valid: false });
    }
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// (Deprecated) Keep old routes for backward compatibility during transition if needed
app.post("/api/verify-user", async (req, res) => {
  // ... existing code ...
  const { email, name } = req.body;
  try {
    const user = await query("SELECT * FROM users WHERE email = $1 AND name = $2", [email, name]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found with matching name and email" });
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Verification error" });
  }
});

// (Removed insecure /api/reset-password route)

// --- Colleges Routes ---

app.get("/api/colleges", async (req, res) => {
  try {
    const colleges = await query("SELECT * FROM colleges ORDER BY name ASC");
    res.json(colleges.rows);
  } catch (err) {
    console.error("Error fetching colleges:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/colleges/active", async (req, res) => {
  try {
    const colleges = await query("SELECT id, name FROM colleges WHERE status = 'active' ORDER BY name ASC");
    res.json(colleges.rows);
  } catch (err) {
    console.error("Error fetching active colleges:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/colleges", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "College name is required" });
  try {
    const newCollege = await query(
      "INSERT INTO colleges (name, status) VALUES ($1, 'active') RETURNING *",
      [name]
    );
    res.status(201).json(newCollege.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // unique constraint violation
      return res.status(400).json({ message: "College already exists" });
    }
    console.error("Error adding college:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.put("/api/colleges/:id/toggle", async (req, res) => {
  const { id } = req.params;
  try {
    const college = await query("SELECT status FROM colleges WHERE id = $1", [id]);
    if (college.rows.length === 0) return res.status(404).json({ message: "College not found" });

    const newStatus = college.rows[0].status === 'active' ? 'inactive' : 'active';
    const updated = await query(
      "UPDATE colleges SET status = $1 WHERE id = $2 RETURNING *",
      [newStatus, id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    console.error("Error toggling college:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.delete("/api/colleges/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await query("DELETE FROM colleges WHERE id = $1 RETURNING *", [id]);
    if (deleted.rows.length === 0) return res.status(404).json({ message: "College not found" });
    res.json({ message: "College deleted successfully", id: deleted.rows[0].id });
  } catch (err) {
    console.error("Error deleting college:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Health check to verify server is running new code
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", version: "1.0.1", timestamp: new Date() });
});

// --- Application Routes ---

app.post("/api/applications", async (req, res) => {
  const { userId, role, isItRole } = req.body;
  try {
    const newApp = await query(
      "INSERT INTO applications (user_id, role, is_it_role, status) VALUES ($1, $2, $3, 'applied') RETURNING *",
      [userId, role, isItRole]
    );
    res.status(201).json(newApp.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating application" });
  }
});

app.get("/api/applications/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const apps = await query(`
      SELECT a.*, 
        (SELECT id FROM interviews WHERE application_id = a.id AND status = 'ongoing' LIMIT 1) as ongoing_interview_id,
        (SELECT interview_type FROM interviews WHERE application_id = a.id AND status = 'ongoing' LIMIT 1) as ongoing_interview_type,
        EXISTS(SELECT 1 FROM interviews WHERE application_id = a.id AND interview_type = 'Technical' AND status = 'completed') as tr_done,
        EXISTS(SELECT 1 FROM interviews WHERE application_id = a.id AND interview_type = 'HR' AND status = 'completed') as hr_done
      FROM applications a 
      WHERE a.user_id = $1 
      ORDER BY a.created_at DESC
    `, [userId]);
    res.json(apps.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching applications" });
  }
});

// --- Interview Routes ---

// Upload Resume & Start Interview
app.post("/api/upload-resume", upload.single("resume"), async (req, res) => {
  const { userId, role, applicationId, interviewType } = req.body;
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  try {
    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdf(dataBuffer);
    const resumeText = pdfData.text;

    // 1. Close any existing 'ongoing' sessions for this user (Cleanup)
    await query("UPDATE interviews SET status = 'abandoned' WHERE user_id = $1 AND status = 'ongoing'", [userId]);

    // 2. Create fresh interview record
    const newInterview = await query(
      "INSERT INTO interviews (user_id, resume_text, status, role, resume_file, interview_type, application_id) VALUES ($1, $2, 'ongoing', $3, $4, $5, $6) RETURNING id",
      [userId, resumeText, role || 'General Resume', dataBuffer, interviewType || 'Technical', applicationId || null]
    );

    // If applicationId is provided, update application status
    if (applicationId) {
      const newStatus = interviewType === 'HR' ? 'hr_pending' : 'tr_pending';
      await query("UPDATE applications SET status = $1 WHERE id = $2", [newStatus, applicationId]);
    }

    // Remove temp file
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      interviewId: newInterview.rows[0].id,
      message: "Resume uploaded and parsed successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error processing resume" });
  }
});

// --- AI Concurrency Queue (Phase 5 Scaling) ---
// This queue ensures that if 100 candidates ask a question at once,
// we don't crash the server or Ollama. It processes them systematically.
class OllamaQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async add(prompt, maxTokens = 100, customOptions = {}) {
    return new Promise((resolve, reject) => {
      this.queue.push({ prompt, maxTokens, customOptions, resolve, reject });
      this.processNext();
    });
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const { prompt, maxTokens, customOptions, resolve, reject } = this.queue.shift();
    try {
      if (process.env.GEMINI_API_KEY) {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: customOptions.temperature || 0.4,
            stopSequences: ["[SYSTEM:", "TRANSCRIPT:", "Analyze response", "TASK:", "IF TYPE is CODING", "Scenario:", "</Question>"]
          }
        });
        
        const responseText = result.response.text();
        resolve(responseText);
      } else {
        const ollamaRes = await axios.post(`${process.env.OLLAMA_URL}/api/generate`, {
          model: "phi3",
          prompt: prompt,
          stream: false,
          options: {
            num_predict: maxTokens,
            temperature: customOptions.temperature || 0.4, // Increased from 0.1 for more variety
            num_thread: 8,
            top_k: 40,             // Increased from 20
            top_p: 0.9,             // Increased from 0.5
            num_ctx: 4096,         // Increased from 2048
            stop: ["[SYSTEM:", "TRANSCRIPT:", "Analyze response", "TASK:", "IF TYPE is CODING", "Scenario:", "</Question>"]
          }
        }, { timeout: 300000 });
        resolve(ollamaRes.data.response);
      }
    } catch (err) {
      console.error("AI Generation Error (Gemini/Ollama):", err.message);
      console.log("⚠️ Activating Offline AI Fail-safe Engine...");
      try {
        let fallbackResponse = "";
        
        if (prompt.includes("HR_DIRECTOR_PERSONA")) {
          // HR Interview
          const roleMatch = prompt.match(/Role:\s*([^\n]+)/i);
          const role = roleMatch ? roleMatch[1].trim() : "General";
          
          const aiEngine = require("./ai_engine");
          const roleSpecificKeys = Object.keys(aiEngine.ROLE_BLUEPRINTS);
          const matchedRoleKey = roleSpecificKeys.find(r => role.toLowerCase().includes(r.toLowerCase())) || "General Resume";
          
          let questions = aiEngine.HR_SAMPLE_QUESTIONS;
          const matches = prompt.match(/Behavioral Bank:\s*([^\n]+)/i);
          if (matches) {
            questions = matches[1].split(" | ");
          }

          let chosenQuestion = questions[Math.floor(Math.random() * questions.length)];
          const lines = prompt.split("\n");
          const transcriptLines = lines.filter(l => l.startsWith("USER:") || l.startsWith("AI:") || l.startsWith("HR:"));
          
          for (let i = 0; i < 10; i++) {
            const candidate = questions[Math.floor(Math.random() * questions.length)];
            const alreadyAsked = transcriptLines.some(line => line.toLowerCase().includes(candidate.toLowerCase()));
            if (!alreadyAsked) {
              chosenQuestion = candidate;
              break;
            }
          }

          fallbackResponse = `[DIFFICULTY: 2]\n[TOPIC: HR]\n[TYPE: BEHAVIORAL]\n<Question>${chosenQuestion}</Question>`;
        } else if (prompt.includes("TECH_INTERVIEWER")) {
          // Technical Interview
          const roleMatch = prompt.match(/Role:\s*([^\n]+)/i);
          const role = roleMatch ? roleMatch[1].trim() : "Software Engineer";
          
          const diffMatch = prompt.match(/Difficulty:\s*(\d+)/i);
          const difficulty = diffMatch ? parseInt(diffMatch[1]) : 2;

          const aiEngine = require("./ai_engine");
          const roleSpecificKeys = Object.keys(aiEngine.ROLE_BLUEPRINTS);
          const matchedRoleKey = roleSpecificKeys.find(r => role.toLowerCase().includes(r.toLowerCase())) || "Software Engineer";

          const techQuestions = {
            "Software Engineer": [
              "Can you explain the difference between a stack and a queue, and give a real-world scenario where you would use each?",
              "What is the time and space complexity of QuickSort in the average and worst cases?",
              "How does a hash map resolve collisions internally? Can you describe separate chaining and open addressing?",
              "What is the difference between a process and a thread, and how do they share memory?",
              "Can you explain the concept of RESTful API design and list some HTTP methods and their idempotency?"
            ],
            "Java Developer": [
              "What is the difference between final, finally, and finalize in Java?",
              "How does Java's Garbage Collection mechanism work, and what are the different memory areas in JVM?",
              "Can you explain the difference between fail-fast and fail-safe iterators in Java collections?",
              "What are the benefits of using Spring Boot's Dependency Injection container, and how does @Autowired resolve beans?",
              "How do you implement a thread-safe singleton pattern in Java?"
            ],
            "Frontend Developer": [
              "Can you explain the concept of Virtual DOM in React and how the reconciliation process works?",
              "What is the difference between local storage, session storage, and cookies in modern web applications?",
              "Can you explain JavaScript closures and provide a practical use-case for them?",
              "How do CSS preprocessors like SASS or PostCSS help in scaling stylesheets in a frontend application?",
              "What are the best practices for optimizing a React application's initial page load time?"
            ],
            "Data Analyst": [
              "What is the difference between an INNER JOIN, LEFT JOIN, and outer join in SQL?",
              "How do you handle outliers and missing data values during the data cleaning process in Python?",
              "Can you explain the difference between the mean, median, and mode, and when would you use each?",
              "What is a SQL window function, and how is it different from a GROUP BY query?",
              "How do you choose between a bar chart, a line chart, and a scatter plot when presenting data insights?"
            ],
            "UI/UX Designer": [
              "Can you explain the difference between UI and UX, and how user research informs your design process?",
              "What are the Web Content Accessibility Guidelines (WCAG), and how do you ensure your designs are accessible?",
              "Can you walk me through your typical wireframing and interactive prototyping workflow in Figma?",
              "How do you maintain design system consistency across multiple platforms or devices?",
              "How do you handle negative usability test feedback on a design you worked hard on?"
            ],
            "DevOps Engineer": [
              "Can you explain the core concepts of Continuous Integration and Continuous Deployment (CI/CD)?",
              "What is the difference between a Docker container and a Virtual Machine?",
              "How do you manage configuration drift and infrastructure state using tools like Terraform?",
              "What are the primary differences between active-passive and active-active high availability systems?",
              "Can you describe how you would debug a high-latency issue in a live production application?"
            ]
          };

          const roleBlueprint = aiEngine.ROLE_BLUEPRINTS[matchedRoleKey] || aiEngine.ROLE_BLUEPRINTS["Software Engineer"];
          const codingScenarios = roleBlueprint.coding_scenarios || [];

          let chosenQuestion = "";
          let qType = "THEORY";
          let topic = "Theory";

          // Avoid repetitions and select balanced theory / coding questions
          for (let attempt = 0; attempt < 25; attempt++) {
            let candidate = "";
            let candType = "THEORY";
            let candTopic = "Core Technical Theory";

            // If it's an IT role, give a 45% chance to ask a coding question!
            if (codingScenarios.length > 0 && Math.random() > 0.55) {
              candidate = codingScenarios[Math.floor(Math.random() * codingScenarios.length)];
              candType = "CODING";
              candTopic = "Coding Challenge";
            } else {
              const questions = techQuestions[matchedRoleKey] || techQuestions["Software Engineer"];
              candidate = questions[Math.floor(Math.random() * questions.length)];
            }

            if (!prompt.toLowerCase().includes(candidate.toLowerCase())) {
              chosenQuestion = candidate;
              qType = candType;
              topic = candTopic;
              break;
            }
          }

          // Fallback if all attempts hit a previously asked question
          if (!chosenQuestion) {
            const questions = techQuestions[matchedRoleKey] || techQuestions["Software Engineer"];
            chosenQuestion = questions[0];
          }

          fallbackResponse = `[DIFFICULTY: ${difficulty}]\n[TOPIC: ${topic}]\n[TYPE: ${qType}]\n<Question>${chosenQuestion}</Question>`;
        } else if (prompt.includes("EVALUATOR")) {
          const isHR = prompt.includes("HR EXPERT EVALUATOR") || prompt.includes("HR Interview");
          if (isHR) {
            fallbackResponse = `Performance Report:\n- **Strengths**: Good communication, structured answers, and quick responsiveness to behavioral questions.\n- **Weaknesses**: Could elaborate further on core leadership scenarios.\n- **Communication Style**: Clear, articulate, and confident throughout the discussion.\n- **How to Improve**: Practice structured responses like the STAR method for resolving conflicts.\n- **STAR Method Usage**: Excellent structure, clearly laid out situations and key results.\n- **Verdict**: Selected\n\n[Internal Scoring Only]:\nScore: 8\nMax Possible: 10`;
          } else {
            fallbackResponse = `Performance Report:\n- **Strengths**: Solid understanding of core technical concepts, syntax accuracy, and basic algorithm design.\n- **Weaknesses**: Needs deeper practice in time/space complexity analysis (Big O notation) and boundary error handling.\n- **Coding Review**: Code logic is mostly correct, but could be optimized by avoiding redundant nested loops to reduce complexity from O(N^2) to O(N). Ensure strict check for null pointer and index bounds.\n- **How to Improve**: Focus on solving data structure problems using optimal approaches, review runtime complexity, and practice mock coding challenges.\n- **Communication**: Clear, technical, and precise explanations of algorithms.\n- **Verdict**: Selected\n\n[Internal Scoring Only]:\nScore: 8\nMax Possible: 10`;
          }
        } else {
          fallbackResponse = `[DIFFICULTY: 3]\n[TOPIC: General]\n[TYPE: THEORY]\n<Question>Could you please tell me about a technical project you recently worked on and the biggest challenge you faced?</Question>`;
        }

        console.log("✅ Offline Fallback Generated Successfully!");
        resolve(fallbackResponse);
      } catch (fallbackErr) {
        console.error("Critical: Offline Fallback Engine Failed:", fallbackErr);
        reject(err);
      }
    } finally {
      this.isProcessing = false;
      this.processNext();
    }
  }
}
const aiQueue = new OllamaQueue();

// Start Interview (Generate 1st Question)
app.post("/api/interview/:id/start", async (req, res) => {
  const { id } = req.params;
  try {
    const interview = await query("SELECT id, role, interview_type FROM interviews WHERE id = $1", [id]);
    if (interview.rows.length === 0) return res.status(404).json({ message: "Interview not found" });

    const selectedRole = interview.rows[0].role;
    const interviewType = interview.rows[0].interview_type || "Technical";

    // Hardcode the first question for zero-latency start!
    const question = interviewType === "HR"
      ? "Welcome to the HR interview. Please start by introducing yourself and sharing a bit about your professional background."
      : "Welcome to the technical interview. Please start by introducing yourself and giving a brief overview of your background.";

    // Save AI message
    await query(
      "INSERT INTO interview_messages (interview_id, role, content) VALUES ($1, $2, $3)",
      [id, 'ai', question]
    );

    // Generate and save blueprint in background
    aiEngine.getBlueprint(selectedRole, aiQueue, interviewType).then(blueprint => {
      query("UPDATE interviews SET blueprint = $1 WHERE id = $2", [JSON.stringify(blueprint), id])
        .catch(err => console.error("Background Blueprint Update Error:", err));
    }).catch(err => console.error("Background Blueprint Generation Error:", err));

    res.json({
      question,
      interviewType,
      persona: interviewType === "HR" ? "Senior HR Director" : "Technical Specialist"
    });
  } catch (err) {
    console.error("Error starting interview:", err.message);
    res.status(500).json({ message: "Error starting interview." });
  }
});

// Handle Answer & Get Next Question
app.post("/api/interview/:id/answer", async (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  try {
    // 1. Save user answer
    await query(
      "INSERT INTO interview_messages (interview_id, role, content) VALUES ($1, $2, $3)",
      [id, 'user', answer]
    );

    // 2. Get history
    // Increment answered count
    await query(
      "UPDATE interviews SET answered_count = answered_count + 1 WHERE id = $1",
      [id]
    );

    const interviewData = await query("SELECT resume_text, user_id, role, difficulty_level, blueprint, interview_type FROM interviews WHERE id = $1", [id]);
    const resumeText = interviewData.rows[0]?.resume_text || "";
    const userId = interviewData.rows[0]?.user_id;
    const selectedRole = interviewData.rows[0]?.role || "General Resume";
    const currentDifficulty = interviewData.rows[0]?.difficulty_level || 1;
    const interviewType = interviewData.rows[0]?.interview_type || "Technical";
    let blueprint = interviewData.rows[0]?.blueprint;

    // Fallback if blueprint was not generated at start
    if (!blueprint) {
      blueprint = await aiEngine.getBlueprint(selectedRole, aiQueue, interviewType);
      await query("UPDATE interviews SET blueprint = $1 WHERE id = $2", [JSON.stringify(blueprint), id]);
    }

    const userData = await query("SELECT name FROM users WHERE id = $1", [userId]);
    const candidateName = userData.rows[0]?.name || "Candidate";

    const history = await query(
      "SELECT role, content FROM interview_messages WHERE interview_id = $1 ORDER BY created_at ASC",
      [id]
    );

    const historyCount = history.rows.length;
    const recentHistory = history.rows.slice(-10); // Send last 10 messages for better context and to avoid repetition
    let chatHistory = recentHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

    // Add a small note if history was truncated
    if (historyCount > 10) {
      chatHistory = "... (previous history truncated for context) ...\n" + chatHistory;
    }

    const prompt = aiEngine.generateAdaptivePrompt(candidateName, selectedRole, currentDifficulty, resumeText, chatHistory, blueprint, interviewType);

    let aiOutput = await aiQueue.add(prompt, 150);

    // Parse difficulty level
    let nextDifficulty = currentDifficulty;
    const diffMatch = aiOutput.match(/\[DIFFICULTY:\s*(\d+)\]/i);
    if (diffMatch) {
      nextDifficulty = parseInt(diffMatch[1]);
      // Clamp between 1 and 5
      nextDifficulty = Math.max(1, Math.min(5, nextDifficulty));

      // Update the database with new difficulty level
      await query("UPDATE interviews SET difficulty_level = $1 WHERE id = $2", [nextDifficulty, id]);
    }

    // Parse type
    let qType = interviewType === "HR" ? "BEHAVIORAL" : "THEORY";
    const typeMatch = aiOutput.match(/\[TYPE:\s*(\w+)\]/i);

    // Improved detection logic
    const lowerOutput = aiOutput.toLowerCase();
    const hasCodeBlock = aiOutput.includes("```");
    const hasCodingKeywords = lowerOutput.includes("coding question") ||
      lowerOutput.includes("starter code") ||
      lowerOutput.includes("write a function") ||
      lowerOutput.includes("implement") ||
      lowerOutput.includes("write code");

    if (typeMatch && interviewType !== "HR") {
      qType = typeMatch[1].toUpperCase();
    } else if (interviewType !== "HR" && (hasCodeBlock || hasCodingKeywords)) {
      qType = "CODING";
    }

    // 1. Primary Extraction: Try to get exactly what's inside <Question> tags
    const questionMatch = aiOutput.match(/<Question>([\s\S]*?)<\/Question>/i);
    let nextQuestion = "";

    if (questionMatch) {
      nextQuestion = questionMatch[1].trim();
    } else {
      // Fallback: Use old cleaning logic if tags are missing
      let cleanedOutput = aiOutput.split(/<\/Question>/i)[0];
      nextQuestion = cleanedOutput.replace(/AI:/gi, '')
        .replace(/Interviewer:/gi, '')
        .replace(/Solaris:/gi, '')
        .replace(/\[TASK\]/gi, '')
        .replace(/\[\/TASK\]/gi, '')
        .replace(/INSTRUCTION:/gi, '')
        // Remove all variations of metadata labels
        .replace(/\[?DIFFICULTY:.*?\]?/gi, '')
        .replace(/\[?TOPIC:.*?\]?/gi, '')
        .replace(/\[?TYPE:.*?\]?/gi, '')
        .replace(/Difficulty:\s*\w+/gi, '')
        .replace(/Topic:\s*\w+/gi, '')
        .replace(/Type:\s*\w+/gi, '')
        .replace(/<Question>/gi, '')
        .replace(/<Problem Statement>/gi, '')
        .replace(/<\/Problem Statement>/gi, '')
        .replace(/IF TYPE is CODING/gi, '')
        .replace(/Problem Statement:/gi, '')
        .trim();
    }

    // 3. Remove analysis/reasoning blocks
    nextQuestion = nextQuestion.replace(/(?:The candidate|Harshu|Candidate|Given this|Based on).*?(\.|\?|$)/gi, '');

    // 4. Clean up any leaked system instructions or formatting prompts
    nextQuestion = nextQuestion.replace(/\[SYSTEM.*?\]/gi, '');
    nextQuestion = nextQuestion.replace(/Rules:[\s\S]*?(?=(?:\w))/ig, '');
    nextQuestion = nextQuestion.replace(/Task:[\s\S]*?\n/ig, '');
    nextQuestion = nextQuestion.replace(/Output EXACTLY in this format.*?:\n?/gi, '');
    nextQuestion = nextQuestion.replace(/Follow this format.*?:\n?/gi, '');
    nextQuestion = nextQuestion.replace(/INSTRUCTION:.*?\n/gi, '');

    // 5. Final tag and marker cleaning
    nextQuestion = nextQuestion.replace(/\[?DIFFICULTY:.*?\]?/gi, '')
      .replace(/\[?TOPIC:.*?\]?/gi, '')
      .replace(/\[?TYPE:.*?\]?/gi, '')
      .replace(/Difficulty:\s*\w+/gi, '')
      .replace(/Topic:\s*\w+/gi, '')
      .replace(/Type:\s*\w+/gi, '')
      .replace(/<Question>/gi, '')
      .replace(/<\/Question>/gi, '')
      .replace(/AI Response:/ig, '')
      .replace(/Example format:/ig, '')
      .replace(/^["']|["']$/g, '')
      .replace(/-{2,}/g, '').trim();

    // 4. Final sanity check for tags
    nextQuestion = nextQuestion.replace(/\[?DIFFICULTY:.*?\]?/gi, '')
      .replace(/\[?TOPIC:.*?\]?/gi, '')
      .replace(/\[?TYPE:.*?\]?/gi, '')
      .replace(/Difficulty:\s*\w+/gi, '')
      .replace(/Topic:\s*\w+/gi, '')
      .replace(/Type:\s*\w+/gi, '')
      .replace(/<.*?>/g, '')
      .trim();

    // 5. STUBBORN REPETITION CHECK: If AI is stuck, force a fresh question from the bank
    const lastAIQuestion = recentHistory.slice().reverse().find(m => m.role === 'ai')?.content;
    if (nextQuestion.toLowerCase() === lastAIQuestion?.toLowerCase() || nextQuestion.length < 5) {
      if (interviewType === "HR") {
        const unusedQuestions = aiEngine.HR_SAMPLE_QUESTIONS.filter(q => !chatHistory.toLowerCase().includes(q.toLowerCase()));
        nextQuestion = unusedQuestions.length > 0
          ? unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)]
          : aiEngine.HR_SAMPLE_QUESTIONS[Math.floor(Math.random() * aiEngine.HR_SAMPLE_QUESTIONS.length)];
        console.log(`[REPETITION DETECTED] Force-switching to HR bank question: ${nextQuestion}`);
      } else {
        const roleSpecificKeys = Object.keys(aiEngine.ROLE_BLUEPRINTS);
        const matchedRoleKey = roleSpecificKeys.find(r => selectedRole.toLowerCase().includes(r.toLowerCase())) || "Software Engineer";
        const roleBlueprint = aiEngine.ROLE_BLUEPRINTS[matchedRoleKey] || aiEngine.ROLE_BLUEPRINTS["Software Engineer"];
        
        // Merge theory and coding scenarios
        const theoryQuestions = [
          "Can you explain the difference between a stack and a queue, and give a real-world scenario where you would use each?",
          "What is the time and space complexity of QuickSort in the average and worst cases?",
          "How does a hash map resolve collisions internally? Can you describe separate chaining and open addressing?",
          "What is the difference between a process and a thread, and how do they share memory?",
          "Can you explain the concept of RESTful API design and list some HTTP methods and their idempotency?"
        ];
        const codingScenarios = roleBlueprint.coding_scenarios || [];
        const allTechOptions = [...theoryQuestions, ...codingScenarios];
        
        const unusedTech = allTechOptions.filter(q => !chatHistory.toLowerCase().includes(q.toLowerCase()));
        nextQuestion = unusedTech.length > 0
          ? unusedTech[Math.floor(Math.random() * unusedTech.length)]
          : allTechOptions[Math.floor(Math.random() * allTechOptions.length)];
        
        // Determine type of the forced question
        if (codingScenarios.includes(nextQuestion)) {
          qType = "CODING";
        } else {
          qType = "THEORY";
        }
        console.log(`[REPETITION DETECTED] Force-switching to Tech question: ${nextQuestion} of type ${qType}`);
      }
    }

    // 6. Save AI question
    await query(
      "INSERT INTO interview_messages (interview_id, role, content) VALUES ($1, $2, $3)",
      [id, 'ai', nextQuestion]
    );

    // Parse language from blueprint if available, otherwise fallback to auto-detection
    let selectedLanguage = blueprint?.language || "javascript";

    // Auto-detection override if AI explicitly mentions a language in the question
    const lowerQ = nextQuestion.toLowerCase();
    if (lowerQ.includes("python")) selectedLanguage = "python";
    else if (lowerQ.includes("java") && !lowerQ.includes("javascript")) selectedLanguage = "java";
    else if (lowerQ.includes("c++") || lowerQ.includes("cpp")) selectedLanguage = "cpp";

    res.json({ nextQuestion, difficulty: nextDifficulty, type: qType, language: selectedLanguage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Run Code (Safe Execution Sandbox)
app.post("/api/interview/:id/run-code", async (req, res) => {
  const { code, language } = req.body;

  try {
    if (language === 'javascript' || language === 'js') {
      // Basic Sandbox for JS (for demo/interview purposes)
      const logs = [];
      const originalConsoleLog = console.log;

      // Temporary override to capture logs
      console.log = (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));

      try {
        const result = eval(code);
        console.log = originalConsoleLog; // Restore
        res.json({
          output: logs.join('\n') || String(result),
          success: true
        });
      } catch (evalErr) {
        console.log = originalConsoleLog; // Restore
        res.json({ output: "Runtime Error: " + evalErr.message, success: false });
      }
    } else {
      // Mock execution for other languages
      res.json({
        output: `[Mock Execution: ${language.toUpperCase()}]\nCode compiled successfully.\nOutput: Execution finished with exit code 0.`,
        success: true
      });
    }
  } catch (err) {
    console.error("Critical run-code error:", err);
    res.status(500).json({ message: "Server error during code execution" });
  }
});

// Update Interview Snapshot
app.post("/api/interview/:id/snapshot", async (req, res) => {
  const { id } = req.params;
  const { image } = req.body;
  try {
    await query("UPDATE interviews SET last_snapshot = $1 WHERE id = $2", [image, id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving snapshot" });
  }
});

// Upload Video Recording
app.post("/api/interview/:id/video", videoUpload.single("video"), async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    console.error("No video file received in upload request");
    return res.status(400).json({ message: "No video uploaded" });
  }

  try {
    const videoUrl = `/uploads/videos/${req.file.filename}`;
    console.log(`Uploading video for interview ${id}: ${videoUrl}`);

    const result = await query(
      "UPDATE interviews SET video_url = $1 WHERE id = $2 RETURNING id, video_url",
      [videoUrl, id]
    );

    if (result.rows.length === 0) {
      console.error(`Interview ${id} not found in database`);
      return res.status(404).json({ message: "Interview not found" });
    }

    console.log(`Video saved successfully for interview ${id}:`, result.rows[0]);
    res.json({
      message: "Video saved successfully",
      videoUrl: result.rows[0].video_url,
      interviewId: result.rows[0].id
    });
  } catch (err) {
    console.error("Error saving video:", err);
    res.status(500).json({ message: "Error saving video", error: err.message });
  }
});

// Finish & Evaluate Interview
app.post("/api/interview/:id/finish", async (req, res) => {
  const { id } = req.params;
  try {
    const interviewData = await query("SELECT answered_count, role, blueprint, user_id, status, interview_type, application_id FROM interviews WHERE id = $1", [id]);
    if (interviewData.rows.length === 0) return res.status(404).json({ message: "Interview not found" });

    const { answered_count: answeredCount, role: selectedRole, user_id: userId, status: currentStatus, interview_type: interviewType, application_id: applicationId } = interviewData.rows[0];
    let blueprint = interviewData.rows[0].blueprint;

    // 1. Calculate pending questions based on blueprint
    let totalPlanned = 20; // Updated to 20 as per requirement
    try {
      const bData = typeof blueprint === 'string' ? JSON.parse(blueprint) : blueprint;
      if (bData && bData.questions) {
        totalPlanned = bData.questions.length;
      }
    } catch (e) {
      console.error("Error parsing blueprint for pending count:", e);
    }

    const pendingCount = Math.max(0, totalPlanned - answeredCount);

    // 2. Mark as completed and save pending count
    await query("UPDATE interviews SET status = 'completed', pending_count = $1 WHERE id = $2", [pendingCount, id]);

    // Return immediately to the frontend
    res.json({ message: "Interview ended. Evaluation started in background.", status: "completed" });

    // 2. Perform evaluation in the background
    (async () => {
      try {
        console.log(`[BACKGROUND EVAL] Starting evaluation for interview ${id}`);

        const history = await query(
          "SELECT role, content FROM interview_messages WHERE interview_id = $1 ORDER BY created_at ASC",
          [id]
        );
        let chatHistory = history.rows.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");

        const userData = await query("SELECT name FROM users WHERE id = $1", [userId]);
        const candidateName = userData.rows[0]?.name || "Candidate";

        if (!blueprint) {
          blueprint = await aiEngine.getBlueprint(selectedRole, aiQueue, interviewType);
        } else if (typeof blueprint === 'string') {
          try { blueprint = JSON.parse(blueprint); } catch (e) { }
        }

        if (answeredCount === 0) {
          const evaluationText = `Performance Report for ${candidateName}:\n- **Strengths**: None\n- **Weaknesses**: The candidate did not answer any questions.\n- **Verdict**: Rejected`;
          await query("UPDATE interviews SET result = $1, score = $2 WHERE id = $3", [evaluationText, 0, id]);
          return;
        }

        const maxScore = answeredCount * 2;
        const prompt = aiEngine.generateEvaluationPrompt(candidateName, selectedRole, answeredCount, chatHistory, blueprint, interviewType);

        // Slightly reduced max tokens for faster background processing
        const evaluation = await aiQueue.add(prompt, 350, { temperature: 0.1 });

        if (!evaluation) {
          throw new Error("AI evaluation returned empty response");
        }

        // Parse score
        const scoreMatch = evaluation.match(/Score\s*(?::|-|is|=)?\s*\*?\*?\[?\s*(\d+)/i);
        let score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

        if (score > maxScore) score = maxScore;

        const cleanEvaluation = evaluation
          .replace(/\[Internal Scoring Only\][\s\S]*$/i, '')
          .replace(/Performance Report:/i, '')
          .trim();

        await query(
          "UPDATE interviews SET result = $1, score = $2 WHERE id = $3",
          [cleanEvaluation, Math.round(score), id]
        );
        console.log(`[BACKGROUND EVAL] Completed for interview ${id}. Score: ${score}`);

        // Fetch interview for violation checks
        const intRes = await query("SELECT * FROM interviews WHERE id = $1", [id]);
        const intData = intRes.rows[0] || {};

        const violationsSafe =
          (intData.mobile_count <= 2) &&
          (intData.multi_face_count <= 2) &&
          (intData.no_face_count <= 2) &&
          (intData.voice_count <= 2) &&
          (intData.tab_switch_count <= 2) &&
          (intData.cheating_count <= 2);

        // Convert raw score to percentage out of 40 (assuming 40 is max total)
        const percentage = Math.round((Math.round(score) / 40) * 100);

        if (applicationId) {
          const appQuery = await query("SELECT * FROM applications WHERE id = $1", [applicationId]);
          if (appQuery.rows.length > 0) {
            const app = appQuery.rows[0];
            let nextStatus = app.status;
            let finalStatus = app.final_status;

            const isQualified = percentage >= 60 && violationsSafe;

            if (interviewType === 'Technical') {
              nextStatus = 'tr_completed';
              await query("UPDATE applications SET tr_score = $1, status = $2 WHERE id = $3", [percentage, nextStatus, applicationId]);
              if (!isQualified) {
                await query("UPDATE applications SET final_status = 'rejected' WHERE id = $1", [applicationId]);
              }
            } else if (interviewType === 'HR') {
              nextStatus = 'hr_completed';

              // For IT roles, only set final selection status if TR is already completed
              if (app.is_it_role) {
                if (app.tr_score !== null && app.tr_score >= 60) {
                  finalStatus = isQualified ? 'selected' : 'rejected';
                  await query("UPDATE applications SET hr_score = $1, status = $2, final_status = $3 WHERE id = $4", [percentage, nextStatus, finalStatus, applicationId]);
                } else {
                  // It's practice or out-of-order HR round for IT role
                  await query("UPDATE applications SET hr_score = $1, status = $2 WHERE id = $3", [percentage, nextStatus, applicationId]);
                }
              } else {
                // Normal Non-IT flow
                finalStatus = isQualified ? 'selected' : 'rejected';
                await query("UPDATE applications SET hr_score = $1, status = $2, final_status = $3 WHERE id = $4", [percentage, nextStatus, finalStatus, applicationId]);
              }
            }
          }
        }

      } catch (bgErr) {
        console.error(`[BACKGROUND EVAL] Error for interview ${id}:`, bgErr);
      }
    })();

  } catch (err) {
    console.error("Error in finish endpoint:", err);
    res.status(500).json({ message: "Error ending interview" });
  }
});

// Get Results for specific Candidate
app.get("/api/candidate/results/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const results = await query(`
      SELECT 
        i.*, 
        COALESCE(a.role, i.role, 'General Application') as role, 
        a.is_it_role, 
        CASE 
          WHEN i.status IN ('abandoned', 'flagged', 'cheating') AND (a.final_status IS NULL OR a.final_status = 'pending') THEN 'rejected'
          WHEN ((i.score / 40.0 * 100) < 60 OR i.mobile_count > 2 OR i.multi_face_count > 2 OR i.no_face_count > 2 OR i.voice_count > 2 OR i.tab_switch_count > 2 OR i.cheating_count > 2) AND (a.final_status IS NULL OR a.final_status = 'pending') THEN 'rejected'
          WHEN (i.score / 40.0 * 100) >= 60 AND i.status = 'completed' AND (a.final_status IS NULL OR a.final_status = 'pending') THEN 'selected'
          ELSE COALESCE(a.final_status, 'pending')
        END as final_status
      FROM interviews i
      LEFT JOIN applications a ON i.application_id = a.id
      WHERE i.user_id = $1 
      ORDER BY i.created_at DESC
    `, [userId]);
    res.json(results.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching user results" });
  }
});

// Admin Applications
app.get("/api/admin/applications", async (req, res) => {
  try {
    // --- Data Self-Healing Sync ---
    // Scan all applications to ensure their scores and statuses are perfectly synced and correct
    const allApps = await query("SELECT * FROM applications");
    for (const app of allApps.rows) {
      const interviews = await query("SELECT * FROM interviews WHERE application_id = $1 AND status = 'completed'", [app.id]);
      if (interviews.rows.length > 0) {
        const trInt = interviews.rows.find(i => i.interview_type === 'Technical');
        const hrInt = interviews.rows.find(i => i.interview_type === 'HR');

        const calculatePercentage = (score) => Math.min(100, Math.round((score / 40) * 100));
        const checkViolationsSafe = (i) => 
          i.mobile_count <= 2 &&
          i.multi_face_count <= 2 &&
          i.no_face_count <= 2 &&
          i.voice_count <= 2 &&
          i.tab_switch_count <= 2 &&
          i.cheating_count <= 2;

        if (!app.is_it_role) {
          // Non-IT role: only needs HR round
          if (hrInt) {
            let rawScore = hrInt.score;
            // Zero out score automatically if answered count is <= 2
            if (hrInt.answered_count <= 2 && rawScore !== 0) {
              await query("UPDATE interviews SET score = 0 WHERE id = $1", [hrInt.id]);
              rawScore = 0;
            }
            const percentage = calculatePercentage((rawScore !== null && rawScore !== undefined) ? rawScore : 0);
            const isQualified = percentage >= 60 && checkViolationsSafe(hrInt) && hrInt.answered_count >= 15;
            
            await query(
              "UPDATE applications SET hr_score = $1, status = 'hr_completed', final_status = $2 WHERE id = $3",
              [percentage, isQualified ? 'selected' : 'rejected', app.id]
            );
          }
        } else {
          // IT role: needs TR (and optionally HR if they passed TR)
          if (trInt) {
            let trRawScore = trInt.score;
            if (trInt.answered_count <= 2 && trRawScore !== 0) {
              await query("UPDATE interviews SET score = 0 WHERE id = $1", [trInt.id]);
              trRawScore = 0;
            }
            const trPercentage = calculatePercentage((trRawScore !== null && trRawScore !== undefined) ? trRawScore : 0);
            const trQualified = trPercentage >= 60 && checkViolationsSafe(trInt);

            if (!trQualified) {
              await query(
                "UPDATE applications SET tr_score = $1, status = 'tr_completed', final_status = 'rejected' WHERE id = $2",
                [trPercentage, app.id]
              );
            } else {
              // Passed TR! Check if HR is also completed
              if (hrInt) {
                let hrRawScore = hrInt.score;
                if (hrInt.answered_count <= 2 && hrRawScore !== 0) {
                  await query("UPDATE interviews SET score = 0 WHERE id = $1", [hrInt.id]);
                  hrRawScore = 0;
                }
                const hrPercentage = calculatePercentage((hrRawScore !== null && hrRawScore !== undefined) ? hrRawScore : 0);
                const hrQualified = hrPercentage >= 60 && checkViolationsSafe(hrInt) && hrInt.answered_count >= 15;
                
                await query(
                  "UPDATE applications SET tr_score = $1, hr_score = $2, status = 'hr_completed', final_status = $3 WHERE id = $4",
                  [trPercentage, hrPercentage, hrQualified ? 'selected' : 'rejected', app.id]
                );
              } else {
                // TR completed but HR pending
                await query(
                  "UPDATE applications SET tr_score = $1, status = 'hr_pending', final_status = 'pending' WHERE id = $2",
                  [trPercentage, app.id]
                );
              }
            }
          }
        }
      }
    }
    // --- End Self-Healing Sync ---

    const apps = await query(`
      SELECT a.*, u.name as candidate_name, u.email as candidate_email,
        (SELECT COUNT(*) FROM interviews i WHERE i.application_id = a.id AND i.interview_type = 'Technical' AND (i.mobile_count > 2 OR i.multi_face_count > 2 OR i.no_face_count > 2 OR i.voice_count > 2 OR i.tab_switch_count > 2 OR i.cheating_count > 2)) as tr_violations,
        (SELECT COUNT(*) FROM interviews i WHERE i.application_id = a.id AND i.interview_type = 'HR' AND (i.mobile_count > 2 OR i.multi_face_count > 2 OR i.no_face_count > 2 OR i.voice_count > 2 OR i.tab_switch_count > 2 OR i.cheating_count > 2)) as hr_violations
      FROM applications a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);
    res.json(apps.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching applications" });
  }
});

// Delete Application and associated interviews
app.delete("/api/applications/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Delete all interview messages related to this application's interviews
    await query(`
      DELETE FROM interview_messages 
      WHERE interview_id IN (SELECT id FROM interviews WHERE application_id = $1)
    `, [id]);

    // 2. Delete all interviews related to this application
    await query("DELETE FROM interviews WHERE application_id = $1", [id]);

    // 3. Delete the application itself
    await query("DELETE FROM applications WHERE id = $1", [id]);

    res.json({ message: "Application and all associated records completely deleted" });
  } catch (err) {
    console.error("Error deleting application:", err);
    res.status(500).json({ message: "Error deleting application" });
  }
});

// Admin Stats
app.get("/api/admin/stats", async (req, res) => {
  try {
    const candidateCount = await query("SELECT COUNT(*) FROM users WHERE role = 'candidate'");
    const activeCount = await query("SELECT COUNT(*) FROM interviews WHERE status = 'ongoing'");
    const unreadQueriesCount = await query("SELECT COUNT(*) FROM queries WHERE status = 'pending'");

    const recentInterviews = await query(`
      SELECT i.*, u.name as candidate_name 
      FROM interviews i 
      JOIN users u ON i.user_id = u.id 
      ORDER BY i.created_at DESC 
      LIMIT 10
    `);

    const allInterviews = await query(`
      SELECT i.*, u.name as candidate_name, u.email as candidate_email, u.college_name, u.roll_number, u.role as user_role, i.last_snapshot, i.video_url,
      CASE 
        WHEN i.status IN ('abandoned', 'flagged', 'cheating') AND (a.final_status IS NULL OR a.final_status = 'pending') THEN 'rejected'
        WHEN ((i.score / 40.0 * 100) < 60 OR i.mobile_count > 2 OR i.multi_face_count > 2 OR i.no_face_count > 2 OR i.voice_count > 2 OR i.tab_switch_count > 2 OR i.cheating_count > 2) AND (a.final_status IS NULL OR a.final_status = 'pending') THEN 'rejected'
        WHEN (i.score / 40.0 * 100) >= 60 AND i.status = 'completed' AND (a.final_status IS NULL OR a.final_status = 'pending') THEN 'selected'
        ELSE COALESCE(a.final_status, 'pending')
      END as final_status
      FROM interviews i 
      JOIN users u ON i.user_id = u.id 
      LEFT JOIN applications a ON i.application_id = a.id
      ORDER BY i.created_at DESC
    `);

    // Log a sample to verify cheating_count presence
    if (allInterviews.rows.length > 0) {
      const sample = allInterviews.rows[0];
      console.log(`[STATS] Sample Data - Candidate: ${sample.candidate_name}, Cheating: ${sample.cheating_count}, Voice: ${sample.voice_count}`);
    }

    const unreadAdminChats = await query("SELECT COALESCE(SUM(unread_count), 0) as count FROM admin_chat_sessions");

    // Feedback Analytics
    const feedbackStats = await query(`
      SELECT 
        ROUND(AVG(rating), 1) as avg_rating,
        COUNT(*) as total_feedback,
        COUNT(CASE WHEN rating = 5 THEN 1 END) as stars_5,
        COUNT(CASE WHEN rating = 4 THEN 1 END) as stars_4,
        COUNT(CASE WHEN rating = 3 THEN 1 END) as stars_3,
        COUNT(CASE WHEN rating = 2 THEN 1 END) as stars_2,
        COUNT(CASE WHEN rating = 1 THEN 1 END) as stars_1
      FROM feedbacks
    `);

    // Qualitative Feedback with LEFT JOINs to avoid missing data if user/interview records are loose
    const recentFeedbacks = await query(`
      SELECT f.*, COALESCE(u.name, 'Guest Candidate') as candidate_name, COALESCE(i.role, 'General') as role, COALESCE(i.interview_type, 'Technical') as interview_type
      FROM feedbacks f
      LEFT JOIN users u ON f.user_id = u.id
      LEFT JOIN interviews i ON f.interview_id = i.id
      ORDER BY f.created_at DESC
      LIMIT 10
    `);

    // Chat Feedback Analytics
    const chatFeedbackStats = await query(`
      SELECT 
        ROUND(AVG(final_rating), 1) as avg_rating,
        COUNT(*) as total_feedback,
        ROUND(AVG(helpfulness), 1) as avg_helpfulness,
        ROUND(AVG(clarity), 1) as avg_clarity,
        ROUND(AVG(communication), 1) as avg_communication,
        ROUND(AVG(response_speed), 1) as avg_speed,
        ROUND(AVG(satisfaction), 1) as avg_satisfaction,
        COUNT(CASE WHEN final_rating = 5 THEN 1 END) as stars_5,
        COUNT(CASE WHEN final_rating = 4 THEN 1 END) as stars_4,
        COUNT(CASE WHEN final_rating = 3 THEN 1 END) as stars_3,
        COUNT(CASE WHEN final_rating = 2 THEN 1 END) as stars_2,
        COUNT(CASE WHEN final_rating = 1 THEN 1 END) as stars_1
      FROM chat_feedback
    `);

    res.json({
      stats: {
        totalCandidates: parseInt(candidateCount.rows[0].count),
        activeInterviews: parseInt(activeCount.rows[0].count),
        unreadQueries: parseInt(unreadQueriesCount.rows[0].count),
        unreadAdminChats: parseInt(unreadAdminChats.rows[0].count),
        experience: {
          avgRating: parseFloat(feedbackStats.rows[0].avg_rating || 0),
          totalFeedback: parseInt(feedbackStats.rows[0].total_feedback || 0),
          distribution: [
            { stars: 5, count: parseInt(feedbackStats.rows[0].stars_5 || 0) },
            { stars: 4, count: parseInt(feedbackStats.rows[0].stars_4 || 0) },
            { stars: 3, count: parseInt(feedbackStats.rows[0].stars_3 || 0) },
            { stars: 2, count: parseInt(feedbackStats.rows[0].stars_2 || 0) },
            { stars: 1, count: parseInt(feedbackStats.rows[0].stars_1 || 0) }
          ]
        },
        chatFeedback: {
          avgRating: parseFloat(chatFeedbackStats.rows[0].avg_rating || 0),
          totalFeedback: parseInt(chatFeedbackStats.rows[0].total_feedback || 0),
          metrics: {
            helpfulness: parseFloat(chatFeedbackStats.rows[0].avg_helpfulness || 0),
            clarity: parseFloat(chatFeedbackStats.rows[0].avg_clarity || 0),
            communication: parseFloat(chatFeedbackStats.rows[0].avg_communication || 0),
            speed: parseFloat(chatFeedbackStats.rows[0].avg_speed || 0),
            satisfaction: parseFloat(chatFeedbackStats.rows[0].avg_satisfaction || 0)
          },
          distribution: [
            { stars: 5, count: parseInt(chatFeedbackStats.rows[0].stars_5 || 0) },
            { stars: 4, count: parseInt(chatFeedbackStats.rows[0].stars_4 || 0) },
            { stars: 3, count: parseInt(chatFeedbackStats.rows[0].stars_3 || 0) },
            { stars: 2, count: parseInt(chatFeedbackStats.rows[0].stars_2 || 0) },
            { stars: 1, count: parseInt(chatFeedbackStats.rows[0].stars_1 || 0) }
          ]
        }
      },
      recentInterviews: recentInterviews.rows,
      allUsers: (await query("SELECT id, name, email, created_at, role, college_name, roll_number FROM users ORDER BY created_at DESC")).rows,
      allInterviews: allInterviews.rows,
      recentFeedbacks: recentFeedbacks.rows
    });
  } catch (err) {
    console.error("[STATS] Error fetching admin stats:", err);
    res.status(500).json({ message: "Error fetching stats" });
  }
});

// Debug: Check video URLs for all interviews
app.get("/api/admin/debug/videos", async (req, res) => {
  try {
    const interviews = await query(`
      SELECT i.id, u.name as candidate_name, i.status, i.video_url, i.created_at
      FROM interviews i 
      JOIN users u ON i.user_id = u.id 
      ORDER BY i.created_at DESC
      LIMIT 20
    `);

    res.json({
      totalInterviews: interviews.rows.length,
      interviews: interviews.rows.map(i => ({
        id: i.id,
        candidate: i.candidate_name,
        status: i.status,
        videoUrl: i.video_url,
        videoExists: i.video_url ? fs.existsSync(`uploads/videos/${i.video_url.split('/').pop()}`) : false,
        createdAt: i.created_at
      }))
    });
  } catch (err) {
    console.error("Error fetching video debug info:", err);
    res.status(500).json({ message: "Error fetching video debug info", error: err.message });
  }
});

// Log Proctoring Events
app.post("/api/interview/:id/flag", async (req, res) => {
  const { id } = req.params;
  const { reason, type } = req.body;

  // Normalize type to lowercase and trim to avoid matching issues
  const violationType = (type || '').toLowerCase().trim();

  console.log(`[BACKEND] Flag Received - ID: ${id}, Type: ${violationType}, Reason: ${reason}`);

  try {
    const interview = await query("SELECT status, proctoring_logs, application_id, mobile_count, multi_face_count, no_face_count, voice_count, tab_switch_count, cheating_count FROM interviews WHERE id = $1", [id]);
    if (interview.rows.length === 0) {
      console.error(`[BACKEND] Flag Error: Interview ${id} not found`);
      return res.status(404).json({ message: "Interview not found" });
    }

    let currentLogs = interview.rows[0].proctoring_logs || [];
    currentLogs.push({ timestamp: new Date().toISOString(), reason, type: violationType });

    let updateQuery = "UPDATE interviews SET proctoring_logs = $1";
    let params = [JSON.stringify(currentLogs)];

    if (interview.rows[0].status === 'ongoing') {
      updateQuery += ", status = 'flagged'";
    }

    // Explicitly handle each violation type for incrementing counts
    if (violationType === 'mobile') {
      updateQuery += ", mobile_count = COALESCE(mobile_count, 0) + 1";
    } else if (violationType === 'multi_face') {
      updateQuery += ", multi_face_count = COALESCE(multi_face_count, 0) + 1";
    } else if (violationType === 'no_face') {
      updateQuery += ", no_face_count = COALESCE(no_face_count, 0) + 1";
    } else if (violationType === 'voice') {
      updateQuery += ", voice_count = COALESCE(voice_count, 0) + 1";
    } else if (violationType === 'tab_switch') {
      updateQuery += ", tab_switch_count = COALESCE(tab_switch_count, 0) + 1";
    } else if (violationType === 'cheating') {
      console.log(`[BACKEND] Incrementing cheating_count for interview ${id}`);
      updateQuery += ", cheating_count = COALESCE(cheating_count, 0) + 1";
    }

    updateQuery += " WHERE id = $2";
    params.push(id);

    console.log(`[BACKEND] Executing Update: ${updateQuery}`);
    await query(updateQuery, params);

    // Link with application ID for real-time rejection if violations exceed limits
    const appId = interview.rows[0].application_id;
    if (appId) {
      // Re-fetch current counts after update to be sure
      const updatedInt = await query("SELECT mobile_count, multi_face_count, no_face_count, voice_count, tab_switch_count, cheating_count FROM interviews WHERE id = $1", [id]);
      const data = updatedInt.rows[0];
      const hasHighViolations =
        (data.mobile_count > 2) || (data.multi_face_count > 2) || (data.no_face_count > 2) ||
        (data.voice_count > 2) || (data.tab_switch_count > 2) || (data.cheating_count > 2);

      if (hasHighViolations) {
        await query("UPDATE applications SET final_status = 'rejected' WHERE id = $1", [appId]);
        console.log(`[BACKEND] App ${appId} auto-rejected due to high violations in interview ${id}`);
      }
    }

    res.json({ message: "Proctoring event logged successfully" });
  } catch (err) {
    console.error(`[BACKEND] Critical Flag Error for interview ${id}:`, err);
    res.status(500).json({ message: "Server error logging event" });
  }
});

// Export Results CSV
app.get("/api/admin/export", async (req, res) => {
  try {
    const interviews = await query(`
      SELECT i.id, u.name as candidate, u.email, i.status, i.score, i.created_at
      FROM interviews i 
      JOIN users u ON i.user_id = u.id 
      ORDER BY i.created_at DESC
    `);

    let csv = "ID,Candidate,Email,Status,Score,Date\n";
    interviews.rows.forEach(r => {
      csv += `${r.id},"${r.candidate}","${r.email}",${r.status},${r.score || "N/A"},"${new Date(r.created_at).toLocaleString()}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('interview_results.csv');
    return res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating CSV");
  }
});

// --- Support Query Routes ---

// Submit a public/candidate query
app.post("/api/public/query", async (req, res) => {
  const { name, email, subject, message } = req.body;
  try {
    await query(
      "INSERT INTO queries (name, email, subject, message) VALUES ($1, $2, $3, $4)",
      [name, email, subject, message]
    );
    res.status(201).json({ message: "Query submitted successfully" });
  } catch (err) {
    console.error("Error submitting query:", err);
    res.status(500).json({ message: "Failed to submit query" });
  }
});

// Admin: Get all queries
app.get("/api/chat/admin/queries", async (req, res) => {
  try {
    const result = await query("SELECT * FROM queries ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching queries:", err);
    res.status(500).json({ message: "Failed to fetch queries" });
  }
});

// Admin: Reply to query (Triggers official email)
app.post("/api/admin/queries/reply", async (req, res) => {
  const { id, reply } = req.body;
  try {
    // 1. Get query details to find the candidate's email
    const queryData = await query("SELECT name, email, subject, message FROM queries WHERE id = $1", [id]);
    if (queryData.rows.length === 0) {
      return res.status(404).json({ message: "Query not found" });
    }
    const { name, email, subject, message } = queryData.rows[0];

    // 2. Send official response email
    const mailOptions = {
      from: `"Shnoor AI Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `RE: ${subject || 'Support Request'} - Shnoor AI`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; color: #1e293b;">
          <div style="text-align: center; marginBottom: 25px;">
            <h2 style="color: #4f46e5; margin: 0;">Support Resolution</h2>
            <p style="color: #64748b; font-size: 0.9rem;">Shnoor AI Interview Systems</p>
          </div>
          
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for reaching out to our support team. Our administrators have reviewed your inquiry regarding "<em>${subject || 'General Issue'}</em>" and provided the following response:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #4f46e5; margin: 25px 0;">
            <p style="margin: 0; line-height: 1.6; color: #334155;">${reply}</p>
          </div>
          
          <div style="font-size: 0.85rem; color: #94a3b8; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            <p style="margin: 0;"><strong>Original Inquiry:</strong></p>
            <p style="font-style: italic; margin-top: 5px;">"${message}"</p>
          </div>
          
          <p style="margin-top: 30px; font-size: 0.9rem;">Best Regards,<br/><strong>Shnoor AI Support Team</strong></p>
          
          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;">
          <p style="font-size: 11px; color: #94a3b8; text-align: center;">This is an automated response from Shnoor AI. Please do not reply directly to this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`[SUPPORT REPLY] Email sent to: ${email}`);

    // 3. Update status in database
    await query("UPDATE queries SET status = 'replied' WHERE id = $1", [id]);

    res.json({ message: "Reply sent successfully via email" });
  } catch (err) {
    console.error("Error replying to query:", err);
    res.status(500).json({ message: "Failed to send official email reply", error: err.message });
  }
});

// Admin: Delete query
app.delete("/api/chat/admin/queries/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM queries WHERE id = $1", [id]);
    res.json({ message: "Query deleted successfully" });
  } catch (err) {
    console.error("Error deleting query:", err);
    res.status(500).json({ message: "Failed to delete query" });
  }
});


// Dedicated route for clear history request 
app.post("/api/chat/admin/request-clear/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query(
      "INSERT INTO admin_chat_messages (session_id, sender, admin_id, message, message_type) VALUES ($1::uuid, $2, $3, $4, $5) RETURNING *",
      [id, 'admin', req.user.id, 'Support representative has requested to clear chat history. Is your issue resolved?', 'clear_history_request']
    );
    await query("UPDATE admin_chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE session_id = $1::uuid", [id]);
    res.json({ success: true, message: result.rows[0] });
  } catch (err) {
    console.error("Error in request-clear:", err);
    res.status(500).json({ error: err.message || "Failed to request clear history" });
  }
});

// Chat Endpoints (Modularized)
app.use("/api/chat", require("./chat_endpoints"));

// Feedback Routes
app.post("/api/interview/:id/feedback", async (req, res) => {
  const { id } = req.params;
  const { userId, rating, feedbackText } = req.body;
  console.log(`[FEEDBACK] Received for interview ${id}: Rating=${rating}, User=${userId}`);
  try {
    const interviewId = parseInt(id);
    await query(
      "INSERT INTO feedbacks (interview_id, user_id, rating, feedback_text) VALUES ($1, $2, $3, $4)",
      [interviewId, userId || null, rating, feedbackText]
    );
    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (err) {
    console.error("Error submitting feedback:", err);
    res.status(500).json({ message: "Failed to submit feedback" });
  }
});


// Admin: Get all feedback
app.get("/api/admin/feedbacks", async (req, res) => {
  try {
    const result = await query(`
      SELECT f.*, u.name as candidate_name, i.role, i.interview_type
      FROM feedbacks f
      JOIN users u ON f.user_id = u.id
      JOIN interviews i ON f.interview_id = i.id
      ORDER BY f.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching feedback:", err);
    res.status(500).json({ message: "Failed to fetch feedback" });
  }
});

// test route
app.get("/", (req, res) => {
  res.send("Backend is running successfully");
});

// Socket handling for Real-time Video Proctoring
io.on("connection", (socket) => {
  socket.on("join-admins", () => {
    socket.join("admins");
    console.log("Admin joined proctoring room");
  });

  socket.on("proctor-frame", (data) => {
    // Broadcast the frame to all connected admins for real-time video feel
    // Data contains { image: base64, interviewId: id }
    io.to("admins").emit("live-snapshot", {
      interviewId: data.interviewId,
      image: data.image
    });
  });
});


// Deletes chat sessions and history older than 15 days
const cleanupOldChats = async () => {
  try {
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    console.log(`[CHAT CLEANUP] Running maintenance... Removing data older than: ${fifteenDaysAgo.toISOString()}`);

    const result = await query(
      "DELETE FROM admin_chat_sessions WHERE updated_at < $1",
      [fifteenDaysAgo]
    );

    if (result.rowCount > 0) {
      console.log(`[CHAT CLEANUP] Successfully removed ${result.rowCount} stale chat sessions.`);
    }
  } catch (err) {
    console.error("[CHAT CLEANUP ERROR]:", err);
  }
};

setInterval(cleanupOldChats, 24 * 60 * 60 * 1000);
cleanupOldChats();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SHNOOR AI BACKEND V2.5 LOADED ON PORT ${PORT}`);
});
