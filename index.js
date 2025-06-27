require("module-alias/register");
require("./moduleAlias.js");
const express = require("express");
const database = require("./src/config/database");
const indexRoutes = require("./src/routers");
require("./src/crons/index.cron");

database();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  next();
});

// Routes
app.use("/email-campaign", indexRoutes);

app.get("/home", (req, res, next) => {
  res.send("This is the homepage for testing");
});

// Template Engine
app.set("view engine", "ejs");
app.set("views", "./src/templates");

// 404 Handler
// app.use("*", (req, res) => {
//   res.status(404).json({ message: "Resource not found" });
// });

app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
