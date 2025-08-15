/* Pocket Chef – interactive front-end */
const el = (id) => document.getElementById(id);

const input = el("ingredient-input");
const addBtn = el("add-btn");
const generateBtn = el("generate-btn");
const plate = el("plate");
const list = el("ingredient-list");
const recipesList = el("recipes-list");
const pagination = el("pagination");
const prevBtn = el("prev-btn");
const nextBtn = el("next-btn");
const pageInfo = el("page-info");
const recipeSection = el("recipes");

document.getElementById("year").textContent = new Date().getFullYear();

let ingredients = [];
let currentPage = 1;
let perPage = window.matchMedia("(min-width: 900px)").matches ? 4 : 2;

/* Demo recipe data — replace with API results later */
const sampleRecipes = [
  { title: "Tomato Pasta", img: "https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg", link: "https://www.themealdb.com/" },
  { title: "Chicken Salad", img: "https://www.themealdb.com/images/media/meals/1548772327.jpg", link: "https://www.themealdb.com/" },
  { title: "Garlic Soup", img: "https://www.themealdb.com/images/media/meals/stpuws1511191310.jpg", link: "https://www.themealdb.com/" },
  { title: "Avocado Toast", img: "https://www.themealdb.com/images/media/meals/1550440197.jpg", link: "https://www.themealdb.com/" },
  { title: "Fruit Smoothie", img: "https://www.themealdb.com/images/media/meals/vpxyqt1511464175.jpg", link: "https://www.themealdb.com/" },
  { title: "Mushroom Risotto", img: "https://www.themealdb.com/images/media/meals/ryppsv1511815505.jpg", link: "https://www.themealdb.com/" },
  { title: "Herb Omelette", img: "https://www.themealdb.com/images/media/meals/yvpuuy1511797244.jpg", link: "https://www.themealdb.com/" },
  { title: "Basil Pesto", img: "https://www.themealdb.com/images/media/meals/1520084413.jpg", link: "https://www.themealdb.com/" }
];

/* ---- Ingredient handling ---- */
const EMOJIS = ["🍅","🧄","🍄","🥑","🥕","🧀","🥬","🌶️","🧅","🥔","🍋","🫑","🌽","🥛","🥚"];
function pickEmoji() { return EMOJIS[Math.floor(Math.random()*EMOJIS.length)]; }

function addIngredient(value){
  const val = value.trim();
  if(!val) { alert("Please enter an ingredient."); return; }
  ingredients.push(val);
  input.value = "";

  // Place inside plate circle (avoid edges)
  const rect = plate.getBoundingClientRect();
  const r = rect.width/2 - 50; // padding to keep chips inside
  let placed = false, x=0,y=0;

  // Random point inside circle
  for(let tries=0; tries<40 && !placed; tries++){
    const t = Math.random()*Math.PI*2;
    const rr = Math.sqrt(Math.random())*r;
    x = rr*Math.cos(t) + rect.width/2;
    y = rr*Math.sin(t) + rect.height/2;
    placed = true;
  }

  const chip = document.createElement("div");
  chip.className = "ingredient-chip";
  chip.style.left = `${x}px`;
  chip.style.top = `${y}px`;
  chip.title = `${val} (click to remove)`;

  const span = document.createElement("span");
  span.className = "ingredient-emoji";
  span.textContent = pickEmoji();
  chip.appendChild(span);

  // rotation for playfulness
  chip.style.rotate = `${(Math.random()*12-6).toFixed(2)}deg`;

  // remove on click
  chip.addEventListener("click", ()=>{
    chip.style.transition = "transform .18s ease, opacity .18s ease";
    chip.style.transform = "translate(-50%,-50%) scale(.7)";
    chip.style.opacity = "0";
    setTimeout(()=> chip.remove(), 180);
    ingredients = ingredients.filter(i => i !== val); // remove one
  });

  list.appendChild(chip);
}

addBtn.addEventListener("click", () => addIngredient(input.value));
input.addEventListener("keydown", (e) => {
  if(e.key === "Enter") addIngredient(input.value);
});

/* ---- Generate → show recipes + scroll ---- */
generateBtn.addEventListener("click", async ()=>{
  if(ingredients.length === 0){ alert("Please add at least one ingredient."); return; }

  // fun bounce for all chips
  document.querySelectorAll(".ingredient-chip").forEach(chip=>{
    chip.style.animation = "bounce .6s ease-out";
    chip.addEventListener("animationend", ()=> chip.style.animation = "", {once:true});
  });

  currentPage = 1;

  // (Future) fetch API with ingredients -> render
  // const data = await fetchRecipes(ingredients);

  displayRecipes();
  pagination.classList.remove("hidden");

  // Smoothly scroll down to recipe section
  setTimeout(()=> document.getElementById("recipes").scrollIntoView({behavior:"smooth"}), 250);
});

/* ---- Pagination ---- */
prevBtn.addEventListener("click", ()=>{
  if(currentPage>1){ currentPage--; displayRecipes(); }
});
nextBtn.addEventListener("click", ()=>{
  const total = Math.ceil(sampleRecipes.length / perPage);
  if(currentPage<total){ currentPage++; displayRecipes(); }
});
window.addEventListener("resize", ()=>{
  const newPerPage = window.matchMedia("(min-width: 900px)").matches ? 4 : 2;
  if(newPerPage !== perPage){
    perPage = newPerPage;
    currentPage = 1;
    displayRecipes();
  }
});

/* ---- Render recipes ---- */
function displayRecipes(){
  recipesList.innerHTML = "";

  const totalPages = Math.ceil(sampleRecipes.length / perPage);
  const start = (currentPage - 1) * perPage;
  const end = start + perPage;

  sampleRecipes.slice(start, end).forEach(r => {
    const card = document.createElement("article");
    card.className = "recipe-card reveal";
    card.setAttribute("role","listitem");
    card.innerHTML = `
      <img class="recipe-img" src="${r.img}" alt="${r.title}">
      <div class="recipe-body">
        <h3 class="recipe-title">${r.title}</h3>
        <p class="muted">A quick idea based on your ingredients.</p>
      </div>
      <div class="recipe-actions">
        <a class="recipe-link" href="${r.link}" target="_blank" rel="noopener">View Recipe</a>
      </div>
    `;
    recipesList.appendChild(card);
  });

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
}

