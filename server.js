// server.js
import express from "express";
import multer from "multer";
import fs from "fs/promises";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import dotenv from 'dotenv';
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import { Model } from "clarifai-nodejs";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.static(path.join(__dirname, "sample2"))); 

const recipeApiKey = process.env.RECIPE_API_KEY;
const emojiApiKey = process.env.EMOJI_API_KEY;

// API endpoint for recipes
app.get("/recipes", async (req, res) => {
  try {
    const ingredients = req.query.ingredients;
    if (!ingredients) return res.json([]);

    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=6&apiKey=${recipeApiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching recipes" });
  }
});

// API endpoint for emojis
app.get("/emojis", async (req, res) => {
  try {
    const ingredient = req.query.ingredient;

    const url = `https://emoji-api.com/emojis?search=${encodeURIComponent(ingredient)}&access_key=${emojiApiKey}`;
    const response = await fetch(url);

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching emojis" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

// Upload route
app.post("/api/upload", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Read image as base64
    const imageBytes = await fs.readFile(req.file.path);
    const base64Image = imageBytes.toString("base64");

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: "List all food ingredients visible in this photo. Return only ingredient names, comma-separated."
              },
              {
                type: "input_image",
                image_url: `data:image/jpeg;base64,${base64Image}` 
              }
            ]
          }
        ]
      }),
    });

    const data = await response.json();
    console.log("OpenAI response:", JSON.stringify(data, null, 2)); // <-- for debugging

    // Extract text output safely
    const outputText = data?.output?.[0]?.content?.[0]?.text || "No ingredients detected";

    res.json({ ingredients: outputText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process image" });
  }
});
