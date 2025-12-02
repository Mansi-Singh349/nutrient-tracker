// Simple nutrient tracker logic (static)
let foods = [];
const log = [];
let chart;

async function init() {
  const res = await fetch("static/foods.json");
  foods = await res.json();
  attachEvents();
  initChart();
  renderLog();
}

function attachEvents() {
  document.getElementById("add-btn").addEventListener("click", onAdd);

  document
    .getElementById("food-search")
    .addEventListener("keydown", (e) => {
      if (e.key === "Enter") onAdd();
      document
  .getElementById("reset-btn")
  .addEventListener("click", resetDay);
      document.getElementById("save-day").addEventListener("click", saveToday);
    });

  document
    .getElementById("food-search")
    .addEventListener("input", showSuggestions);
    // inside attachEvents()
const logoutEl = document.getElementById("logout-btn");
if (logoutEl) {
  logoutEl.addEventListener("click", () => {
    // remove current user (end session)
    localStorage.removeItem("nt_currentUser");

    // optional: clear per-user stored keys if you used per-user naming
    // const current = localStorage.getItem('nt_currentUser') || '';
    // localStorage.removeItem(`weeklyData_${current.replace(/[@.]/g,'_')}`);

    showToast("Logged out", "success");

    // small delay so the toast is visible, then redirect to login
    setTimeout(() => {
      window.location.href = "login.html";
    }, 600);
  });
}
}


// find food by partial match
function findFood(query) {
  if (!query) return null;
  query = query.toLowerCase().trim();
  return foods.find((f) => f.name.toLowerCase().includes(query));
}

function showSuggestions() {
  const input = document.getElementById("food-search").value.toLowerCase();
  const box = document.getElementById("suggest-box");
  box.innerHTML = "";

  if (!input) {
    box.style.display = "none";
    return;
  }

  const matches = foods.filter(f => f.name.toLowerCase().includes(input));
  
  matches.slice(0, 8).forEach(item => {
    const div = document.createElement("div");
    div.textContent = item.name;
    div.onclick = () => {
      document.getElementById("food-search").value = item.name;
      box.style.display = "none";
    };
    box.appendChild(div);
  });

  box.style.display = "block";
}

document.addEventListener("click", (e) => {
  if (e.target.id !== "food-search") {
    document.getElementById("suggest-box").style.display = "none";
  }
});


function onAdd() {
  const q = document.getElementById("food-search").value;
  const qty = parseFloat(document.getElementById("qty").value) || 1;
  const unit = document.getElementById("unit").value;

  const f = findFood(q);
  if (!f) {
    alert("Food not found. Try items like: roti, rice, banana, dosa, dal, pizza, etc.");
    return;
  }

  let multiplier = 1;
  if (unit === "g") {
    multiplier = qty / f.serving_g;
  } else {
    multiplier = qty;
  }

  const entry = {
    name: f.name,
    qty,
    unit,
    calories: +(f.calories * multiplier).toFixed(1),
    protein: +(f.protein * multiplier).toFixed(1),
    carbs: +(f.carbs * multiplier).toFixed(1),
    fat: +(f.fat * multiplier).toFixed(1),
    sugar: +(f.sugar * multiplier).toFixed(1),
  };

  log.push(entry);
  renderLog();
  showToast("Food added!");

  // Clear inputs after adding
  document.getElementById("food-search").value = "";
  document.getElementById("qty").value = 1; 
  document.getElementById("suggest-box").style.display = "none";
}

function saveToday() {
  if (log.length === 0) {
    showToast("No data to save", "warning");
    return;
  }

  let totals = {
    cal: Number(document.getElementById("total-cal").textContent),
    pro: Number(document.getElementById("total-pro").textContent),
    carb: Number(document.getElementById("total-carb").textContent),
    fat: Number(document.getElementById("total-fat").textContent),
    sugar: Number(document.getElementById("total-sugar").textContent),
    score: Number(document.getElementById("health-score").textContent),
    date: new Date().toLocaleDateString("en-IN")
  };

  // Load old weekly data
  let weekly = JSON.parse(localStorage.getItem("weeklyData") || "[]");

  // Remove old entry if same date already saved
  weekly = weekly.filter(d => d.date !== totals.date);

  // Add today
  weekly.push(totals);

  // Save back
  localStorage.setItem("weeklyData", JSON.stringify(weekly));

  showToast("Today's data saved!", "success");
}
function loadWeeklySummary() {
  const weekly = JSON.parse(localStorage.getItem("weeklyData") || "[]");
  const tbody = document.querySelector("#weekly-table tbody");
  tbody.innerHTML = "";

  weekly.forEach(day => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${day.date}</td>
      <td>${day.cal}</td>
      <td>${day.sugar}</td>
      <td>${day.score}</td>
    `;
    tbody.appendChild(tr);
  });
}


function renderLog() {
  const list = document.getElementById("log-list");
  list.innerHTML = "";

  let totals = { cal: 0, pro: 0, carb: 0, fat: 0, sugar: 0 };

  log.forEach((e, i) => {
    const li = document.createElement("li");

    // HEALTH LABEL CHECK
    const name = e.name.toLowerCase();

    let label = "";
    let labelColor = "";

    const healthyFoods = [
      "banana","apple","orange","grapes","milk","curd","buttermilk","dal","rajma",
      "chole","idli","dosa","upma","poha","paneer","egg","sprouts","salad",
      "oats","brown rice","vegetable","sambar","uttapam","fish","chicken breast",
      "muesli","almonds","peanuts","fruits"
    ];

    const junkFoods = [
      "pizza","burger","fries","chips","maggi","samosa","kachori",
      "pakoda","ice cream","milkshake","cold drink","jalebi","gulab jamun",
      "kurkure","fried","energy drink","chocolate"
    ];

    if (junkFoods.some(j => name.includes(j))) {
      label = "🔴 Junk";
      labelColor = "red";
    } else if (healthyFoods.some(h => name.includes(h))) {
      label = "🟢 Healthy";
      labelColor = "green";
    } else {
      label = "🟡 Moderate";
      labelColor = "orange";
    }

    // ITEM DISPLAY
    li.innerHTML = `
      <div>
        ${e.name} × ${e.qty} ${e.unit} 
        <span style="color:${labelColor}; font-weight:600;">${label}</span>
      </div>
      <div>${e.calories} kcal</div>
    `;

    // REMOVE BUTTON
    const rem = document.createElement("button");
    rem.textContent = "Remove";
    rem.classList.add("remove-btn");
    rem.onclick = () => {
      log.splice(i, 1);
      renderLog();
      showToast("Item removed", "error");
   };

    li.appendChild(rem);
    list.appendChild(li);

    // TOTALS UPDATE
    totals.cal += e.calories;
    totals.pro += e.protein;
    totals.carb += e.carbs;
    totals.fat += e.fat;
    totals.sugar += e.sugar;
  });

  document.getElementById("total-cal").textContent = totals.cal.toFixed(1);
  document.getElementById("total-pro").textContent = totals.pro.toFixed(1);
  document.getElementById("total-carb").textContent = totals.carb.toFixed(1);
  document.getElementById("total-fat").textContent = totals.fat.toFixed(1);
  document.getElementById("total-sugar").textContent = totals.sugar.toFixed(1);

  updateChart(totals);
  updateGoalMessage(totals.cal);
  updateSuggestions(totals);
  updateHealthyScore(totals, log);

}
function resetDay() {
  if (!confirm("Are you sure you want to reset today's log?")) return;

  log.length = 0; // clear array

  // Clear totals visually
  document.getElementById("total-cal").textContent = "0";
  document.getElementById("total-pro").textContent = "0";
  document.getElementById("total-carb").textContent = "0";
  document.getElementById("total-fat").textContent = "0";
  document.getElementById("total-sugar").textContent = "0";

  // Clear list and suggestions
  document.getElementById("log-list").innerHTML = "";
  document.getElementById("suggestions").innerHTML = "<div>Add foods to begin tracking.</div>";
  document.getElementById("goal-msg").textContent = "";

  // Reset chart
  chart.data.datasets[0].data = [0, 0, 0];
  chart.update();
  showToast("Day reset successfully!", "success");
}
function showToast(message, type="success") {
  const container = document.getElementById("toast-container");

  const div = document.createElement("div");
  div.classList.add("toast");

  if (type === "success") div.classList.add("toast-success");
  if (type === "warning") div.classList.add("toast-warning");
  if (type === "error") div.classList.add("toast-error");

  div.textContent = message;
  container.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 2600);
}


// ------------------ CHART -------------------

function initChart() {
  const ctx = document.getElementById("nutri-chart").getContext("2d");
  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Protein (g)", "Carbs (g)", "Fat (g)"],
      datasets: [
        {
          data: [0, 0, 0],
          backgroundColor: ["#2b8a9e", "#f5b400", "#e77b8b"],
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
    },
  });
}

function updateChart(totals) {
  chart.data.datasets[0].data = [totals.pro, totals.carb, totals.fat];
  chart.update();
}

// ------------------ GOALS -------------------

function updateGoalMessage(currentCal) {
  const goal = parseFloat(document.getElementById("cal-goal").value) || 2000;
  const msg = document.getElementById("goal-msg");

  if (currentCal === 0) msg.textContent = "Add foods to see progress.";
  else if (currentCal > goal)
    msg.textContent = `You exceeded your goal by ${(currentCal - goal).toFixed(1)} kcal.`;
  else msg.textContent = `${(goal - currentCal).toFixed(1)} kcal remaining.`;
}

// ------------------ SMART SUGGESTIONS -------------------

function updateSuggestions(totals) {
  const container = document.getElementById("suggestions");
  container.innerHTML = ""; // clear old suggestions

  const cal = totals.cal || 0;
  const pro = totals.pro || 0;
  const sugar = totals.sugar || 0;

  // Identify junk items
  const junkList = ["pizza","burger","fries","chips","maggi","samosa","kachori","pakoda","ice cream","milkshake","cold drink","jalebi","gulab jamun","kurkure"];
  const junkCount = log.filter(i =>
    junkList.some(j => i.name.toLowerCase().includes(j))
  ).length;

  // Daily goal
  const goal = Number(document.getElementById("cal-goal").value) || 2000;

  // Helper to add suggestion cards
  function card(text, type="normal") {
    const div = document.createElement("div");
    div.classList.add("suggest-card", `type-${type}`);
    div.innerHTML = text;
    container.appendChild(div);
  }

  // -------------------------
  // 1. PROTEIN SUGGESTIONS
  // -------------------------
  if (pro < 20) {
    card("🥚 Your protein is low. Add eggs, paneer, dal, or sprouts.", "low");
  } 
  else if (pro < 40) {
    card("🍗 Good start! A bit more protein will balance your meal.", "normal");
  }
  else {
    card("💪 Great protein intake today!", "good");
  }

  // -------------------------
  // 2. SUGAR SUGGESTIONS
  // -------------------------
  if (sugar > 70) {
    card("⚠️ High sugar! Avoid sweets, soft drinks & milkshakes.", "warn");
  } 
  else if (sugar > 40) {
    card("🍬 Sugar is moderate. Limit sugary snacks & drinks.", "normal");
  } 
  else {
    card("😊 Sugar intake is healthy today!", "good");
  }

  // -------------------------
  // 3. JUNK FOOD SUGGESTIONS
  // -------------------------
  if (junkCount >= 3) {
    card(`🍟 You added ${junkCount} junk foods. Try reducing fried/oily snacks.`, "warn");
  } 
  else if (junkCount === 1 || junkCount === 2) {
    card("🍕 Try balancing your meal with fruits or salads.", "normal");
  } 

  // -------------------------
  // 4. CALORIE GOAL RELATED
  // -------------------------
  const diff = goal - cal;

  if (diff > 500) {
    card("🍌 You are below your goal. Add fruits, nuts, rice, or milk.", "normal");
  } 
  else if (diff > 200) {
    card("🥗 You're slightly under — add a light healthy snack.", "normal");
  } 
  else if (diff < -300) {
    card("⚠️ You exceeded your goal. Choose lighter meals now.", "warn");
  } 
  else if (diff < -100) {
    card("🍽️ You're above goal — consider reducing heavy foods.", "normal");
  } 
  else {
    card("👌 You are close to your target. Great balance!", "good");
  }

  // -------------------------
  // 5. EMPTY LOG
  // -------------------------
  if (log.length === 0) {
    container.innerHTML = "<div class='suggest-card'>Start adding foods to get smart suggestions.</div>";
  }
}


function updateHealthyScore(totals, logItems) {
  let score = 100;

  // 1. Sugar penalty
  if (totals.sugar > 40) score -= 15;
  if (totals.sugar > 60) score -= 25;
  if (totals.sugar > 80) score -= 35;

  // 2. Junk food penalty
  let junkCount = logItems.filter(item => {
    return ["pizza","burger","fries","chips","maggi","samosa","kachori","pakoda","ice cream","milkshake","cold drink","jalebi","gulab jamun","kurkure"]
      .some(j => item.name.toLowerCase().includes(j));
  }).length;

  score -= junkCount * 10;

  // 3. Protein bonus
  if (totals.protein > 40) score += 10;
  if (totals.protein > 60) score += 15;

  // 4. Calorie accuracy
  let goal = Number(document.getElementById("cal-goal").value) || 2000;
  let diff = Math.abs(goal - totals.cal);

  if (diff < 200) score += 10;  // close to goal → good
  else if (diff > 600) score -= 10;

  // 5. Healthy foods bonus
  let healthyCount = logItems.filter(item => {
    return ["salad","sprouts","dal","chole","idli","dosa","upma","poha","oats","paneer","egg","fruits","vegetable"]
      .some(h => item.name.toLowerCase().includes(h));
  }).length;

  score += healthyCount * 2;

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Display score
  const box = document.getElementById("score-box");
  const display = document.getElementById("health-score");
  display.textContent = score;

  // Remove old classes
  box.classList.remove("score-green", "score-yellow", "score-red");

  // Color based on score
  if (score >= 80) box.classList.add("score-green");
  else if (score >= 50) box.classList.add("score-yellow");
  else box.classList.add("score-red");
}

// ---------------- THEME TOGGLE -----------------
function applyTheme() {
  const saved = localStorage.getItem("nt_theme") || "light";
  if (saved === "dark") {
    document.body.classList.add("dark");
    document.getElementById("theme-toggle").textContent = "Light Mode";
  } else {
    document.body.classList.remove("dark");
    document.getElementById("theme-toggle").textContent = "Dark Mode";
  }
}

function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  btn.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("nt_theme", isDark ? "dark" : "light");
    btn.textContent = isDark ? "Light Mode" : "Dark Mode";
  });
}



window.onload = function () {
    applyTheme();
    setupThemeToggle();
    init();
    loadWeeklySummary();
    const savedGoal = localStorage.getItem("nt_defaultGoal");
if (savedGoal) {
   document.getElementById("cal-goal").value = savedGoal;
}

};

