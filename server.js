// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const app = express();
const PORT = 3000;

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.static(path.join(__dirname, "sample2"))); 

const recipeApiKey = "8d91f45481254b019daa98ab412f290b";
const emojiApiKey = "535509337cbc9b9f54114fb8beb3a5cffd8d7815";

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
    res.status(500).json({ error: "Error fetching recipes" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
