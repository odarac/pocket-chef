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

// Add ingredient
document.getElementById("add-btn").addEventListener("click", () => {
    const value = document.getElementById("ingredient-input").value.trim();
    if (!value) {
        alert("Please enter an ingredient.");
        return;
    }

    ingredients.push(value);
    document.getElementById("ingredient-input").value = "";

    const img = document.createElement("img");
    img.src = "https://via.placeholder.com/60?text=" + encodeURIComponent(value);
    document.getElementById("ingredient-list").appendChild(img);
});

// Generate recipes
document.getElementById("generate-btn").addEventListener("click", () => {
    if (ingredients.length === 0) {
        alert("Please add at least one ingredient.");
        return;
    }
    currentPage = 1;
    displayRecipes();
    document.getElementById("pagination").classList.remove("hidden");
});

// Pagination
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

// Display recipes
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
}
