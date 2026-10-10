const mysql = require("mysql2");
require("dotenv").config();
const { createApp } = require("./app");

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const port = Number(process.env.PORT) || 3000;

db.connect(function (error) {
  if (error) {
    console.error("Unable to connect to MySQL:", error.message);
    process.exitCode = 1;
    return;
  }

  const app = createApp(db);
  app.listen(port, function () {
    console.log(`University Research Opportunity Portal is running at http://localhost:${port}`);
    console.log(`API endpoint: http://localhost:${port}/api/opportunities`);
  });
});
