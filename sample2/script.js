let ingredients = [];
let currentPage = 1;
let recipes = []; // save api returned recipe


// ====== local dictionary ======
const INGREDIENT_EMOJI_MAP = {
  tomato: "🍅",
  garlic: "🧄",
  mushroom: "🍄",
  avocado: "🥑",
  carrot: "🥕",
  cheese: "🧀",
  lettuce: "🥬",
  chili: "🌶️",
  onion: "🧅",
  potato: "🥔",
  lemon: "🍋",
  pepper: "🫑",
  corn: "🌽",
  milk: "🥛",
  egg: "🥚",
  bread: "🍞",
  chicken: "🍗",
  beef: "🥩",
  pork: "🥓",
  fish: "🐟",
  shrimp: "🦐",
  rice: "🍚",
  pasta: "🍝",
  apple: "🍎",
  banana: "🍌",
  strawberry: "🍓"
};

// ====== get emoji for ingredient ======
async function getEmojiForIngredient(ingredient) {
  const key = ingredient.toLowerCase();

  // 1. local dictionary
  if (INGREDIENT_EMOJI_MAP[key]) {
    return INGREDIENT_EMOJI_MAP[key];
  }

  // 2. fuzzy matching
  for (let k in INGREDIENT_EMOJI_MAP) {
    if (key.includes(k)) {
      return INGREDIENT_EMOJI_MAP[k];
    }
  }

  // 3. API search
  try {
    // const API_KEY = "535509337cbc9b9f54114fb8beb3a5cffd8d7815";
    // const response = await fetch(
    //   `https://emoji-api.com/emojis?search=${encodeURIComponent(ingredient)}&access_key=${API_KEY}`
    // );
    // const data = await response.json();

    const res = await fetch(`/emojis?ingredient=${encodeURIComponent(ingredient)}`);
    if (!res.ok) throw new Error("Failed to fetch emoji:(");
    const data = await res.json();
    
    if (data && data[0]?.character) {
      return data[0].character;
    }
  } catch (error) {
    console.error("Emoji API request fail:", error);
  }

  // 4. fallback
  return "❓";
}

// ====== add ingredients ======
async function addIngredient() {
  const value = document.getElementById("ingredient-input").value.trim();
  if (!value) return alert("please enter the ingredients name!!");


  //split enter; remove dupicate space
  const values = value.split(",").map(v => v.trim()).filter(v => v);

  // get emoji (instead of image)
   for (const ingredient of values) {
      const emoji = await getEmojiForIngredient(ingredient);

      // store ingredient
      ingredients.push(ingredient);
      document.getElementById("ingredient-input").value = "";

      // get DOM elements
      const plate = document.getElementById("plate");
      const list = document.getElementById("ingredient-list");

      // random position in circle
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
      chip.title = `${ingredient} (click to delete)`;

      // add emoji
      const span = document.createElement("span");
      span.className = "ingredient-emoji";
      span.textContent = emoji;
      chip.appendChild(span);

      // random rotation
      chip.style.transform = `translate(-50%,-50%) rotate(${(Math.random() * 12 - 6).toFixed(2)}deg)`;

      // click to delete
      chip.addEventListener("click", () => {
        chip.style.transition = "transform .18s ease, opacity .18s ease";
        chip.style.transform = "translate(-50%,-50%) scale(.7)";
        chip.style.opacity = "0";
        setTimeout(() => chip.remove(), 180);
        ingredients = ingredients.filter(i => i !== value);
      });

      list.appendChild(chip);
    }
      // erase the input
      document.getElementById("ingredient-input").value = "";
}
// ====== bind button ======
document.getElementById("add-btn").addEventListener("click", addIngredient);

// ====== support 'Enter' ======
document.getElementById("ingredient-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addIngredient();
});






const ALLERGEN_MAP = {
  seafood: [
    "fish", "salmon", "tuna", "cod", "trout", "mackerel", "sardine",
    "shrimp", "prawn", "crab", "lobster", "clam", "oyster", "mussel", "scallop", "squid", "octopus", "caviar"
  ],
  dairy: [
    "milk", "cheese", "butter", "cream", "yogurt", "ghee", "whey", "casein", "ice cream", "custard"
  ],
  nuts: [
    "peanut", "almond", "cashew", "walnut", "hazelnut", "pecan", "macadamia", "brazil nut", "pistachio", "pine nut"
  ],
  egg: [
    "egg", "egg white", "egg yolk", "mayonnaise", "meringue", "custard"
  ],
  gluten: [
    "wheat", "barley", "rye", "pasta", "bread", "flour", "spelt", "semolina", "couscous", "malt", "seitan", "cracker"
  ]
};


// Filter out recipes that contain allergens
function filterByAllergens(recipes, allergens) {
  if (!allergens || allergens.length === 0) return recipes;

  return recipes.filter(recipe => {
    // Recipe must have ingredient info, if your API doesn't return ingredients, modify fetchRecipes
    if (!recipe.usedIngredients && !recipe.missedIngredients) return true;

    // Merge all ingredients into one array (for easier matching)
    const allIngredients = [
      ...(recipe.usedIngredients || []),
      ...(recipe.missedIngredients || [])
    ].map(i => i.name.toLowerCase());

    // If it contains any allergen, exclude it
    return !allergens.some(allergen => {
      const allergenLower = allergen.toLowerCase();
      const keywords = ALLERGEN_MAP[allergenLower] || [allergenLower];
      return allIngredients.some(ing =>
        keywords.some(kw => ing.includes(kw))
      );
    });
  });
}

// ======= Generate recipe（use Spoonacular API）=======
document.getElementById("generate-btn").addEventListener("click", async () => {
    if (ingredients.length === 0) {
        return alert("Please add at least one ingredient.");
    }

    currentPage = 1;

    try {
        // const apiKey = ""; // add your api key
        // const query = ingredients.join(",");

        // show Loading
        document.getElementById("loading").classList.remove("hidden");

        // const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(query)}&number=10&ranking=1&ignorePantry=true&apiKey=${apiKey}`;
        // const res = await fetch(url);
        // const data = await res.json();

        const data = await fetchRecipes();

        // hide Loading
        document.getElementById("loading").classList.add("hidden");

        if (!Array.isArray(data) || data.length === 0) {
            alert("No recipes found for these ingredients.");
            return;
        }

        recipes = data.map(item => ({
            title: item.title,
            img: item.image,
            link: `https://spoonacular.com/recipes/${item.title.replace(/\s+/g, "-")}-${item.id}`,
            usedIngredients: item.usedIngredients ,
            missedIngredients: item.missedIngredients 
        }));

        // Filter out allergens first
        recipes = filterByAllergens(recipes, selectedAllergens);
        displayRecipes();
        document.getElementById("pagination").classList.remove("hidden");

        // food jumping animation
        const ingredientImgs = document.querySelectorAll("#ingredient-list img");
        ingredientImgs.forEach(img => {
            img.style.animation = "bounce 0.6s ease-out";
            img.addEventListener("animationend", () => {
                img.style.animation = "";
            }, { once: true });
        });

        // automatically scroll down to the recipe
        setTimeout(() => {
            document.querySelector(".recipes-list").scrollIntoView({ behavior: "smooth" });
        }, 300);

    } catch (err) {
        console.error(err);
        document.getElementById("loading").classList.add("hidden");
        alert("Error fetching recipes.");
    }
});

// ======= turn pages =======
document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        displayRecipes();
    }
});

document.getElementById("next-btn").addEventListener("click", () => {
    if (currentPage < Math.ceil(recipes.length / 2)) {
        currentPage++;
        displayRecipes();
    }
});

// ======= show recipes =======
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

async function fetchRecipes() {
  try {
    const query = ingredients.join(",");
    const res = await fetch(`/recipes?ingredients=${encodeURIComponent(ingredients)}`);
    if (!res.ok) throw new Error("Failed to fetch recipes:(");

    const recipes = await res.json();
    return recipes;

  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = `<p>Error fetching recipes</p>`;
  }
}



document.addEventListener("DOMContentLoaded", () => {
  // ===== New: Guide Modal (Modal) Control Logic =====

  // First, get the HTML elements that need to be manipulated
  const guideModal = document.getElementById('guide-modal'); // The entire modal (gray background)
  const guideTriggerBtn = document.getElementById('guide-trigger-btn'); // The "Guide" button in the navigation bar
  const closeModalBtn = document.getElementById('close-modal-btn'); // The close button (×) in the top-right of the modal

  // --- Function: Open Modal ---
  // Define a function to show the modal
  function openModal() {
    // Remove the 'hidden' class from the modal; this class is typically set to display: none; in CSS
    guideModal.classList.remove('hidden'); 
  }

  // --- Function: Close Modal ---
  // Define a function to hide the modal
  function closeModal() {
    // Add the 'hidden' class to the modal to hide it
    guideModal.classList.add('hidden');
  }

  // --- Bind Event Listeners ---
  // 1. When the user clicks the "Guide" button in the navigation bar, call the openModal function
  if (guideTriggerBtn) {
    guideTriggerBtn.addEventListener('click', openModal);
  }

  // 2. When the user clicks the close button (×) in the modal, call the closeModal function
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }

  // 3. (Optional but recommended) When the user clicks on the gray background area of the modal, also close the modal
  if (guideModal) {
    guideModal.addEventListener('click', (event) => {
      // Check if the target of the click event is the gray background itself (and not the form inside)
      if (event.target === guideModal) {
        closeModal();
      }
    });
  }
});


// ====== Scan & Recognition Flow ======
const cameraBtn = document.getElementById("camera-btn");
const cameraInput = document.getElementById("camera-input");
const scanningDiv = document.getElementById("scanning");
const recognitionDiv = document.getElementById("recognition-results");
const resultList = document.getElementById("result-list");
const addSelectedBtn = document.getElementById("add-selected-btn");

// Click Scan button → open upload
cameraBtn.addEventListener("click", () => {
  cameraInput.click();
});

// Triggered after file selection
cameraInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("photo", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  // Show scanning animation
  scanningDiv.classList.remove("hidden");

  const data = await res.json();
  console.log("Detected ingredients:", data.ingredients);

  // Optional: put detected ingredients in the input box
  document.getElementById("ingredient-input").value = data.ingredients;



  // ===== mock: simulate recognition (backend can replace this) =====
  // TODO: replace with fetch("/scan", {method:"POST",body:formData})
  setTimeout(() => {
    scanningDiv.classList.add("hidden");

  //   // Pretend recognized ingredients
  //   const mockResults = ["Tomato", "Cheese", "Bread"];

    // Show recognition results
    showRecognitionResults(data.ingredients);
  }, 2000);
});

// Display recognition results
function showRecognitionResults(items) {
  resultList.innerHTML = "";
  items.forEach(item => {
    const div = document.createElement("div");
    div.className = "result-card";
    div.innerHTML = `
      <label>
        <input type="checkbox" value="${item}">
        <span>${INGREDIENT_EMOJI_MAP[item.toLowerCase()] || "❓"} ${item}</span>
      </label>
    `;
    resultList.appendChild(div);
  });
  recognitionDiv.classList.remove("hidden");
}

// Add selected ingredients to Plate
addSelectedBtn.addEventListener("click", async () => {
  const selected = [...document.querySelectorAll("#result-list input:checked")]
    .map(input => input.value);

  for (let ing of selected) {
    document.getElementById("ingredient-input").value = ing;
    await addIngredient();
  }
  recognitionDiv.classList.add("hidden");
});

document.addEventListener('click', function(event) {
  // Get filter panel element and knife button element
  const filterPanel = document.getElementById('filterPanel');
  const filterKnife = document.querySelector('.filter-knife');
  
  // Check clicked target element
  if (!filterPanel.contains(event.target) && !filterKnife.contains(event.target)) {
    // If click is neither inside filter panel nor on knife button
    filterPanel.classList.remove('active'); // Remove active class, close panel
  }
});

    const rope = document.querySelector('.filter-knife');
    const panel = document.getElementById('filterPanel');
    const confirmBtn = document.getElementById('confirmBtn');

    let selectedAllergens = [];

    // Click rope → open note
    rope.addEventListener('click', () => {
      panel.classList.add('active');
    });

    // Click confirm → close and record
    confirmBtn.addEventListener('click', () => {
      const checkboxes = panel.querySelectorAll('input[type=checkbox]');
      selectedAllergens = [];
      checkboxes.forEach(cb => {
        if (cb.checked) selectedAllergens.push(cb.value);
      });

      console.log("Filter out these allergens:", selectedAllergens);

      panel.classList.remove('active');
      // Here you can pass selectedAllergens to search logic
      displayRecipes(); // Refresh and apply filter
    });



    window.addEventListener('load', function() {
    setTimeout(function() {
        const loading = document.getElementById('loading');
        loading.style.opacity = '0';
        
        setTimeout(() => {
            loading.classList.add('hidden');
        }, 600); // Match CSS transition duration
    }, 1200); // Minimum display time
});


const foods = ["🍎","🥑","🍔","🍕","🍣","🍤","🥗","🥖","🍜","🍩","🍓","🥕","🥟","🧁","🍇","🍪"];
const foodBg = document.getElementById("food-bg");

// Randomly place food background
for (let i=0; i<30; i++) {
  const f = document.createElement("div");
  f.className = "food-item";
  f.textContent = foods[Math.floor(Math.random()*foods.length)];
  f.style.left = Math.random()*100 + "vw";
  f.style.top = Math.random()*100 + "vh";
  foodBg.appendChild(f);
}