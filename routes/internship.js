const express = require("express");
const router = express.Router();
const recommendInternships = require("../utils/recommender");

router.post("/recommend", (req, res) => {
  const { education, skills, sector, location } = req.body;

  const candidate = {
    education,
    skills: skills.split(",").map(s => s.trim().toLowerCase()),
    sector,
    location
  };

  const recommendations = recommendInternships(candidate);
  res.render("pages/results", { title: "Recommendations", recommendations });
});

module.exports = router;
