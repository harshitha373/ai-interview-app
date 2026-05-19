const { query } = require('./db');

const initDB = async () => {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'candidate',
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP,
        college_name VARCHAR(255),
        roll_number VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // tables created so for new users column should be avaliable right ??
    try {
      await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)");
      await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP");
      await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS college_name VARCHAR(255)");
      await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number VARCHAR(100)");
    } catch (e) {
      console.log("User reset columns already exist or error checking:", e.message);
    }

    // Created Applications table
    await query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        role VARCHAR(255),
        is_it_role BOOLEAN DEFAULT true,
        status VARCHAR(50) DEFAULT 'applied',
        tr_score INTEGER,
        hr_score INTEGER,
        final_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Interviews table
    await query(`
      CREATE TABLE IF NOT EXISTS interviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        resume_text TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        result TEXT,
        proctoring_logs JSONB,
        score INTEGER,
        mobile_count INTEGER DEFAULT 0,
        multi_face_count INTEGER DEFAULT 0,
        no_face_count INTEGER DEFAULT 0,
        voice_count INTEGER DEFAULT 0,
        tab_switch_count INTEGER DEFAULT 0,
        answered_count INTEGER DEFAULT 0,
        last_snapshot TEXT,
        blueprint JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure new columns exist if table was already created
    try {
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS score INTEGER");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS mobile_count INTEGER DEFAULT 0");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS multi_face_count INTEGER DEFAULT 0");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS no_face_count INTEGER DEFAULT 0");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS voice_count INTEGER DEFAULT 0");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS tab_switch_count INTEGER DEFAULT 0");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS answered_count INTEGER DEFAULT 0");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS pending_count INTEGER DEFAULT 0");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS last_snapshot TEXT");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS cheating_count INTEGER DEFAULT 0");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS video_url TEXT");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS role VARCHAR(100)");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS difficulty_level INTEGER DEFAULT 1");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS resume_file BYTEA");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS interview_type VARCHAR(50) DEFAULT 'Technical'");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS blueprint JSONB");
      await query("ALTER TABLE interviews ADD COLUMN IF NOT EXISTS application_id INTEGER REFERENCES applications(id)");
    } catch (e) {
      console.log("Columns already exist or error checking:", e.message);
    }

    // Create Messages table (for the AI chat)
    await query(`
      CREATE TABLE IF NOT EXISTS interview_messages (
        id SERIAL PRIMARY KEY,
        interview_id INTEGER REFERENCES interviews(id),
        role VARCHAR(50), -- 'ai' or 'user'
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Colleges table
    await query(`
      CREATE TABLE IF NOT EXISTS colleges (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'inactive',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Colleges if empty
    const collegeCount = await query("SELECT COUNT(*) FROM colleges");
    if (parseInt(collegeCount.rows[0].count) === 0) {
      try {
        const customColleges = require('./custom_colleges.json');

        console.log(`Found ${customColleges.length} unique custom colleges. Seeding to database...`);

        // Batch insert to prevent query size limits
        const batchSize = 100;
        for (let i = 0; i < customColleges.length; i += batchSize) {
          const batch = customColleges.slice(i, i + batchSize);
          const values = batch.map((_, index) => `($${index + 1}, 'inactive')`).join(',');
          const queryText = `INSERT INTO colleges (name, status) VALUES ${values} ON CONFLICT (name) DO NOTHING`;
          await query(queryText, batch);
        }
        console.log("Seeded custom colleges dataset successfully.");
      } catch (err) {
        console.error("Failed to seed custom colleges dataset...", err);
        const initialColleges = [
          "Amity University", "Anna University", "BITS Pilani", "Delhi Technological University (DTU)",
          "IIT Bombay", "IIT Delhi", "IIT Madras", "NIT Trichy", "VIT Vellore"
        ];
        for (const college of initialColleges) {
          await query("INSERT INTO colleges (name, status) VALUES ($1, 'inactive') ON CONFLICT (name) DO NOTHING", [college]);
        }
      }
    }

    // Create Support Queries table
    await query(`
      CREATE TABLE IF NOT EXISTS queries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255),
        subject VARCHAR(255),
        message TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Admin Chat Sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS admin_chat_sessions (
        session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users(id),
        user_name VARCHAR(255),
        user_email VARCHAR(255),
        user_role VARCHAR(50),
        archived BOOLEAN DEFAULT false,
        pin VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        unread_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure unread_count exists for existing databases
    try {
      await query("ALTER TABLE admin_chat_sessions ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0");
    } catch (e) {
      console.log("unread_count column already exists or error checking:", e.message);
    }

    // Create Admin Chat Messages table
    await query(`
      CREATE TABLE IF NOT EXISTS admin_chat_messages (
        id SERIAL PRIMARY KEY,
        session_id UUID REFERENCES admin_chat_sessions(session_id) ON DELETE CASCADE,
        sender VARCHAR(50), -- 'admin' or 'candidate'
        message TEXT,
        message_type VARCHAR(50) DEFAULT 'text',
        file_path TEXT,
        reply_to_id INTEGER,
        reactions JSONB DEFAULT '[]'::jsonb,
        deleted_for_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure columns exist for existing databases
    try {
      await query("ALTER TABLE admin_chat_messages ADD COLUMN IF NOT EXISTS deleted_for_admin BOOLEAN DEFAULT false");
      await query("ALTER TABLE admin_chat_messages ADD COLUMN IF NOT EXISTS feedback_status VARCHAR(50)");
      await query("ALTER TABLE admin_chat_messages ADD COLUMN IF NOT EXISTS feedback_reason TEXT");
      await query("ALTER TABLE admin_chat_messages ADD COLUMN IF NOT EXISTS feedback_done BOOLEAN DEFAULT false");
      await query("ALTER TABLE admin_chat_messages ADD COLUMN IF NOT EXISTS admin_id INTEGER REFERENCES users(id)");
    } catch (e) {
      console.log("Chat message columns error check:", e.message);
    }

    // Create Chat Feedback table
    await query(`
      CREATE TABLE IF NOT EXISTS chat_feedback (
        id SERIAL PRIMARY KEY,
        candidate_id INTEGER REFERENCES users(id),
        admin_id INTEGER, -- We'll store this as INTEGER, it might be null if not tracked strictly
        admin_message_id INTEGER REFERENCES admin_chat_messages(id) ON DELETE SET NULL,
        helpfulness INTEGER,
        clarity INTEGER,
        communication INTEGER,
        response_speed INTEGER,
        satisfaction INTEGER,
        final_rating INTEGER,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Feedbacks table
    await query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id SERIAL PRIMARY KEY,
        interview_id INTEGER REFERENCES interviews(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER,
        feedback_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed Default Admin User if empty
    const userCount = await query("SELECT COUNT(*) FROM users");
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log("Seeding default admin user...");
      await query(`
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
      `, [
        "Thota Harshitha",
        "harshitha@shnoor.com",
        "$2b$10$L6q.lcje8JdKcXdqRDcPYuFP5fy4u958oFRNpEQlMo4XBa.0V/h4K",
        "admin"
      ]);
      console.log("Default admin user seeded successfully.");
    }

    console.log("Database initialized successfully");
  } catch (err) {
    console.error("Error initializing database:", err);
  }
};

module.exports = initDB;
