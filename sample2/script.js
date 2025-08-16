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

  // get emoji (instead of image)
  const emoji = await getEmojiForIngredient(value);

  // store ingredient
  ingredients.push(value);
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
  chip.title = `${value} (click to delete)`;

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

// ====== bind button ======
document.getElementById("add-btn").addEventListener("click", addIngredient);

// ====== support 'Enter' ======
document.getElementById("ingredient-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addIngredient();
});


// ======= Generate recipe（use Spoonacular API）=======
document.getElementById("generate-btn").addEventListener("click", async () => {
    if (ingredients.length === 0) {
        return alert("Please add at least one ingredient.");
    }

    currentPage = 1;

    try {
        // const apiKey = "8d91f45481254b019daa98ab412f290b"; // add your api key
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
            link: `https://spoonacular.com/recipes/${item.title.replace(/\s+/g, "-")}-${item.id}`
        }));

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
  // ===== New: Login Modal (Modal) Control Logic =====

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


// ====== Scan & Recognition Flow ======
const cameraBtn = document.getElementById("camera-btn");
const cameraInput = document.getElementById("camera-input");
const scanningDiv = document.getElementById("scanning");
const recognitionDiv = document.getElementById("recognition-results");
const resultList = document.getElementById("result-list");
const addSelectedBtn = document.getElementById("add-selected-btn");

// 点击 Scan 按钮 → 打开上传
cameraBtn.addEventListener("click", () => {
  cameraInput.click();
});

// 文件选择后触发
cameraInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("photo", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  // 显示扫描动画
  scanningDiv.classList.remove("hidden");

  const data = await res.json();
  console.log("Detected ingredients:", data.ingredients);

  // Optional: put detected ingredients in the input box
  document.getElementById("ingredient-input").value = data.ingredients;



  // ===== mock: 模拟识别（后端可替换这里） =====
  // TODO: 替换成 fetch("/scan", {method:"POST",body:formData})
  setTimeout(() => {
    scanningDiv.classList.add("hidden");

  //   // 假装识别出来的食材
  //   const mockResults = ["Tomato", "Cheese", "Bread"];

    // 显示识别结果
    showRecognitionResults(data.ingredients);
  }, 2000);
});

// 展示识别结果
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

// 把选中的加入 Plate
addSelectedBtn.addEventListener("click", async () => {
  const selected = [...document.querySelectorAll("#result-list input:checked")]
    .map(input => input.value);

  for (let ing of selected) {
    document.getElementById("ingredient-input").value = ing;
    await addIngredient();
  }
  recognitionDiv.classList.add("hidden");
});

