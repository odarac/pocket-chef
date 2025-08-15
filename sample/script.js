let ingredients = [];
let currentPage = 1;
let recipes = []; // save api returned recipe

// ======= add ingredients =======
const EMOJIS = ["🍅","🧄","🍄","🥑","🥕","🧀","🥬","🌶️","🧅","🥔","🍋","🫑","🌽","🥛","🥚"]; 


document.getElementById("add-btn").addEventListener("click", () => {
    const value = document.getElementById("ingredient-input").value.trim();
    if (!value) return alert("Please enter an ingredient.");

    ingredients.push(value);
    document.getElementById("ingredient-input").value = "";

    // get DOM elements
    const plate = document.getElementById("plate");
    const list = document.getElementById("ingredient-list");

    // randomly put in the round area
    const rect = plate.getBoundingClientRect();
    const r = rect.width/2 - 50; // inner margin
    let x = 0, y = 0;
    
    // random spot in the circle
    const t = Math.random()*Math.PI*2;
    const rr = Math.sqrt(Math.random())*r;
    x = rr*Math.cos(t) + rect.width/2;
    y = rr*Math.sin(t) + rect.height/2;

    // Create ingredient chips
    const chip = document.createElement("div");
    chip.className = "ingredient-chip";
    chip.style.left = `${x}px`;
    chip.style.top = `${y}px`;
    chip.title = `${value} (click to remove)`;
    
    // add emoji
    const span = document.createElement("span");
    span.className = "ingredient-emoji";
    span.textContent = EMOJIS[Math.floor(Math.random()*EMOJIS.length)];
    chip.appendChild(span);
    
    // randomly spin
    chip.style.transform = `translate(-50%,-50%) rotate(${(Math.random()*12-6).toFixed(2)}deg)`;
    
    // click to delete
    chip.addEventListener("click", () => {
        chip.style.transition = "transform .18s ease, opacity .18s ease";
        chip.style.transform = "translate(-50%,-50%) scale(.7)";
        chip.style.opacity = "0";
        setTimeout(() => chip.remove(), 180);
        ingredients = ingredients.filter(i => i !== value);
    });
    
    list.appendChild(chip);
});

// add support for 'Enter'
document.getElementById("ingredient-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        document.getElementById("add-btn").click();
    }
});


// // 获取食物图片或emoji
// async function getFoodVisual(name) {
//   try {
//     // 尝试获取食物图片
//     const img = await fetch(`https://foodish-api.herokuapp.com/api/images/${encodeURIComponent(name)}`)
//       .then(res => res.json());
//     return {
//       type: 'image',
//       content: img.image
//     };
//   } catch {
//     // 失败时获取emoji
//     return {
//       type: 'emoji',
//       content: await getEmojiForIngredient(name)
//     };
//   }
// }

// // 获取匹配的emoji（备用方案）
// async function getEmojiForIngredient(ingredient) {
//   try {
//     const API_KEY = "535509337cbc9b9f54114fb8beb3a5cffd8d7815";
//     const response = await fetch(
//       `https://emoji-api.com/emojis?search=${encodeURIComponent(ingredient)}&access_key=${API_KEY}`
//     );
//     const data = await response.json();
//     return data[0]?.character || "🍕";
//   } catch (error) {
//     console.error("Emoji API 请求失败:", error);
//     return "❓";
//   }
// }

// // 添加食材（异步函数）
// async function addIngredient() {
//   const value = document.getElementById("ingredient-input").value.trim();
//   if (!value) return alert("请输入食材名称！");

//   // 获取食物视觉内容（图片或emoji）
//   const visual = await getFoodVisual(value);

//   // 存储食材
//   ingredients.push(value);
//   document.getElementById("ingredient-input").value = "";

//   // 获取DOM元素
//   const plate = document.getElementById("plate");
//   const list = document.getElementById("ingredient-list");

//   // 在圆形区域内随机放置
//   const rect = plate.getBoundingClientRect();
//   const r = rect.width / 2 - 50;
//   const t = Math.random() * Math.PI * 2;
//   const rr = Math.sqrt(Math.random()) * r;
//   const x = rr * Math.cos(t) + rect.width / 2;
//   const y = rr * Math.sin(t) + rect.height / 2;

//   // 创建食材芯片
//   const chip = document.createElement("div");
//   chip.className = "ingredient-chip";
//   chip.style.left = `${x}px`;
//   chip.style.top = `${y}px`;
//   chip.title = `${value} (点击删除)`;

//   // 添加视觉内容
//   if (visual.type === 'image') {
//     const img = document.createElement("img");
//     img.src = visual.content;
//     img.className = "food-image";
//     chip.appendChild(img);
//   } else {
//     const span = document.createElement("span");
//     span.className = "ingredient-emoji";
//     span.textContent = visual.content;
//     chip.appendChild(span);
//   }

//   // 随机旋转
//   chip.style.transform = `translate(-50%,-50%) rotate(${(Math.random() * 12 - 6).toFixed(2)}deg)`;

//   // 点击删除
//   chip.addEventListener("click", () => {
//     chip.style.transition = "transform .18s ease, opacity .18s ease";
//     chip.style.transform = "translate(-50%,-50%) scale(.7)";
//     chip.style.opacity = "0";
//     setTimeout(() => chip.remove(), 180);
//     ingredients = ingredients.filter(i => i !== value);
//   });

//   list.appendChild(chip);
// }

// // 绑定按钮事件
// document.getElementById("add-btn").addEventListener("click", addIngredient);

// // 回车键支持
// document.getElementById("ingredient-input").addEventListener("keydown", (e) => {
//   if (e.key === "Enter") addIngredient();
// });


// ======= Generate recipe（use Spoonacular API）=======
document.getElementById("generate-btn").addEventListener("click", async () => {
    if (ingredients.length === 0) {
        return alert("Please add at least one ingredient.");
    }

    currentPage = 1;

    try {
        const apiKey = "8d91f45481254b019daa98ab412f290b"; // add your api key
        const query = ingredients.join(",");

        // show Loading
        document.getElementById("loading").classList.remove("hidden");

        const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(query)}&number=10&ranking=1&ignorePantry=true&apiKey=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();

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

<<<<<<< HEAD
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
=======
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

/* ---- (Optional) API hook skeleton ----
   Replace with your provider (e.g., Spoonacular, TheMealDB).
   Keep the interface the same: return array of { title, img, link }.
*/
// async function fetchRecipes(ings){
//   // Example (pseudo):
//   // const url = `/api/recipes?ingredients=${encodeURIComponent(ings.join(','))}`;
//   // const res = await fetch(url);
//   // const data = await res.json();
//   // return data.results.map(x => ({ title:x.title, img:x.image, link:x.sourceUrl }));
//   return sampleRecipes;
// }

async function fetchRecipes() {
  const ingredients = document.getElementById("ingredient-input").value.trim();
  const resultsDiv = document.getElementById("recipes");

  if (ingredients.length === 0) {
    resultsDiv.innerHTML = "";
    return;
  }

  try {
    const res = await fetch(`/recipes?ingredients=${encodeURIComponent(ingredients)}`);
    const recipes = await res.json();
    displayRecipes(recipes);

  } catch (err) {
    console.error(err);
    resultsDiv.innerHTML = `<p>Error fetching recipes</p>`;
  }
>>>>>>> 3dba6bbae746da2b4b9fe3f781c932f695f41952
}

