let ingredients = [];
let currentPage = 1;

// sample recipes
const sampleRecipes = [
    { title: "Tomato Pasta", img: "https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg", link: "#" },
    { title: "Chicken Salad", img: "https://www.themealdb.com/images/media/meals/1548772327.jpg", link: "#" },
    { title: "Garlic Soup", img: "https://www.themealdb.com/images/media/meals/stpuws1511191310.jpg", link: "#" },
    { title: "Avocado Toast", img: "https://www.themealdb.com/images/media/meals/1550440197.jpg", link: "#" },
    { title: "Fruit Smoothie", img: "https://www.themealdb.com/images/media/meals/vpxyqt1511464175.jpg", link: "#" }
];

// ======= Add Ingredient =======
document.getElementById("add-btn").addEventListener("click", () => {
    const value = document.getElementById("ingredient-input").value.trim();
    if (!value) return alert("Please enter an ingredient.");

    ingredients.push(value);
    document.getElementById("ingredient-input").value = "";

    const img = document.createElement("img");
    img.src = "https://via.placeholder.com/60?text=" + encodeURIComponent(value);

    // 随机偏移
    const plate = document.getElementById("plate");
    const plateHeight = plate.clientHeight;
    const offsetX = Math.random() * 120 - 60; // -60~60
    const offsetY = Math.random() * (plateHeight/2 - 50) - (plateHeight/4); 
    // plateHeight/2-50 keep bottom space  50px for Generate
    // -plateHeight/4 limit top space
    img.style.left = `calc(50% + ${offsetX}px)`;
    img.style.top = `calc(50% + ${offsetY}px)`;
    img.style.transform = `translate(-50%, -50%) rotate(${Math.random()*20-10}deg)`;

    document.getElementById("ingredient-list").appendChild(img);
});

// ======= Generate Recipes =======
document.getElementById("generate-btn").addEventListener("click", () => {
    if (ingredients.length === 0) return alert("Please add at least one ingredient.");
    currentPage = 1;
    displayRecipes();
    document.getElementById("pagination").classList.remove("hidden");

     // add animation jumping) for food in plate
    const ingredientImgs = document.querySelectorAll("#ingredient-list img");
    ingredientImgs.forEach(img => {
        img.style.animation = "bounce 0.6s ease-out";
        // delete after animations to restart when clicked again
        img.addEventListener("animationend", () => {
            img.style.animation = "";
        }, { once: true });
    });
});

// ======= Pagination =======
document.getElementById("prev-btn").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        displayRecipes();
    }
});

document.getElementById("next-btn").addEventListener("click", () => {
    if (currentPage < Math.ceil(sampleRecipes.length / 2)) {
        currentPage++;
        displayRecipes();
    }
});

// ======= Display Recipes =======
function displayRecipes() {
    const list = document.getElementById("recipes-list");
    list.innerHTML = "";

    const start = (currentPage - 1) * 2;
    const end = start + 2;
    const recipesToShow = sampleRecipes.slice(start, end);

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

    document.getElementById("page-info").textContent = `Page ${currentPage} of ${Math.ceil(sampleRecipes.length / 2)}`;
}

