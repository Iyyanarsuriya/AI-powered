import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STORAGE_TX_PREFIX = "finance_user_tx_";
const STORAGE_CAT_PREFIX = "finance_user_cat_";

const defaultCategories = [
  { id: "food_dining", name: "Food & Dining", type: "expense", icon: "🍔", budget: 8000, color: "bg-amber-500" },
  { id: "groceries", name: "Groceries", type: "expense", icon: "🛒", budget: 10000, color: "bg-emerald-500" },
  { id: "housing_rent", name: "Housing & Rent", type: "expense", icon: "🏠", budget: 25000, color: "bg-violet-600" },
  { id: "transport", name: "Transport", type: "expense", icon: "🚗", budget: 4000, color: "bg-blue-500" },
  { id: "utilities", name: "Utilities", type: "expense", icon: "⚡", budget: 5000, color: "bg-yellow-500" },
  { id: "shopping", name: "Shopping", type: "expense", icon: "🛍️", budget: 6000, color: "bg-pink-500" },
  { id: "entertainment", name: "Entertainment", type: "expense", icon: "🎬", budget: 4000, color: "bg-rose-500" },
  { id: "salary", name: "Salary", type: "income", icon: "💼", budget: 0, color: "bg-emerald-600" },
  { id: "freelance", name: "Freelance", type: "income", icon: "💻", budget: 0, color: "bg-blue-600" },
  { id: "investments", name: "Investments", type: "income", icon: "📈", budget: 0, color: "bg-violet-600" },
  { id: "other_expense", name: "Other Expense", type: "expense", icon: "💳", budget: 3000, color: "bg-slate-500" },
  { id: "other_income", name: "Other Income", type: "income", icon: "💰", budget: 0, color: "bg-teal-600" },
];

const availableIcons = ["🍔", "🛒", "🏠", "🚗", "⚡", "🛍️", "🎬", "💼", "💻", "📈", "💳", "💰", "💊", "🏋️", "✈️", "📚", "🎮", "🐾", "☕", "🎁"];
const availableColors = ["bg-violet-600", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-blue-500", "bg-pink-500", "bg-indigo-600", "bg-teal-500", "bg-slate-500"];

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Active navigation tab from Sidebar
  const [activeTab, setActiveTab] = useState("Dashboard"); // "Dashboard" | "Expenses" | "Income" | "Budget" | "Reports" | "AIAssistant"

  // Search filter from Header
  const [searchQuery, setSearchQuery] = useState("");

  // Notifications drawer state
  const [showNotifications, setShowNotifications] = useState(false);

  // Profile menu dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Add Transaction Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  // Custom Category creation state inside modal
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🏷️");
  const [newCatBudget, setNewCatBudget] = useState("5000");

  const [txForm, setTxForm] = useState({
    title: "",
    amount: "",
    type: "expense", // "expense" | "income"
    category: "Food & Dining",
    notes: "",
  });

  // User-scoped storage keys
  const userEmail = user?.email || "default_user";
  const txStorageKey = `${STORAGE_TX_PREFIX}${userEmail}`;
  const catStorageKey = `${STORAGE_CAT_PREFIX}${userEmail}`;

  // ==========================================
  // DYNAMIC CATEGORIES (Loaded & Managed by User)
  // ==========================================
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem(catStorageKey);
      return saved ? JSON.parse(saved) : defaultCategories;
    } catch {
      return defaultCategories;
    }
  });

  const updateCategories = (newCatList) => {
    setCategories(newCatList);
    try {
      localStorage.setItem(catStorageKey, JSON.stringify(newCatList));
    } catch (e) {
      console.error("Failed to save categories to storage:", e);
    }
  };

  // Helper to add a new category dynamically
  const handleAddNewCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return null;

    // Check if category already exists
    const existing = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setIsAddingNewCategory(false);
      return existing.name;
    }

    const randomColor = availableColors[Math.floor(Math.random() * availableColors.length)];
    const newCat = {
      id: `cat_${Date.now()}`,
      name: trimmed,
      type: txForm.type,
      icon: newCatIcon || "🏷️",
      budget: parseFloat(newCatBudget) || 5000,
      color: randomColor,
    };

    const updated = [...categories, newCat];
    updateCategories(updated);
    setIsAddingNewCategory(false);
    setNewCatName("");
    return trimmed;
  };

  // ==========================================
  // DYNAMIC TRANSACTIONS (User Data)
  // ==========================================
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem(txStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const updateTransactions = (newTxList) => {
    setTransactions(newTxList);
    try {
      localStorage.setItem(txStorageKey, JSON.stringify(newTxList));
    } catch (e) {
      console.error("Failed to save transactions to storage:", e);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Add Transaction Handler
  const handleCreateTransaction = (e) => {
    e.preventDefault();
    if (!txForm.title.trim() || !txForm.amount || parseFloat(txForm.amount) <= 0) return;

    let selectedCategory = txForm.category;

    // If user is typing a new custom category
    if (isAddingNewCategory && newCatName.trim()) {
      const createdCatName = handleAddNewCategory();
      if (createdCatName) {
        selectedCategory = createdCatName;
      }
    }

    const newTx = {
      id: Date.now(),
      title: txForm.title.trim(),
      amount: parseFloat(txForm.amount),
      type: txForm.type,
      category: selectedCategory,
      notes: txForm.notes.trim(),
      date: new Date().toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    updateTransactions([newTx, ...transactions]);
    setTxForm({
      title: "",
      amount: "",
      type: "expense",
      category: categories.filter((c) => c.type === "expense")[0]?.name || "Food & Dining",
      notes: "",
    });
    setIsAddingNewCategory(false);
    setShowAddModal(false);
  };

  // Delete Transaction Handler
  const handleDeleteTransaction = (id) => {
    updateTransactions(transactions.filter((tx) => tx.id !== id));
  };

  // ==========================================
  // DYNAMIC COMPUTATIONS (100% Data-Driven)
  // ==========================================

  // Total Income
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Total Expenses
  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Total Balance
  const totalBalance = totalIncome - totalExpenses;

  // Savings and Savings Rate
  const savings = totalIncome > totalExpenses ? totalIncome - totalExpenses : 0;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((savings / totalIncome) * 100)) : 0;

  // Category Spending Breakdown (Dynamic from user transactions and categories)
  const categoryBreakdown = useMemo(() => {
    const expenseList = transactions.filter((t) => t.type === "expense");
    const map = {};

    expenseList.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });

    return Object.entries(map).map(([catName, spent]) => {
      const catObj = categories.find((c) => c.name === catName);
      return {
        category: catName,
        spent,
        percentage: totalExpenses > 0 ? Math.round((spent / totalExpenses) * 100) : 0,
        budget: catObj?.budget || 5000,
        icon: catObj?.icon || "🏷️",
        color: catObj?.color || "bg-violet-600",
      };
    }).sort((a, b) => b.spent - a.spent);
  }, [transactions, totalExpenses, categories]);

  // Filtered categories by transaction type
  const availableCategoriesForType = useMemo(() => {
    return categories.filter((c) => c.type === txForm.type || c.type === "both");
  }, [categories, txForm.type]);

  // Filtered transactions for Search and Tab filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (activeTab === "Expenses" && tx.type !== "expense") return false;
      if (activeTab === "Income" && tx.type !== "income") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.title.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          (tx.notes && tx.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* ======================================================== */}
      {/* 1. SIDEBAR                                               */}
      {/* ======================================================== */}
      <aside className="hidden w-64 flex-col border-r border-slate-200/80 bg-white md:flex">
        {/* Brand Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-base font-bold text-white shadow-md shadow-violet-500/20">
            ₹
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              Finance<span className="text-violet-600">AI</span>
            </span>
            <span className="block text-[10px] font-medium text-slate-400">
              Smart Assistant
            </span>
          </div>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 space-y-1.5 p-4">
          {[
            { id: "Dashboard", label: "Dashboard", icon: "📊" },
            { id: "Expenses", label: "Expenses", icon: "💳" },
            { id: "Income", label: "Income", icon: "📈" },
            { id: "Budget", label: "Budget", icon: "🎯" },
            { id: "Reports", label: "Reports", icon: "📑" },
            { id: "AIAssistant", label: "AI Assistant", icon: "💬" },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick Add Button & User Status */}
        <div className="border-t border-slate-100 p-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition hover:opacity-95"
          >
            <span>+</span> Add Transaction
          </button>

          <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-slate-400">
            <span>{categories.length} Categories</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ======================================================== */}
        {/* 2. HEADER                                                */}
        {/* ======================================================== */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          {/* Search Bar */}
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full max-w-xs sm:max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions, categories..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Header Right: Notifications & Profile */}
          <div className="flex items-center gap-3">
            {/* Quick Add Button (Mobile) */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 md:hidden"
            >
              <span>+</span> Add
            </button>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="Notifications"
              >
                🔔
                {transactions.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-violet-600 ring-2 ring-white" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <span className="text-[10px] text-slate-400">{transactions.length} activities</span>
                  </div>
                  <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
                    {transactions.length === 0 ? (
                      <p className="py-4 text-center text-xs text-slate-400">No notifications yet</p>
                    ) : (
                      transactions.slice(0, 3).map((tx) => (
                        <div key={tx.id} className="rounded-lg bg-slate-50 p-2 text-xs">
                          <p className="font-semibold text-slate-800">
                            {tx.type === "income" ? "Received " : "Spent "}
                            ₹{tx.amount.toLocaleString()} on {tx.title}
                          </p>
                          <p className="text-[10px] text-slate-400">{tx.date}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-3 text-left transition hover:bg-slate-50"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white">
                  {user?.full_name?.charAt(0) || "U"}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-slate-900 leading-none">
                    {user?.full_name || "Account"}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-none mt-1">
                    {user?.email || "User"}
                  </p>
                </div>
              </button>

              {/* Profile Menu Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900">{user?.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                  </div>

                  <Link
                    to="/"
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    🏠 Home Page
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ======================================================== */}
        {/* 3. MAIN DASHBOARD CONTENT                                */}
        {/* ======================================================== */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Header Greeting & Tab Title */}
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {activeTab === "Dashboard" ? `Welcome back, ${user?.full_name?.split(" ")[0] || "User"}!` : activeTab}
                </h1>
                <p className="text-xs text-slate-500 mt-1">
                  Real-time financial summary calculated dynamically from your recorded transactions and categories.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-700"
                >
                  <span>+</span> Add Transaction
                </button>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 3.1 DYNAMIC METRIC CARDS (Total Balance, Income, Expenses, Savings) */}
            {/* ---------------------------------------------------- */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Balance */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Balance</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 font-bold">
                    ₹
                  </span>
                </div>
                <div className="mt-3">
                  <p className={`text-2xl font-black ${totalBalance >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                    ₹{totalBalance.toLocaleString()}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Net available balance
                  </p>
                </div>
              </div>

              {/* Total Income */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Income</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                    ↗
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-emerald-600">
                    +₹{totalIncome.toLocaleString()}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {transactions.filter((t) => t.type === "income").length} income entries
                  </p>
                </div>
              </div>

              {/* Total Expenses */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Expenses</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 font-bold">
                    ↘
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-slate-900">
                    -₹{totalExpenses.toLocaleString()}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {transactions.filter((t) => t.type === "expense").length} expense records
                  </p>
                </div>
              </div>

              {/* Savings */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Net Savings</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    💎
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black text-blue-600">
                    ₹{savings.toLocaleString()}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                    {savingsRate}% savings rate
                  </p>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------- */}
            {/* 3.2 MAIN 2-COLUMN: Expense Chart & Budget Progress   */}
            {/* ---------------------------------------------------- */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Left 2 Columns: Expense Chart + Recent Transactions */}
              <div className="space-y-8 lg:col-span-2">
                {/* Expense Chart / Breakdown */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Expense Chart & Distribution</h2>
                      <p className="text-xs text-slate-500">Live category breakdown of your spending</p>
                    </div>
                    <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">
                      Total: ₹{totalExpenses.toLocaleString()}
                    </span>
                  </div>

                  {/* Visual Chart Bars */}
                  {categoryBreakdown.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-2xl">📊</p>
                      <p className="mt-2 text-xs font-semibold text-slate-700">No expense records found</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Add expenses to see your visual distribution chart.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      {categoryBreakdown.map((cat) => (
                        <div key={cat.category}>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-2 text-slate-700">
                              <span>{cat.icon}</span>
                              {cat.category}
                            </span>
                            <span className="text-slate-900">
                              ₹{cat.spent.toLocaleString()}{" "}
                              <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Transactions List */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
                      <p className="text-xs text-slate-500">
                        {filteredTransactions.length} recorded items
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="text-xs font-bold text-violet-600 hover:text-violet-700"
                    >
                      + Add New
                    </button>
                  </div>

                  {filteredTransactions.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-3xl">💳</p>
                      <p className="mt-2 text-xs font-semibold text-slate-800">
                        {searchQuery ? "No matching transactions found" : "No transactions recorded yet"}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400 max-w-xs mx-auto">
                        {searchQuery
                          ? "Try clearing your search query to see all records."
                          : "Click '+ Add Transaction' to record your first income or expense."}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 divide-y divide-slate-100">
                      {filteredTransactions.map((tx) => {
                        const catObj = categories.find((c) => c.name === tx.category);
                        const icon = catObj?.icon || (tx.type === "income" ? "💰" : "💳");

                        return (
                          <div
                            key={tx.id}
                            className="group flex items-center justify-between py-3.5 px-2 rounded-xl transition hover:bg-slate-50/70"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">
                                {icon}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{tx.title}</p>
                                <p className="text-xs text-slate-400">
                                  {tx.category} • {tx.date} {tx.time && `• ${tx.time}`}
                                </p>
                                {tx.notes && (
                                  <p className="text-[11px] text-slate-500 italic mt-0.5">{tx.notes}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`text-sm font-bold ${
                                  tx.type === "income" ? "text-emerald-600" : "text-slate-900"
                                }`}
                              >
                                {tx.type === "income" ? "+" : "-"}₹{tx.amount.toLocaleString()}
                              </span>

                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="opacity-0 group-hover:opacity-100 rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                title="Delete transaction"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Budget Progress & Quick Actions */}
              <div className="space-y-6">
                {/* Budget Progress Card */}
                <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Budget Progress</h2>
                      <p className="text-[11px] text-slate-400">Monthly limits vs spent</p>
                    </div>
                    <span className="text-xs font-bold text-violet-600">🎯 Goals</span>
                  </div>

                  {categoryBreakdown.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400">
                      No spending recorded against budgets yet.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {categoryBreakdown.slice(0, 6).map((cat) => {
                        const usage = Math.min(Math.round((cat.spent / cat.budget) * 100), 100);
                        const isOver = cat.spent > cat.budget;
                        return (
                          <div key={cat.category}>
                            <div className="flex items-center justify-between text-xs font-semibold">
                              <span className="flex items-center gap-1.5 text-slate-700">
                                <span>{cat.icon}</span>
                                {cat.category}
                              </span>
                              <span className={isOver ? "text-rose-600 font-bold" : "text-slate-500"}>
                                ₹{cat.spent.toLocaleString()} / ₹{cat.budget.toLocaleString()}
                              </span>
                            </div>
                            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full ${
                                  isOver ? "bg-rose-500" : cat.color
                                } rounded-full transition-all duration-500`}
                                style={{ width: `${usage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Financial Summary & AI Advice Banner */}
                <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/70 to-indigo-50/50 p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet-700">
                      Financial Health
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                      {savingsRate >= 50 ? "Excellent" : savingsRate >= 20 ? "Good" : "Needs Attention"}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{savingsRate}%</span>
                    <span className="text-xs text-slate-500">savings rate</span>
                  </div>

                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {totalExpenses === 0 && totalIncome === 0
                      ? "Start logging your daily income and expenses to track your financial health score."
                      : totalBalance >= 0
                      ? `You are saving ₹${savings.toLocaleString()} this cycle. Great discipline!`
                      : "Expenses exceed income this period. Review discretionary spending."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ======================================================== */}
      {/* 4. ADD TRANSACTION MODAL (WITH DYNAMIC CATEGORY CREATION) */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false);
              setIsAddingNewCategory(false);
            }}
          />

          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add New Transaction</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsAddingNewCategory(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="mt-4 space-y-4">
              {/* Type Switcher: Expense vs Income */}
              <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setTxForm({
                      ...txForm,
                      type: "expense",
                      category: categories.filter((c) => c.type === "expense")[0]?.name || "Food & Dining",
                    });
                    setIsAddingNewCategory(false);
                  }}
                  className={`rounded-xl py-2 text-xs font-bold transition ${
                    txForm.type === "expense"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  💳 Expense
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTxForm({
                      ...txForm,
                      type: "income",
                      category: categories.filter((c) => c.type === "income")[0]?.name || "Salary",
                    });
                    setIsAddingNewCategory(false);
                  }}
                  className={`rounded-xl py-2 text-xs font-bold transition ${
                    txForm.type === "income"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  📈 Income
                </button>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <input
                  type="text"
                  required
                  placeholder={txForm.type === "expense" ? "e.g. Grocery Shopping" : "e.g. Monthly Salary"}
                  value={txForm.title}
                  onChange={(e) => setTxForm({ ...txForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  placeholder="2500"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </div>

              {/* Category Selection & Custom Category Adder */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">Category</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                    className="text-xs font-bold text-violet-600 hover:text-violet-700"
                  >
                    {isAddingNewCategory ? "← Select Existing" : "+ New Category"}
                  </button>
                </div>

                {!isAddingNewCategory ? (
                  <select
                    value={txForm.category}
                    onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
                  >
                    {availableCategoriesForType.map((cat) => (
                      <option key={cat.id || cat.name} value={cat.name}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  /* Custom Category Form Box */
                  <div className="mt-1.5 rounded-2xl border border-violet-200 bg-violet-50/40 p-3 space-y-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600">Category Name</label>
                      <input
                        type="text"
                        required={isAddingNewCategory}
                        placeholder="e.g. Pet Care, Gym, Subscription..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-200"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600">Choose Icon</label>
                        <select
                          value={newCatIcon}
                          onChange={(e) => setNewCatIcon(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900"
                        >
                          {availableIcons.map((ic) => (
                            <option key={ic} value={ic}>{ic}</option>
                          ))}
                        </select>
                      </div>

                      {txForm.type === "expense" && (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600">Monthly Budget (₹)</label>
                          <input
                            type="number"
                            placeholder="5000"
                            value={newCatBudget}
                            onChange={(e) => setNewCatBudget(e.target.value)}
                            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Optional tags or comments"
                  value={txForm.notes}
                  onChange={(e) => setTxForm({ ...txForm, notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
                />
              </div>

              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-violet-600 py-3 text-xs font-bold text-white shadow-md shadow-violet-500/25 transition hover:bg-violet-700"
              >
                Save {txForm.type === "income" ? "Income" : "Expense"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
