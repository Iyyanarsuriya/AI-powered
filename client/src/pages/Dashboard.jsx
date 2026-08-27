import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const initialTransactions = [
  {
    id: 1,
    name: "Tech Solutions Salary",
    category: "Income",
    date: "Today, 10:30 AM",
    amount: "+₹85,000",
    type: "income",
    icon: "💼",
  },
  {
    id: 2,
    name: "Whole Foods Market",
    category: "Groceries",
    date: "Yesterday, 6:45 PM",
    amount: "-₹3,450",
    type: "expense",
    icon: "🛒",
  },
  {
    id: 3,
    name: "Electricity & Water Bill",
    category: "Utilities",
    date: "24 Aug, 2:15 PM",
    amount: "-₹2,180",
    type: "expense",
    icon: "⚡",
  },
  {
    id: 4,
    name: "Weekend Dining & Cafe",
    category: "Food",
    date: "22 Aug, 8:20 PM",
    amount: "-₹1,850",
    type: "expense",
    icon: "🍔",
  },
  {
    id: 5,
    name: "Freelance Project Milestone",
    category: "Income",
    date: "20 Aug, 11:00 AM",
    amount: "+₹22,000",
    type: "income",
    icon: "💰",
  },
];

const categoryBudgets = [
  { name: "Housing & Rent", spent: 25000, budget: 30000, color: "bg-violet-600" },
  { name: "Food & Dining", spent: 8400, budget: 12000, color: "bg-blue-600" },
  { name: "Groceries", spent: 6200, budget: 8000, color: "bg-emerald-600" },
  { name: "Transport & Fuel", spent: 3100, budget: 5000, color: "bg-amber-500" },
  { name: "Entertainment", spent: 4200, budget: 6000, color: "bg-rose-500" },
];

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: "",
    amount: "",
    category: "Food",
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpense.name || !newExpense.amount) return;

    const item = {
      id: Date.now(),
      name: newExpense.name,
      category: newExpense.category,
      date: "Just now",
      amount: `-₹${parseFloat(newExpense.amount).toLocaleString()}`,
      type: "expense",
      icon: "💳",
    };

    setTransactions([item, ...transactions]);
    setNewExpense({ name: "", amount: "", category: "Food" });
    setShowAddExpense(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-base font-bold text-white shadow-md shadow-violet-500/20">
              ₹
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                Finance<span className="text-violet-600">AI</span>
              </span>
              <span className="ml-2 rounded-md bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                Dashboard
              </span>
            </div>
          </Link>

          {/* User Profile & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              to="/"
              className="hidden rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 sm:block"
            >
              ← Back to Home
            </Link>

            <div className="flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-3.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.full_name || "User"}
                </p>
                <p className="text-[10px] text-slate-500 hidden sm:block">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Banner */}
        <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 p-6 text-white shadow-xl shadow-indigo-500/15 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Welcome back, {user?.full_name?.split(" ")[0] || "there"}! 👋
            </h1>
            <p className="mt-1.5 text-xs text-violet-100 sm:text-sm">
              Here is your financial summary and monthly spending breakdown.
            </p>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setShowAddExpense(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-violet-900 shadow-md transition hover:bg-violet-50"
            >
              <span>+</span> Add Expense
            </button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Balance */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Balance
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 text-violet-600 font-bold">
                ₹
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-slate-900">
                ₹1,24,500
              </p>
              <p className="mt-1 flex items-center text-xs font-semibold text-emerald-600">
                <span>↑ +12.5%</span>
                <span className="ml-1 text-[11px] font-normal text-slate-400">
                  from last month
                </span>
              </p>
            </div>
          </div>

          {/* Monthly Income */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Monthly Income
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                ↗
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-slate-900">
                ₹1,07,000
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                Salary + Freelance milestones
              </p>
            </div>
          </div>

          {/* Monthly Expenses */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total Expenses
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                ↘
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-slate-900">
                ₹46,930
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                67% of monthly budget used
              </p>
            </div>
          </div>

          {/* Net Savings */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Net Savings
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                💎
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-extrabold text-slate-900">
                ₹60,070
              </p>
              <p className="mt-1 text-[11px] font-semibold text-emerald-600">
                56.1% savings rate
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard 2-Column Content */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left 2 Columns: Transactions & Budget Progress */}
          <div className="space-y-8 lg:col-span-2">
            {/* Recent Transactions */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Recent Transactions
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your latest spending and income activity
                  </p>
                </div>
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="text-xs font-bold text-violet-600 hover:text-violet-700"
                >
                  + Add New
                </button>
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-3.5 transition hover:bg-slate-50/50 rounded-xl px-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">
                        {tx.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {tx.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {tx.category} • {tx.date}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`text-sm font-bold ${
                        tx.type === "income"
                          ? "text-emerald-600"
                          : "text-slate-900"
                      }`}
                    >
                      {tx.amount}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Budgets */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900">
                Category Spending & Budgets
              </h2>
              <p className="text-xs text-slate-500">
                Monthly limits and current consumption
              </p>

              <div className="mt-6 space-y-4">
                {categoryBudgets.map((cat) => {
                  const percent = Math.min(
                    Math.round((cat.spent / cat.budget) * 100),
                    100
                  );
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700">{cat.name}</span>
                        <span className="text-slate-500">
                          ₹{cat.spent.toLocaleString()} / ₹{cat.budget.toLocaleString()} ({percent}%)
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full ${cat.color} rounded-full transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Financial Health & Quick Actions */}
          <div className="space-y-6">
            {/* Financial Health Score Card */}
            <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/70 to-indigo-50/50 p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-700">
                  Financial Health
                </span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  Excellent
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">84</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>

              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Your savings rate is in the top 15% of users this month. Great job sticking to your budget!
              </p>

              <div className="mt-5 border-t border-violet-100 pt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-violet-800">
                  Tip of the week
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Setting aside an extra ₹2,000 this week will meet your quarterly emergency fund goal ahead of schedule.
                </p>
              </div>
            </div>

            {/* Quick Add Expense Modal / Card */}
            {showAddExpense && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Add New Expense
                  </h3>
                  <button
                    onClick={() => setShowAddExpense(false)}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>

                <form onSubmit={handleAddExpense} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600">
                      Description
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Coffee & Bagel"
                      value={newExpense.name}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, name: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="250"
                      value={newExpense.amount}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, amount: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600">
                      Category
                    </label>
                    <select
                      value={newExpense.category}
                      onChange={(e) =>
                        setNewExpense({ ...newExpense, category: e.target.value })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
                    >
                      <option value="Food">Food & Dining</option>
                      <option value="Groceries">Groceries</option>
                      <option value="Transport">Transport</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Entertainment">Entertainment</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="mt-2 w-full rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white transition hover:bg-violet-700 shadow-md shadow-violet-500/20"
                  >
                    Save Expense
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
