const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const mysql = require("mysql2");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views/pages"));
app.set("layout", "../layout/main");
app.use(expressLayouts);

// ===== Database (Promise-based) =====
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "12345678",
  database: "pm_internship"
}).promise();

// Test connection
(async () => {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("✅ MySQL connected, test query success:", rows);
  } catch (err) {
    console.error("❌ MySQL connection failed:", err);
  }
})();

// ===== Routes =====

// Home
app.get("/", (req, res) => {
  res.render("index", { title: "PM Internship Scheme" });
});

// Internship Form
app.get("/form", (req, res) => {
  res.render("form", { title: "Internship Application" });
});

// Update form data
app.post("/form", async (req, res) => {
  try {
    const { student_id, education, skills, interests, location } = req.body;
    if (!student_id) return res.status(400).json({ error: "Student ID is required" });

    const skillJSON = skills ? JSON.stringify(skills.split(",").map(s => s.trim())) : JSON.stringify([]);
    const interestJSON = interests ? JSON.stringify(interests.split(",").map(i => i.trim())) : JSON.stringify([]);

    const sql = `UPDATE applications SET education=?, skills=?, interests=?, location=? WHERE id=?`;
    await db.query(sql, [education, skillJSON, interestJSON, location, student_id]);

    console.log("✅ Application updated for student ID:", student_id);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error updating application:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// Success page
app.get("/success", (req, res) => {
  res.render("success", { title: "Application Submitted" });
});

// Signup page
app.get("/signup", (req, res) => {
  res.render("signup", { title: "Signup Page" });
});

// Login page
app.get("/login", (req, res) => {
  res.render("login", { title: "Login Page" });
});

// Signup route
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    await db.query("INSERT INTO applications (name, email, password) VALUES (?, ?, ?)", [name, email, password]);
    console.log(`✅ New user signed up: ${email}`);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.json({ success: false, message: "Email already exists or DB error" });
  }
});

// Login route
app.post("/login", async (req, res) => {
  try {
    console.log("========== LOGIN ATTEMPT ==========");
    let { email, password } = req.body;
    console.log("📥 Payload received:", { email, password });

    if (!email || !password) return res.json({ success: false, message: "Email and password required" });

    email = email.trim();
    password = password.trim();
    console.log("✂️ Trimmed values:", { email, password });

    const [results] = await db.query("SELECT id, name, password FROM applications WHERE email=? LIMIT 1", [email]);
    console.log("📊 DB results:", results);

    if (results.length === 0) return res.json({ success: false, message: "Email not found" });

    const student = results[0];
    const dbPassword = student.password ? student.password.trim() : "";
    console.log("🔍 Comparing passwords:", { dbPassword, inputPassword: password });

    if (dbPassword === password) {
      console.log(`✅ Login successful for ${email}`);
      return res.json({ success: true, studentId: student.id, studentName: student.name });
    } else {
      console.log(`❌ Invalid password for ${email}`);
      return res.json({ success: false, message: "Invalid password" });
    }
  } catch (err) {
    console.error("❌ Login error:", err);
    res.json({ success: false, message: "Server error" });
  }
});

// ===== Check Application =====
app.get("/api/check-application/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const [results] = await db.query("SELECT * FROM applications WHERE id=? LIMIT 1", [studentId]);
    res.json({ applied: results.length > 0 });
  } catch (err) {
    console.error("❌ Check application error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/edit-application/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const { education, skills, interests, location } = req.body;

    // Convert skills and interests to JSON
    const skillJSON = skills ? JSON.stringify(skills) : JSON.stringify([]);
    const interestJSON = interests ? JSON.stringify(interests) : JSON.stringify([]);

    // Update SQL
    const sql = `
      UPDATE applications
      SET education = ?, skills = ?, interests = ?, location = ?
      WHERE id = ?
    `;

    const [result] = await db.query(sql, [education, skillJSON, interestJSON, location, studentId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, message: "Application updated successfully" });
  } catch (err) {
    console.error("❌ Edit application error:", err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// ===== Fetch Filled Application =====
app.get("/application/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;

    // Fetch student application
    const [results] = await db.query(
      "SELECT * FROM applications WHERE id = ? LIMIT 1",
      [studentId]
    );

    if (results.length === 0) {
      return res.send("No application found for this student.");
    }

    const appData = results[0];

    // Render EJS
    res.render("filled", {
      title: "Your Application",
      application: appData
    });
  } catch (err) {
    console.error("❌ Fetch application error:", err);
    res.status(500).send("Database error");
  }
});


// ===== Internship Recommendation =====
app.get("/recommend/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const [rows] = await db.query("SELECT * FROM applications WHERE id=?", [studentId]);

    if (!rows || rows.length === 0) return res.status(404).send("Student not found");
    const student = rows[0];

    let studentSkills = [];
    try { studentSkills = student.skills.map(s => s.toLowerCase()); } catch { studentSkills = []; }
    const studentLocation = (student.location || "").toLowerCase();

    console.log("📌 Student Skills:", studentSkills);
    console.log("📌 Student Location:", studentLocation);

    const internships = require("./data/internships.json");

    const recommended = internships
      .map(intern => {
        const internSkills = intern.skills.map(s => s.toLowerCase());
        const matchingSkills = internSkills.filter(skill => studentSkills.includes(skill));
        const skillMatch = matchingSkills.length / internSkills.length;

        const locationMatch = intern.locations.some(loc => studentLocation.includes(loc.toLowerCase())) ? 1 : 0;
        const score = skillMatch * 0.7 + locationMatch * 0.3;

        console.log("----------------------------");
        console.log("Internship:", intern.title);
        console.log("Required Skills:", internSkills);
        console.log("Matching Skills:", matchingSkills);
        console.log("Skill Match Ratio:", skillMatch.toFixed(2));
        console.log("Location Match:", locationMatch);
        console.log("Final Score:", score.toFixed(2));

        return { ...intern, score };
      })
      .filter(i => i.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    res.render("recommend", { title: "Your Recommendations", student, recommended });
  } catch (err) {
    console.error("❌ Recommendation error:", err);
    res.status(500).send("Server error");
  }
});

// Start server
app.listen(3000, () => console.log("🚀 Server running at http://localhost:3000"));
