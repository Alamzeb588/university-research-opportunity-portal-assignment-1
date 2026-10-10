const assert = require("node:assert/strict");
const { after, before, test } = require("node:test");
const { createApp } = require("./app");

const opportunities = new Map();
let nextId = 1;
let server;
let baseUrl;
let failNextQuery = false;

const db = {
  query(sql, values, callback) {
    if (typeof values === "function") {
      callback = values;
      values = [];
    }

    queueMicrotask(function () {
      if (failNextQuery) {
        failNextQuery = false;
        callback(new Error("Simulated database failure"));
        return;
      }

      if (sql.startsWith("INSERT")) {
        const id = nextId++;
        const [title, description, research_area, faculty_name, department, required_skills, positions, deadline, status] = values;
        opportunities.set(id, {
          id,
          title,
          description,
          research_area,
          faculty_name,
          department,
          required_skills,
          positions,
          deadline,
          status,
          created_at: new Date().toISOString(),
        });
        callback(null, { insertId: id });
        return;
      }

      if (sql.startsWith("SELECT * FROM opportunities ORDER")) {
        callback(null, Array.from(opportunities.values()));
        return;
      }

      if (sql.startsWith("SELECT")) {
        const opportunity = opportunities.get(Number(values[0]));
        callback(null, opportunity ? [opportunity] : []);
        return;
      }

      if (sql.startsWith("UPDATE")) {
        const id = Number(values[9]);
        const opportunity = opportunities.get(id);
        if (opportunity) {
          const [title, description, research_area, faculty_name, department, required_skills, positions, deadline, status] = values;
          Object.assign(opportunity, {
            title,
            description,
            research_area,
            faculty_name,
            department,
            required_skills,
            positions,
            deadline,
            status,
          });
        }
        callback(null, { affectedRows: opportunity ? 1 : 0 });
        return;
      }

      if (sql.startsWith("DELETE")) {
        const deleted = opportunities.delete(Number(values[0]));
        callback(null, { affectedRows: deleted ? 1 : 0 });
      }
    });
  },
};

const validOpportunity = {
  title: "AI in Healthcare",
  description: "Research using machine learning for medical imaging.",
  research_area: "Artificial Intelligence",
  faculty_name: "Dr. Ahmed Khan",
  department: "Computer Science",
  required_skills: "Python, machine learning",
  positions: 3,
  deadline: "2027-12-31",
};

before(async function () {
  server = createApp(db).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async function () {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

async function request(path, options) {
  return fetch(`${baseUrl}${path}`, options);
}

function json(body) {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

test("CRUD workflow returns the expected data and HTTP status codes", async function () {
  const created = await request("/api/opportunities", json(validOpportunity));
  assert.equal(created.status, 201);
  const createdBody = await created.json();
  assert.equal(createdBody.id, 1);

  const list = await request("/api/opportunities");
  assert.equal(list.status, 200);
  assert.equal((await list.json()).length, 1);

  const found = await request(`/api/opportunities/${createdBody.id}`);
  assert.equal(found.status, 200);
  assert.equal((await found.json()).status, "Open");

  const updatedOpportunity = { ...validOpportunity, title: "Updated AI Research", positions: 2 };
  const updated = await request(`/api/opportunities/${createdBody.id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(updatedOpportunity),
  });
  assert.equal(updated.status, 200);
  assert.equal((await request(`/api/opportunities/${createdBody.id}`).then((response) => response.json())).title, "Updated AI Research");

  const deleted = await request(`/api/opportunities/${createdBody.id}`, { method: "DELETE" });
  assert.equal(deleted.status, 200);
  assert.equal((await request(`/api/opportunities/${createdBody.id}`)).status, 404);
});

test("invalid data, malformed JSON, and invalid IDs return 400", async function () {
  const invalid = await request("/api/opportunities", json({ ...validOpportunity, positions: 0 }));
  assert.equal(invalid.status, 400);
  assert.ok((await invalid.json()).errors.length > 0);

  const missingFields = await request("/api/opportunities", json({}));
  assert.equal(missingFields.status, 400);

  const invalidStatus = await request("/api/opportunities", json({ ...validOpportunity, status: "Pending" }));
  assert.equal(invalidStatus.status, 400);

  const invalidDate = await request("/api/opportunities", json({ ...validOpportunity, deadline: "2027-02-30" }));
  assert.equal(invalidDate.status, 400);

  const malformedJson = await request("/api/opportunities", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  assert.equal(malformedJson.status, 400);

  assert.equal((await request("/api/opportunities/not-an-id")).status, 400);
  assert.equal((await request("/api/unknown-endpoint")).status, 404);
});

test("database failures return 500 instead of a success-shaped response", async function () {
  failNextQuery = true;
  const response = await request("/api/opportunities");
  assert.equal(response.status, 500);
  assert.equal((await response.json()).message, "Internal server error. Could not fetch opportunities.");
});
