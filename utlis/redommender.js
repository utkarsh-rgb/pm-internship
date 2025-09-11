const internships = require("../data/internships.json");

function recommendInternships(candidate) {
  // Simple scoring based on skills, education, location
  return internships
    .map(intern => {
      let score = 0;

      // Education match
      if (intern.education === candidate.education || intern.education === "Any") {
        score += 1;
      }

      // Skill overlap
      const matchedSkills = candidate.skills.filter(skill => intern.skills.includes(skill));
      score += matchedSkills.length;

      // Location match
      if (intern.locations.includes(candidate.location)) {
        score += 1;
      }

      return { ...intern, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Return top 3-5 internships
}

module.exports = recommendInternships;
