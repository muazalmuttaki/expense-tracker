
// ==========================================
// 1. SELECT HTML ELEMENTS
// ==========================================

const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");
const dateInput = document.getElementById("date");
const searchInput = document.getElementById("search");

const addBtn = document.getElementById("add-btn");

const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("income");
const expenseEl = document.getElementById("expense");

const monthlyIncomeEl = document.getElementById("monthly-income");
const monthlyExpenseEl = document.getElementById("monthly-expense");

const transactionList = document.getElementById("transaction-list");


// ==========================================
// 2. GET TODAY'S DATE
// ==========================================

function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

dateInput.value = getTodayDate();


// ==========================================
// 3. LOAD SAVED DATA
// ==========================================

let transactions =
    JSON.parse(localStorage.getItem("transactions")) || [];

transactions.forEach(function (transaction) {
    if (!transaction.date) {
        transaction.date = getTodayDate();
    }

    if (!transaction.category) {
        transaction.category = "Other";
    }
});


// ==========================================
// 4. SAVE DATA
// ==========================================

function saveData() {
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}


// ==========================================
// 5. ADD TRANSACTION
// ==========================================

function addTransaction() {
    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);
    const type = typeInput.value;
    const category = categoryInput.value;
    const date = dateInput.value;

    if (
        title === "" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        date === ""
    ) {
        alert("Please enter valid transaction details!");
        return;
    }

    const transaction = {
        id: Date.now(),
        title: title,
        amount: amount,
        type: type,
        category: category,
        date: date
    };

    transactions.push(transaction);

    titleInput.value = "";
    amountInput.value = "";
    categoryInput.value = "Other";
    dateInput.value = getTodayDate();

    updateDashboard();
}


// ==========================================
// 6. MONTHLY SUMMARY
// ==========================================

function updateMonthlySummary() {
    const currentMonth = getTodayDate().slice(0, 7);

    let monthlyIncome = 0;
    let monthlyExpense = 0;

    transactions.forEach(function (transaction) {
        if (!transaction.date.startsWith(currentMonth)) {
            return;
        }

        if (transaction.type === "income") {
            monthlyIncome += transaction.amount;
        } else {
            monthlyExpense += transaction.amount;
        }
    });

    monthlyIncomeEl.textContent = `৳${monthlyIncome}`;
    monthlyExpenseEl.textContent = `৳${monthlyExpense}`;
}


// ==========================================
// 7. EXPENSE CHART
// ==========================================

let expenseChart = null;

function updateExpenseChart() {
    const currentMonth = getTodayDate().slice(0, 7);

    const categoryTotals = {};

    transactions.forEach(function (transaction) {
        if (
            transaction.type !== "expense" ||
            !transaction.date.startsWith(currentMonth)
        ) {
            return;
        }

        const category = transaction.category;

        categoryTotals[category] =
            (categoryTotals[category] || 0) + transaction.amount;
    });

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    const chartCanvas = document.getElementById("expense-chart");

    if (!chartCanvas) return;

    if (expenseChart) {
        expenseChart.destroy();
    }

    if (labels.length === 0) {
        return;
    }

    expenseChart = new Chart(chartCanvas, {
        type: "doughnut",

        data: {
            labels: labels,

            datasets: [{
                label: "Expense",
                data: values,
                borderWidth: 2
            }]
        },

        options: {
            responsive: true,

            plugins: {
                legend: {
                    position: "bottom"
                },

                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ৳${context.parsed}`;
                        }
                    }
                }
            }
        }
    });
}


// ==========================================
// 8. UPDATE DASHBOARD
// ==========================================

function updateDashboard() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(function (transaction) {
        if (transaction.type === "income") {
            totalIncome += transaction.amount;
        } else {
            totalExpense += transaction.amount;
        }
    });

    const totalBalance = totalIncome - totalExpense;

    balanceEl.textContent = `৳${totalBalance}`;
    incomeEl.textContent = `৳${totalIncome}`;
    expenseEl.textContent = `৳${totalExpense}`;

    updateMonthlySummary();
    updateExpenseChart();
    renderTransactions();
    saveData();


}


function updateStatistics() {
    const totalCount = transactions.length;

    const incomeCount = transactions.filter(
        transaction => transaction.type === "income"
    ).length;

    const expenseCount = transactions.filter(
        transaction => transaction.type === "expense"
    ).length;

    document.getElementById("total-transactions").textContent =
        totalCount;

    document.getElementById("income-count").textContent =
        incomeCount;

    document.getElementById("expense-count").textContent =
        expenseCount;
}
updateStatistics();

// ==========================================
// 9. RENDER TRANSACTION HISTORY
// ==========================================

function renderTransactions() {
    transactionList.innerHTML = "";

    if (transactions.length === 0) {
    transactionList.innerHTML = `
        <li class="empty-state">
            <span>📭</span>
            <h3>No Transactions Yet</h3>
            <p>Your transactions will appear here.</p>
        </li>
        `;
        return;
    }

    const searchText = searchInput.value.trim().toLowerCase();

    const filteredTransactions = transactions.filter(
        function (transaction) {
            return (
                transaction.title.toLowerCase().includes(searchText) ||
                transaction.category.toLowerCase().includes(searchText) ||
                transaction.type.toLowerCase().includes(searchText) ||
                transaction.date.includes(searchText)
            );
        }
    );

    if (filteredTransactions.length === 0) {
        const emptyMessage = document.createElement("li");

        emptyMessage.textContent = "No transactions found.";
        emptyMessage.style.padding = "15px";
        emptyMessage.style.color = "#64748b";

        transactionList.appendChild(emptyMessage);
        return;
    }

    filteredTransactions.forEach(function (transaction) {
        const li = document.createElement("li");
        li.className = "transaction-item";

        const info = document.createElement("div");
        info.className = "transaction-info";

        const name = document.createElement("strong");
        name.textContent = transaction.title;

        const details = document.createElement("small");
        details.textContent =
            `${transaction.category} • ${transaction.date}`;

        info.appendChild(name);
        info.appendChild(details);

        const amount = document.createElement("span");

        const symbol =
            transaction.type === "income" ? "+" : "-";

        amount.className =
            transaction.type === "income"
                ? "amount-income"
                : "amount-expense";

        amount.textContent = `${symbol}৳${transaction.amount}`;

        const actions = document.createElement("div");
        actions.className = "transaction-actions";

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.className = "edit-btn";

        editBtn.addEventListener("click", function () {
            editTransaction(transaction.id);
        });

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.className = "delete-btn";

        deleteBtn.addEventListener("click", function () {
            deleteTransaction(transaction.id);
        });

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(info);
        li.appendChild(amount);
        li.appendChild(actions);

        transactionList.appendChild(li);
    });
}


// ==========================================
// 10. EDIT TRANSACTION
// ==========================================

function editTransaction(id) {
    const transaction = transactions.find(function (item) {
        return item.id === id;
    });

    if (!transaction) return;

    const newTitle = prompt(
        "Enter new transaction name:",
        transaction.title
    );

    if (newTitle === null) return;

    if (newTitle.trim() === "") {
        alert("Name cannot be empty!");
        return;
    }

    const newAmount = prompt(
        "Enter new amount:",
        transaction.amount
    );

    if (newAmount === null) return;

    const amount = Number(newAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid amount!");
        return;
    }

    transaction.title = newTitle.trim();
    transaction.amount = amount;

    updateDashboard();
}


// ==========================================
// 11. DELETE TRANSACTION
// ==========================================

function deleteTransaction(id) {
    const confirmDelete = confirm("Delete this transaction?");

    if (!confirmDelete) return;

    transactions = transactions.filter(function (transaction) {
        return transaction.id !== id;
    });

    updateDashboard();
}


// ==========================================
// 12. EVENT LISTENERS
// ==========================================

addBtn.addEventListener("click", addTransaction);

searchInput.addEventListener("input", renderTransactions);


// ==========================================
// 13. INITIALIZE DASHBOARD
// ==========================================

updateDashboard();
// Dark / Light Mode
const themeToggle = document.getElementById("theme-toggle");

// Saved Theme
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    themeToggle.textContent = "☀️ Light Mode";
}

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("theme", "dark");
        themeToggle.textContent = "☀️ Light Mode";
    } else {
        localStorage.setItem("theme", "light");
        themeToggle.textContent = "🌙 Dark Mode";
    }
});


// CSV Export

function exportCSV() {
    if (transactions.length === 0) {
        alert("No transactions available to export!");
        return;
    }

    const headers = [
        "Title",
        "Amount",
        "Type",
        "Category",
        "Date"
    ];

    const rows = transactions.map(transaction => [
        transaction.title,
        transaction.amount,
        transaction.type,
        transaction.category,
        transaction.date
    ]);

    const csvContent = [
        headers,
        ...rows
    ]
    .map(row =>
        row.map(value =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
        ).join(",")
    )
    .join("\n");

    // Excel compatibility
    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "expense-report.csv";

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Export Button Event
document.getElementById("export-btn")
    .addEventListener("click", exportCSV);


    
// Monthly History Elements

const historyMonth = document.getElementById("history-month");
const historyIncome = document.getElementById("history-income");
const historyExpense = document.getElementById("history-expense");
const historyBalance = document.getElementById("history-balance");
const monthlyTransactionList = document.getElementById(
    "monthly-transaction-list"
);

// Set Current Month

historyMonth.value = getTodayDate().slice(0, 7);

// Update Monthly History

function updateMonthlyHistory() {
    const selectedMonth = historyMonth.value;

    const monthlyTransactions = transactions.filter(transaction =>
        transaction.date &&
        transaction.date.startsWith(selectedMonth)
    );

    let income = 0;
    let expense = 0;

    monthlyTransactions.forEach(transaction => {
        if (transaction.type === "income") {
            income += Number(transaction.amount);
        } else {
            expense += Number(transaction.amount);
        }
    });

    // Update Summary

    historyIncome.textContent = `৳${income}`;
    historyExpense.textContent = `৳${expense}`;
    historyBalance.textContent = `৳${income - expense}`;

    // Update Transaction List

    monthlyTransactionList.innerHTML = "";

    if (monthlyTransactions.length === 0) {
        monthlyTransactionList.innerHTML =
            "<li>No transactions found for this month.</li>";
        return;
    }

    monthlyTransactions.forEach(transaction => {
        const li = document.createElement("li");

        li.className = "transaction-item";

        const info = document.createElement("div");
        info.className = "transaction-info";

        const title = document.createElement("strong");
        title.textContent = transaction.title;

        const details = document.createElement("small");
        details.textContent =
            `${transaction.category} • ${transaction.date}`;

        info.append(title, details);

        const amount = document.createElement("strong");

        const isIncome = transaction.type === "income";

        amount.className = isIncome
            ? "amount-income"
            : "amount-expense";

        amount.textContent =
            `${isIncome ? "+" : "-"}৳${transaction.amount}`;

        li.append(info, amount);

        monthlyTransactionList.appendChild(li);
    });
}

// Month Change Event

historyMonth.addEventListener("change", updateMonthlyHistory);

// Initial Update

updateMonthlyHistory();
