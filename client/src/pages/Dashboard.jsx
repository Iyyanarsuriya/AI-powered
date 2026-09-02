import React, { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchIncomes,
  createIncome,
  deleteIncome,
} from "../api/Income/incomeService";

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

  // Active navigation tab from Sidebar: "Dashboard" | "Expenses" | "Income" | "Budget" | "Reports" | "AIAssistant"
  const [activeTab, setActiveTab] = useState("Dashboard");

  // Mobile sidebar drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search filter from Header
  const [searchQuery, setSearchQuery] = useState("");

  // Category filter for Expenses / Income tabs
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Notifications drawer state
  const [showNotifications, setShowNotifications] = useState(false);

  // Profile menu dropdown state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Add Transaction Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  // Editing Category Budget Modal / Inline state
  const [editingBudgetCat, setEditingBudgetCat] = useState(null);
  const [editBudgetValue, setEditBudgetValue] = useState("");

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

  // AI Assistant Chat Messages State
  const [chatMessages, setChatMessages] = useState([
    {
      id: "init",
      sender: "ai",
      text: `Hello ${user?.full_name?.split(" ")[0] || "there"}! 👋 I am your FinanceAI assistant. I analyze your real-time income, expenses, and budget to give you personalized financial advice. How can I help you today?`,
      time: "Just now",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);

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
  // DYNAMIC TRANSACTIONS (User Data & API Sync)
  // ==========================================
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem(txStorageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load incomes from backend API on mount
  useEffect(() => {
    const loadRemoteIncomes = async () => {
      try {
        const dbIncomes = await fetchIncomes();
        if (Array.isArray(dbIncomes)) {
          const formattedIncomes = dbIncomes.map((inc) => ({
            id: `income_${inc.id}`,
            dbId: inc.id,
            title: inc.source,
            amount: inc.amount,
            type: "income",
            category: inc.category,
            notes: inc.notes || "",
            date: new Date(inc.date).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            time: new Date(inc.date).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));

          setTransactions((prev) => {
            const expenses = prev.filter((t) => t.type !== "income");
            const combined = [...formattedIncomes, ...expenses];
            localStorage.setItem(txStorageKey, JSON.stringify(combined));
            return combined;
          });
        }
      } catch (err) {
        console.warn("Could not sync with Income database API (using local cache):", err);
      }
    };

    if (user) {
      loadRemoteIncomes();
    }
  }, [user, txStorageKey]);

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

  // Open modal preconfigured for Expense or Income
  const handleOpenAddModal = (presetType = "expense") => {
    const defaultCat = categories.find((c) => c.type === presetType)?.name || (presetType === "expense" ? "Food & Dining" : "Salary");
    setTxForm({
      title: "",
      amount: "",
      type: presetType,
      category: defaultCat,
      notes: "",
    });
    setIsAddingNewCategory(false);
    setShowAddModal(true);
  };

  // Add Transaction Handler
  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!txForm.title.trim() || !txForm.amount || parseFloat(txForm.amount) <= 0) return;

    let selectedCategory = txForm.category;

    if (isAddingNewCategory && newCatName.trim()) {
      const createdCatName = handleAddNewCategory();
      if (createdCatName) {
        selectedCategory = createdCatName;
      }
    }

    let savedDbId = null;

    if (txForm.type === "income") {
      try {
        const result = await createIncome({
          source: txForm.title.trim(),
          amount: parseFloat(txForm.amount),
          category: selectedCategory,
          notes: txForm.notes.trim() || null,
        });
        if (result && result.id) {
          savedDbId = result.id;
        }
      } catch (err) {
        console.warn("Saved locally, server sync failed:", err);
      }
    }

    const newTx = {
      id: savedDbId ? `income_${savedDbId}` : Date.now(),
      dbId: savedDbId,
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
  const handleDeleteTransaction = async (id, dbId, type) => {
    if (type === "income" && dbId) {
      try {
        await deleteIncome(dbId);
      } catch (err) {
        console.warn("Could not delete from backend API:", err);
      }
    }
    updateTransactions(transactions.filter((tx) => tx.id !== id));
  };

  // Save updated category budget
  const handleSaveBudgetLimit = (catId) => {
    const val = parseFloat(editBudgetValue);
    if (isNaN(val) || val < 0) {
      setEditingBudgetCat(null);
      return;
    }
    const updated = categories.map((c) => (c.id === catId ? { ...c, budget: val } : c));
    updateCategories(updated);
    setEditingBudgetCat(null);
  };

  // ==========================================
  // DYNAMIC COMPUTATIONS
  // ==========================================
  const totalIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalBalance = totalIncome - totalExpenses;
  const savings = totalIncome > totalExpenses ? totalIncome - totalExpenses : 0;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((savings / totalIncome) * 100)) : 0;

  // Total Allocated Budget for Expense Categories
  const totalAllocatedBudget = useMemo(() => {
    return categories
      .filter((c) => c.type === "expense" || c.type === "both")
      .reduce((sum, c) => sum + (c.budget || 0), 0);
  }, [categories]);

  // Category Spending Breakdown
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

  // Income Breakdown
  const incomeBreakdown = useMemo(() => {
    const incomeList = transactions.filter((t) => t.type === "income");
    const map = {};

    incomeList.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });

    return Object.entries(map).map(([catName, amount]) => {
      const catObj = categories.find((c) => c.name === catName);
      return {
        category: catName,
        amount,
        percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
        icon: catObj?.icon || "💰",
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [transactions, totalIncome, categories]);

  // Top spending category
  const topExpenseCategory = useMemo(() => {
    return categoryBreakdown[0] || null;
  }, [categoryBreakdown]);

  // Top income category
  const topIncomeCategory = useMemo(() => {
    return incomeBreakdown[0] || null;
  }, [incomeBreakdown]);

  // Filtered categories by transaction type
  const availableCategoriesForType = useMemo(() => {
    return categories.filter((c) => c.type === txForm.type || c.type === "both");
  }, [categories, txForm.type]);

  // Filtered transactions for Search and Tab filtering
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (activeTab === "Expenses" && tx.type !== "expense") return false;
      if (activeTab === "Income" && tx.type !== "income") return false;

      if (categoryFilter !== "all" && tx.category !== categoryFilter) return false;

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
  }, [transactions, activeTab, categoryFilter, searchQuery]);

  // Export financial report data as CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("No transaction data available to export.");
      return;
    }
    const headers = ["ID", "Title", "Type", "Category", "Amount (INR)", "Date", "Notes"];
    const rows = transactions.map((t) => [
      t.id,
      `"${t.title.replace(/"/g, '""')}"`,
      t.type,
      `"${t.category}"`,
      t.amount,
      `"${t.date}"`,
      `"${(t.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FinanceAI_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // AI Assistant message dispatcher
  const handleSendAiMessage = (promptText = null) => {
    const textToSend = promptText || chatInput.trim();
    if (!textToSend) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!promptText) setChatInput("");
    setIsAiTyping(true);

    setTimeout(() => {
      let aiResponseText = "";
      const lower = textToSend.toLowerCase();

      if (lower.includes("spending") || lower.includes("habits") || lower.includes("expense")) {
        if (totalExpenses === 0) {
          aiResponseText = "You haven't recorded any expenses yet! Once you add your daily expenditures, I will analyze your top spending categories, identify money leaks, and give you actionable cost-reduction recommendations.";
        } else {
          aiResponseText = `Based on your recent transactions, your total spending is ₹${totalExpenses.toLocaleString()}. Your highest expenditure category is **${topExpenseCategory?.category || "N/A"}** with ₹${topExpenseCategory?.spent?.toLocaleString() || 0} (${topExpenseCategory?.percentage || 0}% of all expenses). I recommend monitoring this category closely and setting a realistic budget limit.`;
        }
      } else if (lower.includes("savings") || lower.includes("saving") || lower.includes("invest")) {
        if (totalIncome === 0) {
          aiResponseText = "To calculate your exact savings potential, please add your income records first. Aiming for a minimum 20% to 30% savings rate is recommended for strong financial security.";
        } else {
          aiResponseText = `Your current savings rate is **${savingsRate}%** (₹${savings.toLocaleString()} saved from ₹${totalIncome.toLocaleString()} income). ${savingsRate >= 30 ? "🌟 That is an outstanding savings discipline!" : savingsRate >= 15 ? "👍 Good progress! Trimming non-essential shopping or dining could easily lift you past 25%." : "⚠️ Your savings rate is currently low. Consider reviewing discretionary expenses to boost your emergency reserve."}`;
        }
      } else if (lower.includes("budget") || lower.includes("limit") || lower.includes("goal")) {
        const overBudgetCats = categoryBreakdown.filter((c) => c.spent > c.budget);
        if (overBudgetCats.length > 0) {
          aiResponseText = `🚨 Attention: You have exceeded budget in **${overBudgetCats.map((c) => c.category).join(", ")}**. You have spent ₹${totalExpenses.toLocaleString()} out of your total allocated monthly budget of ₹${totalAllocatedBudget.toLocaleString()}. Head to the **Budget** tab to adjust your limits or trim expenses.`;
        } else {
          aiResponseText = `✅ Good job! All your active categories are currently within their monthly budget limits. Total allocated budget is ₹${totalAllocatedBudget.toLocaleString()}, and you have used ₹${totalExpenses.toLocaleString()} (${totalAllocatedBudget > 0 ? Math.round((totalExpenses / totalAllocatedBudget) * 100) : 0}%).`;
        }
      } else if (lower.includes("summary") || lower.includes("report") || lower.includes("overview")) {
        aiResponseText = `📊 **Financial Summary for ${user?.full_name || "User"}**:\n• Total Inflow: ₹${totalIncome.toLocaleString()} (${transactions.filter((t) => t.type === "income").length} records)\n• Total Outflow: ₹${totalExpenses.toLocaleString()} (${transactions.filter((t) => t.type === "expense").length} records)\n• Net Balance: ₹${totalBalance.toLocaleString()}\n• Savings Rate: ${savingsRate}%\n• Top Expense: ${topExpenseCategory?.category || "None"} (₹${topExpenseCategory?.spent?.toLocaleString() || 0})`;
      } else {
        aiResponseText = `I have analyzed your financial records! You currently have ₹${totalBalance.toLocaleString()} available balance across ${transactions.length} total logged transactions. You can ask me to "Analyze my spending", "Check my budget progress", or "Give me savings tips"!`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: aiResponseText,
          time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setIsAiTyping(false);
    }, 700);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAiTyping]);

  const navItems = [
    { id: "Dashboard", label: "Dashboard", icon: "📊" },
    { id: "Expenses", label: "Expenses", icon: "💳" },
    { id: "Income", label: "Income", icon: "📈" },
    { id: "Budget", label: "Budget", icon: "🎯" },
    { id: "Reports", label: "Reports", icon: "📑" },
    { id: "AIAssistant", label: "AI Assistant", icon: "💬" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* ======================================================== */}
      {/* 1. SIDEBAR (DESKTOP)                                     */}
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
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setCategoryFilter("all");
                }}
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

        {/* Quick Add Button & Category counter */}
        <div className="border-t border-slate-100 p-4">
          <button
            onClick={() => handleOpenAddModal("expense")}
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

      {/* ======================================================== */}
      {/* MOBILE SIDEBAR DRAWER                                    */}
      {/* ======================================================== */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex w-64 flex-col bg-white p-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-sm font-bold text-white">
                  ₹
                </div>
                <span className="font-bold text-slate-900 text-sm">FinanceAI</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>
            <nav className="mt-4 flex-1 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setCategoryFilter("all");
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold ${
                    activeTab === item.id ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* ======================================================== */}
        {/* 2. HEADER                                                */}
        {/* ======================================================== */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden"
            >
              ☰
            </button>

            {/* Search Bar */}
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

          {/* Header Right: Quick Actions, Notifications & Profile */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenAddModal(activeTab === "Income" ? "income" : "expense")}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-violet-700 transition"
            >
              <span>+</span> Add {activeTab === "Income" ? "Income" : activeTab === "Expenses" ? "Expense" : "Transaction"}
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
        {/* 3. DYNAMIC CONTENT AREA BASED ON SIDEBAR TAB SELECTION   */}
        {/* ======================================================== */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-8">
            
            {/* =================================================== */}
            {/* VIEW 1: DASHBOARD TAB (OVERVIEW)                     */}
            {/* =================================================== */}
            {activeTab === "Dashboard" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Header Greeting */}
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                      Welcome back, {user?.full_name?.split(" ")[0] || "User"}!
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Real-time financial summary calculated dynamically from your recorded transactions and categories.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenAddModal("expense")}
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-700"
                    >
                      <span>+</span> Add Transaction
                    </button>
                  </div>
                </div>

                {/* 4 Metric Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {/* Total Balance */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Total Balance</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 font-bold">₹</span>
                    </div>
                    <div className="mt-3">
                      <p className={`text-2xl font-black ${totalBalance >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                        ₹{totalBalance.toLocaleString()}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">Net available balance</p>
                    </div>
                  </div>

                  {/* Total Income */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Total Income</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">↗</span>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-black text-emerald-600">+₹{totalIncome.toLocaleString()}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{transactions.filter((t) => t.type === "income").length} income entries</p>
                    </div>
                  </div>

                  {/* Total Expenses */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Total Expenses</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600 font-bold">↘</span>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-black text-slate-900">-₹{totalExpenses.toLocaleString()}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{transactions.filter((t) => t.type === "expense").length} expense records</p>
                    </div>
                  </div>

                  {/* Savings */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Net Savings</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">💎</span>
                    </div>
                    <div className="mt-3">
                      <p className="text-2xl font-black text-blue-600">₹{savings.toLocaleString()}</p>
                      <p className="mt-1 text-[11px] font-semibold text-emerald-600">{savingsRate}% savings rate</p>
                    </div>
                  </div>
                </div>

                {/* 2-Column Overview: Expense Chart & Budget Progress */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  <div className="space-y-8 lg:col-span-2">
                    {/* Expense Distribution Chart */}
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

                      {categoryBreakdown.length === 0 ? (
                        <div className="py-12 text-center">
                          <p className="text-2xl">📊</p>
                          <p className="mt-2 text-xs font-semibold text-slate-700">No expense records found</p>
                          <p className="mt-1 text-[11px] text-slate-400">Add expenses to see your visual distribution chart.</p>
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
                          <p className="text-xs text-slate-500">{filteredTransactions.length} recorded items</p>
                        </div>
                        <button
                          onClick={() => handleOpenAddModal("expense")}
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
                            {searchQuery ? "Try clearing your search query." : "Click '+ Add Transaction' to log your first income or expense."}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 divide-y divide-slate-100">
                          {filteredTransactions.slice(0, 8).map((tx) => {
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
                                    {tx.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">{tx.notes}</p>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className={`text-sm font-bold ${tx.type === "income" ? "text-emerald-600" : "text-slate-900"}`}>
                                    {tx.type === "income" ? "+" : "-"}₹{tx.amount.toLocaleString()}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteTransaction(tx.id, tx.dbId, tx.type)}
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

                  {/* Right Column: Budget Snapshot & Financial Health */}
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <h2 className="text-sm font-bold text-slate-900">Budget Progress</h2>
                          <p className="text-[11px] text-slate-400">Monthly limits vs spent</p>
                        </div>
                        <button onClick={() => setActiveTab("Budget")} className="text-xs font-bold text-violet-600 hover:underline">
                          View All →
                        </button>
                      </div>

                      {categoryBreakdown.length === 0 ? (
                        <p className="py-8 text-center text-xs text-slate-400">No spending recorded against budgets yet.</p>
                      ) : (
                        <div className="mt-4 space-y-4">
                          {categoryBreakdown.slice(0, 5).map((cat) => {
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
                                    className={`h-full ${isOver ? "bg-rose-500" : cat.color} rounded-full transition-all duration-500`}
                                    style={{ width: `${usage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Financial Health Banner */}
                    <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/70 to-indigo-50/50 p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-violet-700">Financial Health</span>
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
            )}

            {/* =================================================== */}
            {/* VIEW 2: EXPENSES TAB                                 */}
            {/* =================================================== */}
            {activeTab === "Expenses" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Header with quick add and filters */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                      💳 Expenses Manager
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Detailed tracking and categorization of all your outgoing expenditures.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-200"
                    >
                      <option value="all">All Expense Categories</option>
                      {categories
                        .filter((c) => c.type === "expense" || c.type === "both")
                        .map((c) => (
                          <option key={c.id || c.name} value={c.name}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={() => handleOpenAddModal("expense")}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-500/20 transition hover:bg-rose-700"
                    >
                      <span>+</span> Add Expense
                    </button>
                  </div>
                </div>

                {/* Expense Quick Stat Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Total Spent</span>
                    <p className="mt-2 text-2xl font-black text-rose-600">₹{totalExpenses.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Total recorded outflow</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Expense Records</span>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      {transactions.filter((t) => t.type === "expense").length}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Total expense items</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Top Spend Category</span>
                    <p className="mt-2 text-lg font-bold text-slate-900 truncate">
                      {topExpenseCategory ? `${topExpenseCategory.icon} ${topExpenseCategory.category}` : "None"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {topExpenseCategory ? `₹${topExpenseCategory.spent.toLocaleString()} (${topExpenseCategory.percentage}%)` : "No expenses yet"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Average Expense</span>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      ₹{transactions.filter((t) => t.type === "expense").length > 0
                        ? Math.round(totalExpenses / transactions.filter((t) => t.type === "expense").length).toLocaleString()
                        : 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Per transaction average</p>
                  </div>
                </div>

                {/* Expenses Breakdown Grid */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    Spending by Category
                  </h3>
                  {categoryBreakdown.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400">No expense records found. Click "+ Add Expense" to start logging.</p>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {categoryBreakdown.map((cat) => (
                        <div key={cat.category} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:bg-slate-100/70">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-xs font-bold text-slate-800">
                              <span className="text-base">{cat.icon}</span>
                              {cat.category}
                            </span>
                            <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                              {cat.percentage}%
                            </span>
                          </div>
                          <p className="mt-2 text-lg font-black text-slate-900">₹{cat.spent.toLocaleString()}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Budget limit: ₹{cat.budget.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filtered Expense Transactions Table */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Expense Records List</h3>
                      <p className="text-xs text-slate-400">{filteredTransactions.length} expenses displayed</p>
                    </div>
                  </div>

                  {filteredTransactions.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-3xl">🧾</p>
                      <p className="mt-2 text-xs font-semibold text-slate-700">No matching expense items found</p>
                    </div>
                  ) : (
                    <div className="mt-4 divide-y divide-slate-100">
                      {filteredTransactions.map((tx) => {
                        const catObj = categories.find((c) => c.name === tx.category);
                        return (
                          <div key={tx.id} className="group flex items-center justify-between py-3.5 px-2 rounded-xl transition hover:bg-slate-50/70">
                            <div className="flex items-center gap-3.5">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-lg">
                                {catObj?.icon || "💳"}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{tx.title}</p>
                                <p className="text-xs text-slate-400">{tx.category} • {tx.date} {tx.time && `• ${tx.time}`}</p>
                                {tx.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">{tx.notes}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-black text-rose-600">-₹{tx.amount.toLocaleString()}</span>
                              <button
                                onClick={() => handleDeleteTransaction(tx.id, tx.dbId, tx.type)}
                                className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                title="Delete expense"
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
            )}

            {/* =================================================== */}
            {/* VIEW 3: INCOME TAB                                   */}
            {/* =================================================== */}
            {activeTab === "Income" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Header with Income Actions */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                      📈 Income Streams & Revenue
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Monitor incoming revenue streams, salaries, freelance payouts, and investment returns.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-200"
                    >
                      <option value="all">All Income Streams</option>
                      {categories
                        .filter((c) => c.type === "income" || c.type === "both")
                        .map((c) => (
                          <option key={c.id || c.name} value={c.name}>
                            {c.icon} {c.name}
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={() => handleOpenAddModal("income")}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-500/20 transition hover:bg-emerald-700"
                    >
                      <span>+</span> Add Income
                    </button>
                  </div>
                </div>

                {/* Income Stat Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Total Income</span>
                    <p className="mt-2 text-2xl font-black text-emerald-600">+₹{totalIncome.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Total revenue collected</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Income Entries</span>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      {transactions.filter((t) => t.type === "income").length}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Total income logs</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Top Income Source</span>
                    <p className="mt-2 text-lg font-bold text-slate-900 truncate">
                      {topIncomeCategory ? `${topIncomeCategory.icon} ${topIncomeCategory.category}` : "None"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {topIncomeCategory ? `₹${topIncomeCategory.amount.toLocaleString()} (${topIncomeCategory.percentage}%)` : "No income recorded"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Average Payout</span>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      ₹{transactions.filter((t) => t.type === "income").length > 0
                        ? Math.round(totalIncome / transactions.filter((t) => t.type === "income").length).toLocaleString()
                        : 0}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Average per incoming log</p>
                  </div>
                </div>

                {/* Income Source Breakdown */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    Income Distribution by Source
                  </h3>
                  {incomeBreakdown.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400">No income sources recorded. Click "+ Add Income" to record salary, payouts, or gifts.</p>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {incomeBreakdown.map((item) => (
                        <div key={item.category} className="rounded-2xl border border-slate-100 bg-emerald-50/40 p-4 transition hover:bg-emerald-50/80">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-xs font-bold text-slate-800">
                              <span className="text-base">{item.icon}</span>
                              {item.category}
                            </span>
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                              {item.percentage}%
                            </span>
                          </div>
                          <p className="mt-2 text-lg font-black text-emerald-700">+₹{item.amount.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filtered Income Records Table */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Income Logs</h3>
                      <p className="text-xs text-slate-400">{filteredTransactions.length} records found</p>
                    </div>
                  </div>

                  {filteredTransactions.length === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-3xl">💰</p>
                      <p className="mt-2 text-xs font-semibold text-slate-700">No matching income records</p>
                    </div>
                  ) : (
                    <div className="mt-4 divide-y divide-slate-100">
                      {filteredTransactions.map((tx) => {
                        const catObj = categories.find((c) => c.name === tx.category);
                        return (
                          <div key={tx.id} className="group flex items-center justify-between py-3.5 px-2 rounded-xl transition hover:bg-slate-50/70">
                            <div className="flex items-center gap-3.5">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-lg">
                                {catObj?.icon || "💰"}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{tx.title}</p>
                                <p className="text-xs text-slate-400">{tx.category} • {tx.date} {tx.time && `• ${tx.time}`}</p>
                                {tx.notes && <p className="text-[11px] text-slate-500 italic mt-0.5">{tx.notes}</p>}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-black text-emerald-600">+₹{tx.amount.toLocaleString()}</span>
                              <button
                                onClick={() => handleDeleteTransaction(tx.id, tx.dbId, tx.type)}
                                className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                title="Delete income entry"
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
            )}

            {/* =================================================== */}
            {/* VIEW 4: BUDGET TAB                                   */}
            {/* =================================================== */}
            {activeTab === "Budget" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                      🎯 Monthly Budget Limits & Goals
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Set and customize spending limits for each category to maintain discipline.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddingNewCategory(true);
                      setShowAddModal(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-700"
                  >
                    <span>+</span> Add Category Budget
                  </button>
                </div>

                {/* Overall Budget Capacity Banner */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Monthly Budget</span>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900">₹{totalExpenses.toLocaleString()}</span>
                        <span className="text-xs text-slate-500">spent of ₹{totalAllocatedBudget.toLocaleString()} total limit</span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-xs font-bold text-slate-400">Remaining Allowance</span>
                      <p className={`text-xl font-black ${totalAllocatedBudget - totalExpenses >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        ₹{(totalAllocatedBudget - totalExpenses).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Master Progress Bar */}
                  <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        totalAllocatedBudget > 0 && totalExpenses > totalAllocatedBudget
                          ? "bg-rose-500"
                          : totalExpenses / (totalAllocatedBudget || 1) > 0.8
                          ? "bg-amber-500"
                          : "bg-violet-600"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.round((totalExpenses / (totalAllocatedBudget || 1)) * 100),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Category Budget Cards */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {categories
                    .filter((c) => c.type === "expense" || c.type === "both")
                    .map((cat) => {
                      const spent = transactions
                        .filter((t) => t.type === "expense" && t.category === cat.name)
                        .reduce((sum, t) => sum + t.amount, 0);

                      const limit = cat.budget || 5000;
                      const percentage = Math.min(Math.round((spent / (limit || 1)) * 100), 100);
                      const isOver = spent > limit;
                      const isEditing = editingBudgetCat === cat.id;

                      return (
                        <div
                          key={cat.id || cat.name}
                          className={`rounded-3xl border p-5 shadow-sm transition ${
                            isOver ? "border-rose-300 bg-rose-50/20" : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="text-2xl">{cat.icon}</span>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">{cat.name}</h4>
                                <span className="text-[10px] text-slate-400">Monthly Limit</span>
                              </div>
                            </div>
                            {isOver ? (
                              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                Over Budget!
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                {percentage}% used
                              </span>
                            )}
                          </div>

                          {/* Spent vs Budget amount */}
                          <div className="mt-4 flex items-baseline justify-between text-xs font-semibold">
                            <span className="text-slate-900 font-bold">₹{spent.toLocaleString()} spent</span>
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  value={editBudgetValue}
                                  onChange={(e) => setEditBudgetValue(e.target.value)}
                                  className="w-20 rounded-md border border-slate-300 px-1.5 py-0.5 text-xs"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleSaveBudgetLimit(cat.id)}
                                  className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => setEditingBudgetCat(null)}
                                  className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">₹{limit.toLocaleString()}</span>
                                <button
                                  onClick={() => {
                                    setEditingBudgetCat(cat.id);
                                    setEditBudgetValue(limit.toString());
                                  }}
                                  className="text-[10px] text-violet-600 hover:underline"
                                  title="Edit budget limit"
                                >
                                  ✏️
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isOver ? "bg-rose-500" : percentage > 80 ? "bg-amber-500" : cat.color || "bg-violet-600"
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>

                          {/* Remaining / Over Indicator */}
                          <div className="mt-3 flex justify-between text-[11px]">
                            <span className="text-slate-400">
                              {isOver ? "Exceeded by" : "Remaining"}
                            </span>
                            <span className={`font-bold ${isOver ? "text-rose-600" : "text-emerald-600"}`}>
                              ₹{Math.abs(limit - spent).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* =================================================== */}
            {/* VIEW 5: REPORTS & ANALYTICS TAB                      */}
            {/* =================================================== */}
            {activeTab === "Reports" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                      📑 Financial Analytics & Reports
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                      Comprehensive breakdown of cashflow, savings ratio, and distribution insights.
                    </p>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-slate-800"
                  >
                    <span>⬇</span> Export CSV Report
                  </button>
                </div>

                {/* High-Level Report KPIs */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Net Cash Flow</span>
                    <p className={`mt-2 text-2xl font-black ${totalBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {totalBalance >= 0 ? "+" : ""}₹{totalBalance.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Net surplus / deficit</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Savings Ratio</span>
                    <p className="mt-2 text-2xl font-black text-blue-600">{savingsRate}%</p>
                    <p className="text-[11px] text-slate-400 mt-1">Income retained</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Expense-to-Income</span>
                    <p className="mt-2 text-2xl font-black text-slate-900">
                      {totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0}%
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">Share of revenue spent</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <span className="text-xs font-semibold text-slate-500">Total Activity</span>
                    <p className="mt-2 text-2xl font-black text-slate-900">{transactions.length}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Transactions recorded</p>
                  </div>
                </div>

                {/* Cash Flow In vs Out Comparison Visual */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                    Cash Flow Visual Comparison
                  </h3>
                  <div className="mt-6 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-emerald-600">↗ Total Inflow (Income)</span>
                        <span>₹{totalIncome.toLocaleString()}</span>
                      </div>
                      <div className="mt-1.5 h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{
                            width: `${totalIncome + totalExpenses > 0 ? (totalIncome / (totalIncome + totalExpenses)) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-rose-600">↘ Total Outflow (Expenses)</span>
                        <span>₹{totalExpenses.toLocaleString()}</span>
                      </div>
                      <div className="mt-1.5 h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{
                            width: `${totalIncome + totalExpenses > 0 ? (totalExpenses / (totalIncome + totalExpenses)) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Category Table */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden">
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-4">
                    Category Spending Audit Table
                  </h3>
                  {categoryBreakdown.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400">No expense records available for report generation.</p>
                  ) : (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                            <th className="py-2.5 px-3">Category</th>
                            <th className="py-2.5 px-3">Total Spent</th>
                            <th className="py-2.5 px-3">Share (%)</th>
                            <th className="py-2.5 px-3">Budget Limit</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {categoryBreakdown.map((cat) => {
                            const isOver = cat.spent > cat.budget;
                            return (
                              <tr key={cat.category} className="hover:bg-slate-50">
                                <td className="py-3 px-3 flex items-center gap-2 font-bold text-slate-900">
                                  <span>{cat.icon}</span> {cat.category}
                                </td>
                                <td className="py-3 px-3 font-bold text-slate-900">₹{cat.spent.toLocaleString()}</td>
                                <td className="py-3 px-3">{cat.percentage}%</td>
                                <td className="py-3 px-3 text-slate-500">₹{cat.budget.toLocaleString()}</td>
                                <td className="py-3 px-3">
                                  {isOver ? (
                                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">Over limit</span>
                                  ) : (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Within limit</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =================================================== */}
            {/* VIEW 6: AI ASSISTANT TAB                             */}
            {/* =================================================== */}
            {activeTab === "AIAssistant" && (
              <div className="space-y-6 animate-fadeIn">
                {/* Header */}
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                    💬 FinanceAI Smart Assistant
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Your personal AI financial advisor connected directly to your income, expense, and budget metrics.
                  </p>
                </div>

                {/* Chat Container */}
                <div className="flex h-[600px] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {/* Chat Top Banner */}
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white font-bold text-sm shadow-md shadow-violet-500/20">
                        🤖
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">FinanceAI Advisor</h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Connected to your live balance</span>
                        </div>
                      </div>
                    </div>
                    <span className="rounded-lg bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                      Balance: ₹{totalBalance.toLocaleString()}
                    </span>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.sender === "ai" && (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm">
                            🤖
                          </div>
                        )}
                        <div
                          className={`max-w-lg rounded-2xl p-4 text-xs leading-relaxed ${
                            msg.sender === "user"
                              ? "bg-violet-600 text-white font-medium shadow-md shadow-violet-500/20"
                              : "border border-slate-100 bg-slate-50 text-slate-800"
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.text}</p>
                          <span
                            className={`block mt-2 text-[9px] ${
                              msg.sender === "user" ? "text-violet-200 text-right" : "text-slate-400"
                            }`}
                          >
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    ))}

                    {isAiTyping && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 pl-2">
                        <span>🤖 FinanceAI is thinking</span>
                        <span className="animate-bounce">...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Suggested Action Prompts */}
                  <div className="border-t border-slate-100 bg-slate-50/50 p-3 flex flex-wrap gap-2">
                    {[
                      "📊 Analyze my spending habits",
                      "💎 How is my savings rate?",
                      "🎯 Check my budget limits",
                      "📑 Generate financial summary",
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleSendAiMessage(prompt)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition hover:bg-violet-50 hover:border-violet-300 hover:text-violet-700"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  {/* Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendAiMessage();
                    }}
                    className="flex items-center gap-2 border-t border-slate-100 bg-white p-4"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask FinanceAI anything about your expenses, budgets, savings..."
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="rounded-xl bg-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-700 disabled:opacity-50"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            )}

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
