let ingredients = [];
let currentPage = 1;
let recipes = [];

// ====== local dictionary ======
const INGREDIENT_EMOJI_MAP = {
  tomato: "🍅", garlic: "🧄", mushroom: "🍄", avocado: "🥑", carrot: "🥕",
  cheese: "🧀", lettuce: "🥬", chili: "🌶️", onion: "🧅", potato: "🥔",
  lemon: "🍋", pepper: "🫑", corn: "🌽", milk: "🥛", egg: "🥚",
  bread: "🍞", chicken: "🍗", beef: "🥩", pork: "🥓", fish: "🐟",
  shrimp: "🦐", rice: "🍚", pasta: "🍝", apple: "🍎", banana: "🍌", strawberry: "🍓"
};

// ====== get emoji for ingredient ======
async function getEmojiForIngredient(ingredient) {
  const key = ingredient.toLowerCase();
  if (INGREDIENT_EMOJI_MAP[key]) return INGREDIENT_EMOJI_MAP[key];
  for (let k in INGREDIENT_EMOJI_MAP) {
    if (key.includes(k)) return INGREDIENT_EMOJI_MAP[k];
  }
  // fallback
  return "❓";
}

// ====== add ingredient ======
async function addIngredient(value) {
  if (!value) return alert("please enter the ingredients name!!");
  const emoji = await getEmojiForIngredient(value);
  ingredients.push(value);

  const plate = document.getElementById("plate");
  const list = document.getElementById("ingredient-list");

  const rect = plate.getBoundingClientRect();
  const r = rect.width / 2 - 50;
  const t = Math.random() * Math.PI * 2;
  const rr = Math.sqrt(Math.random()) * r;
  const x = rr * Math.cos(t) + rect.width / 2;
  const y = rr * Math.sin(t) + rect.height / 2;
  // create chip
  const chip = document.createElement("div");
  chip.className = "ingredient-chip";
  chip.style.left = `${x}px`;
  chip.style.top = `${y}px`;
  chip.title = `${value} (click to delete)`;

  const span = document.createElement("span");
  span.className = "ingredient-emoji";
  span.textContent = emoji;
  chip.appendChild(span);

  chip.style.transform = `translate(-50%,-50%) rotate(${(Math.random() * 12 - 6).toFixed(2)}deg)`;

  chip.addEventListener("click", () => {
    chip.style.transition = "transform .18s ease, opacity .18s ease";
    chip.style.transform = "translate(-50%,-50%) scale(.7)";
    chip.style.opacity = "0";
    setTimeout(() => chip.remove(), 180);
    ingredients = ingredients.filter(i => i !== value);
  });

  list.appendChild(chip);
}

// ====== bind add button and Enter ======
document.getElementById("add-btn").addEventListener("click", () => {
  const value = document.getElementById("ingredient-input").value.trim();
  addIngredient(value);
  document.getElementById("ingredient-input").value = "";
});
document.getElementById("ingredient-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    document.getElementById("add-btn").click();
  }
});

// ====== camera upload ======
document.getElementById("camera-btn").addEventListener("click", () => {
  document.getElementById("camera-input").click();
});

document.getElementById("camera-input").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  document.getElementById("loading").classList.remove("hidden");

  try {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch("/recognize", { // replace to the vision recogonize API
      method: "POST",
      body: formData
    });
    const data = await res.json();

    const recognitionResults = document.getElementById("recognition-results");
    recognitionResults.innerHTML = "";
    recognitionResults.classList.remove("hidden");

    for (let ingredient of data.ingredients) {
      // each recogonized  ingredient automatically added into plate
      addIngredient(ingredient);
      // op: generate outcomes to click and pick
      const chip = document.createElement("div");
      chip.className = "result-chip";
      chip.textContent = ingredient;
      chip.addEventListener("click", () => addIngredient(ingredient));
      recognitionResults.appendChild(chip);
    }

  } catch (err) {
    console.error(err);
    alert("fail to recogonize");
  } finally {
    document.getElementById("loading").classList.add("hidden");
  }
});

// ====== Generate recipe（use Spoonacular API）=======
document.getElementById("generate-btn").addEventListener("click", async () => {
  if (ingredients.length === 0) return alert("Please add at least one ingredient.");
  currentPage = 1;

  document.getElementById("loading").classList.remove("hidden");
  try {
    const data = await fetchRecipes();
    document.getElementById("loading").classList.add("hidden");
    if (!Array.isArray(data) || data.length === 0) return alert("No recipes found.");

    recipes = data.map(item => ({
      title: item.title,
      img: item.image,
      link: `https://spoonacular.com/recipes/${item.title.replace(/\s+/g,"-")}-${item.id}`
    }));

    displayRecipes();
    document.getElementById("pagination").classList.remove("hidden");

    // food jump animation
    const ingredientImgs = document.querySelectorAll("#ingredient-list img");
    ingredientImgs.forEach(img => {
      img.style.animation = "bounce 0.6s ease-out";
      img.addEventListener("animationend", () => { img.style.animation = ""; }, { once: true });
    });

    setTimeout(() => {
      document.querySelector(".recipes-list").scrollIntoView({ behavior: "smooth" });
    }, 300);

  } catch (err) {
    console.error(err);
    document.getElementById("loading").classList.add("hidden");
    alert("Error fetching recipes.");
  }
});

// ====== Pagination ======
document.getElementById("prev-btn").addEventListener("click", () => {
  if (currentPage > 1) { currentPage--; displayRecipes(); }
});
document.getElementById("next-btn").addEventListener("click", () => {
  if (currentPage < Math.ceil(recipes.length / 2)) { currentPage++; displayRecipes(); }
});

// ====== Show recipes ======
function displayRecipes() {
  const list = document.getElementById("recipes-list");
  list.innerHTML = "";
  const start = (currentPage - 1) * 2;
  const end = start + 2;
  const recipesToShow = recipes.slice(start, end);

  recipesToShow.forEach(recipe => {
    const card = document.createElement("div");
    card.classList.add("recipe-card");
    card.innerHTML = `
      <img src="${recipe.img}" alt="${recipe.title}">
      <h3>${recipe.title}</h3>
      <a href="${recipe.link}" target="_blank">View Recipe</a>
    `;
    list.appendChild(card);
  });

  document.getElementById("page-info").textContent = `Page ${currentPage} of ${Math.ceil(recipes.length / 2)}`;
}

// ====== Fetch recipes (mock) ======
async function fetchRecipes() {
  try {
    const query = ingredients.join(",");
    const res = await fetch(`/recipes?ingredients=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error("Failed to fetch recipes :(");
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}



// ===== New: Login Modal (Modal) Control Logic =====
document.addEventListener("DOMContentLoaded", () => {
  // First, get the HTML elements that need to be manipulated
  const loginModal = document.getElementById('login-modal'); // The entire modal (gray background)
  const loginTriggerBtn = document.getElementById('login-trigger-btn'); // The "Login" button in the navigation bar
  const closeModalBtn = document.getElementById('close-modal-btn'); // The close button (×) in the top-right of the modal

  // --- Function: Open Modal ---
  // Define a function to show the modal
  function openModal() {
    // Remove the 'hidden' class from the modal; this class is typically set to display: none; in CSS
    loginModal.classList.remove('hidden'); 
  }

  // --- Function: Close Modal ---
  // Define a function to hide the modal
  function closeModal() {
    // Add the 'hidden' class to the modal to hide it
    loginModal.classList.add('hidden');
  }

  // --- Bind Event Listeners ---
  // 1. When the user clicks the "Login" button in the navigation bar, call the openModal function
  if (loginTriggerBtn) {
    loginTriggerBtn.addEventListener('click', openModal);
  }

  // 2. When the user clicks the close button (×) in the modal, call the closeModal function
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  // 3. (Optional but recommended) When the user clicks on the gray background area of the modal, also close the modal
  if (loginModal) {
    loginModal.addEventListener('click', (event) => {
      // Check if the target of the click event is the gray background itself (and not the form inside)
      if (event.target === loginModal) {
        closeModal();
      }
    });
  }
});