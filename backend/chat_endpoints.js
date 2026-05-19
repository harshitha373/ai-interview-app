const express = require('express');
const router = express.Router();
const { query } = require("./db");

// For token authentication
const authenticateToken = (req, res, next) => {
  const jwt = require("jsonwebtoken");
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET || "secret", (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

// To send all sessions to frontend when requested 
router.get("/admin/sessions", async (req, res) => {
  try {
    const result = await query("SELECT * FROM admin_chat_sessions ORDER BY updated_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// To send the specific session msgs to frontend when requested 
router.get("/admin/sessions/:id", async (req, res) => {
  try {
    const result = await query("SELECT * FROM admin_chat_messages WHERE session_id = $1 ORDER BY created_at ASC", [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// To get data from frontend of admin msg and saving them in db.
router.post("/admin/message", authenticateToken, async (req, res) => {
  const { session_id, message, message_type, file_path, reply_to_id } = req.body;
  try {
    const result = await query(
      "INSERT INTO admin_chat_messages (session_id, sender, admin_id, message, message_type, file_path, reply_to_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [session_id, 'admin', req.user.id, message, message_type || 'text', file_path || null, reply_to_id || null]
    );
    await query("UPDATE admin_chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE session_id = $1", [session_id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// for editing msg
router.put("/admin/message/:id", async (req, res) => {
  try {
    await query("UPDATE admin_chat_messages SET message = $1 WHERE id = $2", [req.body.message, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to edit" }); }
});

router.delete("/admin/message/:id", async (req, res) => {
  try {
    await query("DELETE FROM admin_chat_messages WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to delete" }); }
});

// For archive option 
router.put("/admin/sessions/:id/archive", async (req, res) => {
  try {
    await query("UPDATE admin_chat_sessions SET archived = $1 WHERE session_id = $2", [req.body.archived, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to archive" }); }
});

// For locked option msgs
router.put("/admin/sessions/:id/pin", async (req, res) => {
  try {
    await query("UPDATE admin_chat_sessions SET pin = $1 WHERE session_id = $2", [req.body.pin || null, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to pin" }); }
});

// API to initiate clear history request from admin
router.post("/admin/request-clear/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Insert a special system-like message that the candidate will see
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

// API for candidate to respond to clear history request
router.post("/candidate/sessions/:id/respond-clear", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { response, message_id } = req.body; // response: 'ok' or 'no'
  
  try {
    if (response === 'ok') {
      // Update the request message to show it was accepted
      await query("UPDATE admin_chat_messages SET feedback_status = 'accepted' WHERE id = $1", [message_id]);
      res.json({ success: true, action: 'trigger_feedback' });
    } else {
      // Send rejection message to admin
      await query(
        "INSERT INTO admin_chat_messages (session_id, sender, message, message_type) VALUES ($1::uuid, $2, $3, $4)",
        [id, 'candidate', 'Clear history request rejected. My issue is not yet resolved.', 'text']
      );
      
      await query("UPDATE admin_chat_messages SET feedback_status = 'rejected' WHERE id = $1", [message_id]);
      await query("UPDATE admin_chat_sessions SET updated_at = CURRENT_TIMESTAMP, unread_count = unread_count + 1 WHERE session_id = $1::uuid", [id]);
      
      res.json({ success: true, action: 'rejected' });
    }
  } catch (err) {
    console.error("Error in respond-clear:", err);
    res.status(500).json({ error: err.message || "Failed to respond to clear history request" });
  }
});

// Modified clear endpoint to be callable by anyone with right context if needed, 
// but primarily used after feedback is submitted.
router.delete("/admin/sessions/:id/clear", async (req, res) => {
  try {
    // Instead of deleting, maybe we just mark them as archived/deleted for this session
    // but the user said "history should be cleared keep in mind".
    await query("DELETE FROM admin_chat_messages WHERE session_id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to clear" }); }
});


router.delete("/admin/sessions/:id", async (req, res) => {
  try {
    await query("DELETE FROM admin_chat_sessions WHERE session_id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to delete session" }); }
});

// For getting msg data sent by candidate to admin
router.get("/candidate/session", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    let session = await query("SELECT * FROM admin_chat_sessions WHERE user_id = $1", [userId]);

    if (session.rows.length === 0) {
      const user = await query("SELECT name, email, role FROM users WHERE id = $1", [userId]);
      if (user.rows.length === 0) return res.status(404).json({ error: "User not found" });

      const { name, email, role } = user.rows[0];
      session = await query(
        "INSERT INTO admin_chat_sessions (user_id, user_name, user_email, user_role) VALUES ($1, $2, $3, $4) RETURNING *",
        [userId, name, email, role]
      );
    }

    const sessionId = session.rows[0].session_id;
    const messages = await query(
      "SELECT id, session_id, sender, admin_id, message, message_type, file_path, reply_to_id, feedback_done, created_at FROM admin_chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
      [sessionId]
    );

    res.json({ session: session.rows[0], messages: messages.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load chat" });
  }
});
// API for candidate sending msg to admin
router.post("/candidate/message", authenticateToken, async (req, res) => {
  const { session_id, message, message_type, file_path } = req.body;
  try {
    const result = await query(
      "INSERT INTO admin_chat_messages (session_id, sender, message, message_type, file_path) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [session_id, 'candidate', message, message_type || 'text', file_path || null]
    );
    await query("UPDATE admin_chat_sessions SET updated_at = CURRENT_TIMESTAMP, unread_count = unread_count + 1 WHERE session_id = $1", [session_id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

router.post("/feedback", async (req, res) => {
  const {
    candidateId,
    adminId,
    adminMessageId,
    helpfulness,
    clarity,
    communication,
    responseSpeed,
    satisfaction,
    comment
  } = req.body;

  try {
    // Determine the admin who sent the message
    const msgResult = await query("SELECT admin_id FROM admin_chat_messages WHERE id = $1", [adminMessageId]);
    const actualAdminId = msgResult.rows.length > 0 ? msgResult.rows[0].admin_id : adminId;

    const finalRating = Math.round(
      (helpfulness + clarity + communication + responseSpeed + satisfaction) / 5
    );

    const result = await query(
      `INSERT INTO chat_feedback 
      (candidate_id, admin_id, admin_message_id, helpfulness, clarity, 
       communication, response_speed, satisfaction, final_rating, comment)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        candidateId,
        actualAdminId,
        adminMessageId,
        helpfulness,
        clarity,
        communication,
        responseSpeed,
        satisfaction,
        finalRating,
        comment || null
      ]
    );

    // Mark the message as rated
    await query(
      "UPDATE admin_chat_messages SET feedback_done = true WHERE id = $1",
      [adminMessageId]
    );

    res.json({
      message: "Feedback saved successfully",
      feedback: result.rows[0]
    });
  } catch (err) {
    console.error("Error saving chat feedback:", err);
    res.status(500).json({ error: "Failed to save feedback" });
  }
});

// Admin: Get all chat feedback
router.get("/admin/feedbacks", async (req, res) => {
  try {
    const result = await query(`
      SELECT cf.*, u.name as candidate_name, am.message as admin_reply
      FROM chat_feedback cf
      JOIN users u ON cf.candidate_id = u.id
      LEFT JOIN admin_chat_messages am ON cf.admin_message_id = am.id
      ORDER BY cf.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching chat feedback:", err);
    res.status(500).json({ error: "Failed to fetch feedback" });
  }
});

router.put("/admin/sessions/:id/read", async (req, res) => {
  try {
    await query("UPDATE admin_chat_sessions SET unread_count = 0 WHERE session_id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

module.exports = router;

