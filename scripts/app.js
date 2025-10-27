const modal = document.getElementById("modal");
const modalCard = document.querySelector(".modal-card");
const addBtn = document.getElementById("addBtn");
const cancelBtn = document.getElementById("cancelBtn");
const txForm = document.getElementById("txForm");
const txDate = document.getElementById("txDate");
const txCategorySelect = document.getElementById("txCategorySelect");
const txCategoryCustom = document.getElementById("txCategoryCustom");
const txAmount = document.getElementById("txAmount");
const txType = document.getElementById("txType");
const txTable = document.getElementById("txTable");
const totalIncomeEl = document.getElementById("totalIncome");
const totalExpenseEl = document.getElementById("totalExpense");
const incomeLeftEl = document.getElementById("incomeLeft");
const savingRateEl = document.getElementById("savingRate");
const totalIncomeFromEl = document.getElementById("totalIncomeFrom");
const searchInput = document.getElementById("searchInput");
const fromDate = document.getElementById("fromDate");
const toDate = document.getElementById("toDate");
const filterBtn = document.getElementById("filterBtn");
const clearFilterBtn = document.getElementById("clearFilterBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const setBudgetBtn = document.getElementById("setBudgetBtn");
const budgetInput = document.getElementById("budgetInput");
const themeToggle = document.getElementById("themeToggle");

let transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
let budget = parseFloat(localStorage.getItem("budget") || "0");
let editingIndex = -1;

const formatCurrency = (v) =>
  "₹" + Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 });

function saveAll() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
  localStorage.setItem("budget", String(budget || 0));
}

function openModal(mode = "add", tx = null, index = -1) {
  if (mode === "add") {
    document.getElementById("modalTitle").textContent = "Add Transaction";
    txForm.reset();
    txDate.value = new Date().toISOString().slice(0, 10);
    txCategorySelect.value = "Salary";
    txCategoryCustom.style.display = "none";
    txCategoryCustom.value = "";
    txType.value = "expense";
    editingIndex = -1;
    txCategorySelect.focus();
  } else {
    document.getElementById("modalTitle").textContent = "Edit Transaction";
    txDate.value = tx.date;
    const opts = Array.from(txCategorySelect.options).map((o) => o.value);
    if (opts.includes(tx.category)) {
      txCategorySelect.value = tx.category;
      txCategoryCustom.style.display = "none";
      txCategoryCustom.value = "";
    } else {
      txCategorySelect.value = "Other";
      txCategoryCustom.style.display = "block";
      txCategoryCustom.value = tx.category;
    }
    txAmount.value = tx.amount;
    txType.value = tx.type;
    editingIndex = index;
  }
  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => modalCard.focus?.(), 150);
}

function closeModal() {
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  editingIndex = -1;
}

addBtn.addEventListener("click", () => openModal("add"));
cancelBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

txCategorySelect.addEventListener("change", () => {
  if (txCategorySelect.value === "Other") {
    txCategoryCustom.style.display = "block";
    txCategoryCustom.focus();
  } else {
    txCategoryCustom.style.display = "none";
    txCategoryCustom.value = "";
  }
});

function render(list = transactions) {
  const totalIncomeTrans = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const incomeLeft = totalIncomeTrans - totalExpense;
  let savingRate = 0;
  if (budget > 0) {
    savingRate = (incomeLeft / budget) * 100;
  } else if (totalIncomeTrans > 0) {
    savingRate = (incomeLeft / totalIncomeTrans) * 100;
  }
  if (!isFinite(savingRate)) savingRate = 0;

  totalIncomeEl.textContent = formatCurrency(totalIncomeTrans);
  totalIncomeFromEl.textContent =
    budget > 0 ? `budget set: ${formatCurrency(budget)}` : "from transactions";
  totalExpenseEl.textContent = formatCurrency(totalExpense);
  incomeLeftEl.textContent = formatCurrency(incomeLeft);
  savingRateEl.textContent = `${Number(savingRate).toFixed(1)}%`;

  if (!list.length) {
    txTable.innerHTML =
      '<tr class="empty"><td colspan="5">No transactions yet. Add one!</td></tr>';
    return;
  }

  txTable.innerHTML = list
    .map((t, idx) => {
      const rowClass = t.type === "income" ? "tx-income" : "tx-expense";
      const chipClass = t.type === "income" ? "type-income" : "type-expense";
      const sign = t.type === "expense" ? "-" : "+";
      const amountText = `${sign}${formatCurrency(t.amount)}`;
      return `
        <tr class="${rowClass}">
          <td>${t.date}</td>
          <td>${escapeHtml(t.category)}</td>
          <td class="amount">${amountText}</td>
          <td><span class="type-chip ${chipClass}">${t.type}</span></td>
          <td class="actions">
            <button class="btn" onclick="editTx(${idx})">Edit</button>
            <button class="btn" onclick="deleteTx(${idx})">Delete</button>
          </td>
        </tr>`;
    })
    .join("");
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"]/g,
    (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch])
  );
}

txForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const date = txDate.value || new Date().toISOString().slice(0, 10);
  let category =
    txCategorySelect.value === "Other"
      ? txCategoryCustom.value.trim() || "Other"
      : txCategorySelect.value;
  category = category.trim() || "Misc";
  const amount = parseFloat(txAmount.value) || 0;
  const type = txType.value;
  const txObj = { date, category, amount, type };
  if (editingIndex >= 0) {
    transactions[editingIndex] = txObj;
    editingIndex = -1;
  } else {
    transactions.unshift(txObj);
  }
  saveAll();
  render();
  closeModal();
  txForm.reset();
});

window.editTx = function (i) {
  const tx = transactions[i];
  openModal("edit", tx, i);
};

window.deleteTx = function (i) {
  if (!confirm("Delete this transaction?")) return;
  transactions.splice(i, 1);
  saveAll();
  render();
};

filterBtn.addEventListener("click", applyFilters);
clearFilterBtn.addEventListener("click", () => {
  searchInput.value = "";
  fromDate.value = "";
  toDate.value = "";
  render();
});

function applyFilters() {
  const q = (searchInput.value || "").trim().toLowerCase();
  const f = fromDate.value;
  const t = toDate.value;
  const filtered = transactions.filter((tx) => {
    const matchQ =
      !q ||
      tx.category.toLowerCase().includes(q) ||
      String(tx.amount).includes(q) ||
      tx.type.includes(q);
    const inFrom = !f || tx.date >= f;
    const inTo = !t || tx.date <= t;
    return matchQ && inFrom && inTo;
  });
  render(filtered);
}

exportBtn.addEventListener("click", () => {
  const payload = { budget: budget || 0, transactions };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.json";
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (Array.isArray(parsed)) {
        transactions = parsed;
      } else if (parsed.transactions) {
        transactions = parsed.transactions;
        budget = parsed.budget || budget;
      } else {
        alert(
          "JSON structure not recognized. Expected { budget, transactions } or an array of transactions."
        );
        return;
      }
      saveAll();
      render();
      alert("Import successful.");
    } catch (err) {
      alert("Failed to parse JSON.");
    }
  };
  reader.readAsText(f);
});

setBudgetBtn.addEventListener("click", () => {
  budget = parseFloat(budgetInput.value) || 0;
  localStorage.setItem("budget", String(budget));
  render();
});

(function initTheme() {
  const saved = localStorage.getItem("theme") || "light";
  if (saved === "dark") document.documentElement.classList.add("dark");
  themeToggle.textContent = document.documentElement.classList.contains("dark")
    ? "☀️"
    : "🌙";
})();
themeToggle.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  const theme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  localStorage.setItem("theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
});

addBtn.addEventListener("click", () => {
  txDate.value = new Date().toISOString().slice(0, 10);
});

render();
