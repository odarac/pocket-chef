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


// 过滤掉含有过敏原的食谱
function filterByAllergens(recipes, allergens) {
  if (!allergens || allergens.length === 0) return recipes;

  return recipes.filter(recipe => {
    // recipe 里需要有原料信息，如果你的 API 没返回 ingredients，要改 fetchRecipes
    if (!recipe.usedIngredients && !recipe.missedIngredients) return true;

    // 把所有原料合并成一个字符串（方便匹配）
    const allIngredients = [
      ...(recipe.usedIngredients || []),
      ...(recipe.missedIngredients || [])
    ].map(i => i.name.toLowerCase());

    // 如果含有任意一个过敏原，则剔除
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

        // 先过滤过敏原 filter first
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

document.addEventListener('click', function(event) {
  // 获取过滤面板元素和餐刀按钮元素
  const filterPanel = document.getElementById('filterPanel');
  const filterKnife = document.querySelector('.filter-knife');
  
  // 检查点击的目标元素
  if (!filterPanel.contains(event.target) && !filterKnife.contains(event.target)) {
    // 如果点击的不是过滤面板内部，也不是餐刀按钮
    filterPanel.classList.remove('active'); // 移除active类，关闭面板
  }
});

    const rope = document.querySelector('.filter-knife');
    const panel = document.getElementById('filterPanel');
    const confirmBtn = document.getElementById('confirmBtn');

    let selectedAllergens = [];

    // 点击绳子 → 打开便签
    rope.addEventListener('click', () => {
      panel.classList.add('active');
    });

    // 点击确认 → 收回并记录
    confirmBtn.addEventListener('click', () => {
      const checkboxes = panel.querySelectorAll('input[type=checkbox]');
      selectedAllergens = [];
      checkboxes.forEach(cb => {
        if (cb.checked) selectedAllergens.push(cb.value);
      });

      console.log("过滤掉这些过敏原：", selectedAllergens);

      panel.classList.remove('active');
      // 这里你可以把 selectedAllergens 传递给搜索逻辑
      displayRecipes(); // 重新刷新，应用过滤
    });



    window.addEventListener('load', function() {
    setTimeout(function() {
        const loading = document.getElementById('loading');
        loading.style.opacity = '0';
        
        setTimeout(() => {
            loading.classList.add('hidden');
        }, 600); // 匹配CSS过渡时间
    }, 1200); // 最小显示时间
});


const foods = ["🍎","🥑","🍔","🍕","🍣","🍤","🥗","🥖","🍜","🍩","🍓","🥕","🥟","🧁","🍇","🍪"];
const foodBg = document.getElementById("food-bg");

// 随机摆放食物背景
for (let i=0; i<30; i++) {
  const f = document.createElement("div");
  f.className = "food-item";
  f.textContent = foods[Math.floor(Math.random()*foods.length)];
  f.style.left = Math.random()*100 + "vw";
  f.style.top = Math.random()*100 + "vh";
  foodBg.appendChild(f);
}