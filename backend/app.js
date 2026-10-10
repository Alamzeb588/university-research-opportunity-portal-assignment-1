const express = require("express");
const cors = require("cors");
const path = require("path");
const { isValidId, validateOpportunity } = require("./opportunity-validation");

function createApp(db) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, "../frontend")));

  app.post("/api/opportunities", function (request, response) {
    const data = request.body;
    const errors = validateOpportunity(data);

    if (errors.length > 0) {
      return response.status(400).json({
        message: "Validation failed. Please check your input.",
        errors,
      });
    }

    const sql = `INSERT INTO opportunities
      (title, description, research_area, faculty_name, department, required_skills, positions, deadline, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = opportunityValues(data);

    db.query(sql, values, function (error, result) {
      if (error) {
        console.error("Error creating opportunity:", error.message);
        return response.status(500).json({
          message: "Internal server error. Could not create opportunity.",
        });
      }

      response.status(201).json({
        message: "Research opportunity created successfully.",
        id: result.insertId,
      });
    });
  });

  app.get("/api/opportunities", function (request, response) {
    db.query("SELECT * FROM opportunities ORDER BY created_at DESC", function (error, results) {
      if (error) {
        console.error("Error fetching opportunities:", error.message);
        return response.status(500).json({
          message: "Internal server error. Could not fetch opportunities.",
        });
      }

      response.status(200).json(results);
    });
  });

  app.get("/api/opportunities/:id", function (request, response) {
    const id = request.params.id;
    if (!isValidId(id)) {
      return response.status(400).json({ message: "Opportunity ID must be a positive integer." });
    }

    db.query("SELECT * FROM opportunities WHERE id = ?", [id], function (error, results) {
      if (error) {
        console.error("Error fetching opportunity:", error.message);
        return response.status(500).json({
          message: "Internal server error. Could not fetch opportunity.",
        });
      }

      if (results.length === 0) {
        return response.status(404).json({ message: `Research opportunity ${id} was not found.` });
      }

      response.status(200).json(results[0]);
    });
  });

  app.put("/api/opportunities/:id", function (request, response) {
    const id = request.params.id;
    if (!isValidId(id)) {
      return response.status(400).json({ message: "Opportunity ID must be a positive integer." });
    }

    const data = request.body;
    const errors = validateOpportunity(data);
    if (errors.length > 0) {
      return response.status(400).json({
        message: "Validation failed. Please check your input.",
        errors,
      });
    }

    db.query("SELECT id FROM opportunities WHERE id = ?", [id], function (error, results) {
      if (error) {
        console.error("Error checking opportunity:", error.message);
        return response.status(500).json({
          message: "Internal server error. Could not update opportunity.",
        });
      }

      if (results.length === 0) {
        return response.status(404).json({ message: `Research opportunity ${id} was not found.` });
      }

      const sql = `UPDATE opportunities SET
        title = ?, description = ?, research_area = ?, faculty_name = ?,
        department = ?, required_skills = ?, positions = ?, deadline = ?, status = ?
        WHERE id = ?`;

      db.query(sql, [...opportunityValues(data), id], function (updateError) {
        if (updateError) {
          console.error("Error updating opportunity:", updateError.message);
          return response.status(500).json({
            message: "Internal server error. Could not update opportunity.",
          });
        }

        response.status(200).json({ message: "Research opportunity updated successfully." });
      });
    });
  });

  app.delete("/api/opportunities/:id", function (request, response) {
    const id = request.params.id;
    if (!isValidId(id)) {
      return response.status(400).json({ message: "Opportunity ID must be a positive integer." });
    }

    db.query("DELETE FROM opportunities WHERE id = ?", [id], function (error, result) {
      if (error) {
        console.error("Error deleting opportunity:", error.message);
        return response.status(500).json({
          message: "Internal server error. Could not delete opportunity.",
        });
      }

      if (result.affectedRows === 0) {
        return response.status(404).json({ message: `Research opportunity ${id} was not found.` });
      }

      response.status(200).json({ message: "Research opportunity deleted successfully." });
    });
  });

  app.use("/api", function (request, response) {
    response.status(404).json({ message: "API endpoint not found." });
  });

  app.use(function (error, request, response, next) {
    if (error.type === "entity.parse.failed") {
      return response.status(400).json({ message: "Request body must contain valid JSON." });
    }

    console.error("Unexpected request error:", error.message);
    response.status(500).json({ message: "Internal server error." });
  });

  return app;
}

function opportunityValues(data) {
  return [
    data.title.trim(),
    data.description.trim(),
    data.research_area.trim(),
    data.faculty_name.trim(),
    data.department.trim(),
    data.required_skills.trim(),
    data.positions,
    data.deadline,
    data.status || "Open",
  ];
}

module.exports = { createApp };
