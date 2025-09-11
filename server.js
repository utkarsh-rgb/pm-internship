const express = require("express");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const mysql = require("mysql2");
const fs = require("fs");


const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json()); // for JSON body (AJAX, fetch, axios)
// EJS setup


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views/pages")); // pages folder for page templates
app.set("layout", "../layout/main");
app.use(expressLayouts);

const db1 = mysql.createConnection({
  host: "localhost",
  user: "root",     // change if needed
  password: "12345678",     // your MySQL password
  database: "pm_internship"
});
const db = db1.promise();
db.connect(err => {
  if (err) {
    console.error("❌ MySQL connection failed:", err);
  } else {
    console.log("✅ MySQL connected...");
  }
});

// ===== Routes =====
app.get("/", (req, res) => {
  res.render("index", { title: "PM Internship Scheme"});
});

app.get("/form", (req, res) => {
  res.render("form", { title: "Internship Application" });
});

// ✅ POST route to save form data in MySQL
app.post("/form", (req, res) => {
  const { student_id, education, skills, interests, location } = req.body;

  if (!student_id) {
    return res.status(400).json({ error: "Student ID is required" });
  }

  // Update the existing row for this student_id
  const sql = `
    UPDATE applications
    SET education = ?, skills = ?, interests = ?, location = ?
    WHERE id = ?
  `;

  db.query(sql, [education, skills, interests, location, student_id], (err, result) => {
    if (err) {
      console.error("❌ Error updating data:", err);
      return res.status(500).json({ error: "Database error" });
    }

    console.log("✅ Application updated for student ID:", student_id);
    res.json({ success: true });
  });
});

app.get("/success", (req, res) => {
  res.render("success", { title: "Application Submitted" });
});

app.get("/login", (req, res) => {
  res.render("login", { title: "Login Page" });
});

app.get("/signup", (req, res) => {
  res.render("signup", { title: "Login Page" });
});

// Signup
app.post("/signup", (req, res) => {
  const { name, email, password } = req.body;
  const sql = "INSERT INTO applications (name, email, password) VALUES (?, ?, ?)";
  
  db.query(sql, [name, email, password], (err, result) => {
    if (err) return res.json({ success: false, message: "Email already exists or DB error" });
    res.json({ success: true });
  });
});

// Login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const sql = "SELECT id, name FROM applications WHERE email = ? AND password = ?";
  
  db.query(sql, [email, password], (err, results) => {
    if (err || results.length === 0) {
      return res.json({ success: false, message: "Invalid email or password" });
    }
    const student = results[0];
    res.json({ success: true, studentId: student.id, studentName: student.name });
  });
});

// Route to get recommended internships

app.get("/recommend/:studentId", async (req, res) => {
  const studentId = req.params.studentId;

  // Fetch student from DB
  const [student] = await db.query("SELECT * FROM applications WHERE id = ?", [studentId]);

  if (!student) return res.status(404).send("Student not found");

  // Load internships
  const internships = require("./data/internships.json");

  // Split skills and location to normalize
 const studentSkills = (student.skills || "").toLowerCase().split(",").map(s => s.trim());
const studentLocation = (student.location || "").toLowerCase();

  // Calculate scores
  const recommended = internships.map(intern => {
    const skillMatch = intern.skills.filter(skill => studentSkills.includes(skill.toLowerCase())).length / intern.skills.length;
    const locationMatch = intern.locations.some(loc => studentLocation.includes(loc.toLowerCase())) ? 1 : 0;
    const score = skillMatch * 0.7 + locationMatch * 0.3; // 70% skills, 30% location
    return { ...intern, score };
  })
  .filter(i => i.score > 0) // keep only relevant
  .sort((a,b) => b.score - a.score)
  .slice(0, 5); // top 5

  // Render EJS
  res.render("recommend", { title: "Your Recommendations", student, recommended });
});


// In server.js or your routes file
app.get("/api/check-application/:studentId", (req, res) => {
  const studentId = req.params.studentId;

  const sql = "SELECT * FROM applications WHERE id = ? LIMIT 1";
  db.query(sql, [studentId], (err, results) => {
    if (err) {
      console.error("❌ Error checking application:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length > 0) {
      // Student has applied
      return res.json({ applied: true });
    } else {
      // Student has not applied
      return res.json({ applied: false });
    }
  });
});

// Fetch filled application by student ID
app.get("/application/:studentId", (req, res) => {
  const studentId = req.params.studentId;

  const sql = "SELECT * FROM applications WHERE id = ? LIMIT 1";
  db.query(sql, [studentId], (err, results) => {
    if (err) {
      console.error("❌ Error fetching application:", err);
      return res.status(500).send("Database error");
    }

    if (results.length > 0) {
      // Render EJS and pass application data
    res.render("filled", { 
        title: "Your Application",   // <-- pass title
        application: results[0] 
      }); 
    } else {
      res.send("No application found for this student.");
    }
  });
});

// Start server
app.listen(3000, () => console.log("🚀 Server running at http://localhost:3000"));
