import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import routerContacts from "./contacts/api.js";
import routerUsers from "./users/api.js";
import "dotenv/config";
import "./users/strategy.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/contacts", routerContacts);
app.use("/api/users", routerUsers);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: err.message });
});

const connection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: "db-contacts" });
    console.log("Database connection successful");

    app.listen(3000, () => {
      console.log(`Server running. Use our API on port: 3000`);
    });
  } catch (err) {
    console.log(`Server not running. Error message: ${err.message}`);
    process.exit(1);
  }
};

connection();
