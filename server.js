import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import routerContacts from "./contacts/api.js";
import routerUsers from "./users/api.js";
import fs from "fs/promises";
import "dotenv/config";
import "./users/strategy.js";
import { uploadDir } from "./users/multer.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const isAccessible = async (path) => {
  return await fs
    .access(path)
    .then(() => true)
    .catch(() => false);
};

const createFolderIsNotExist = async (folder) => {
  if (!(await isAccessible(folder))) {
    await fs.mkdir(folder);
  }
};

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
      createFolderIsNotExist(uploadDir);
      console.log(`Server running. Use our API on port: 3000`);
    });
  } catch (err) {
    console.log(`Server not running. Error message: ${err.message}`);
    process.exit(1);
  }
};

connection();
