import React, { useState } from "react";
import AuthModal from "./AuthModal";

const features = [
  {
    icon: "🤖",
    title: "AI Financial Assistant",
    description:
      "Ask questions about your spending, savings, budgets, and financial goals. Get intelligent answers instantly.",
    color: "violet",
  },
  {
    icon: "₹",
    title: "Smart Expense Tracking",
    description:
      "Track every expense and automatically organize your transactions into meaningful categories.",
    color: "emerald",
  },
  {
    icon: "◈",
    title: "Budget Management",
    description:
      "Create monthly budgets and receive smart alerts before you overspend.",
    color: "blue",
  },
  {
    icon: "↗",
    title: "Financial Insights",
    description:
      "Discover spending patterns and receive personalized recommendations to save more.",
    color: "orange",
  },
];

const transactions = [
  {
    icon: "🍔",
    name: "Food & Dining",
    category: "Food",
    amount: "-₹850",
    color: "bg-amber-50 text-amber-600 border border-amber-100",
  },
  {
    icon: "🛒",
    name: "Grocery Shopping",
    category: "Shopping",
    amount: "-₹2,450",
    color: "bg-blue-50 text-blue-600 border border-blue-100",
  },
  {
    icon: "🚕",
    name: "Uber Ride",
    category: "Transport",
    amount: "-₹420",
    color: "bg-purple-50 text-purple-600 border border-purple-100",
  },
  {
    icon: "💰",
    name: "Monthly Salary",
    category: "Income",
    amount: "+₹75,000",
    color: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  },
];

function Home() {
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: "login" });

  const openLogin = () => setAuthModal({ isOpen: true, mode: "login" });
  const openSignup = () => setAuthModal({ isOpen: true, mode: "signup" });
  const closeAuth = () => setAuthModal((prev) => ({ ...prev, isOpen: false }));

  return (
    <div className="min-h-screen overflow-hidden bg-slate-50 text-slate-900 antialiased selection:bg-violet-500 selection:text-white">
      {/* ================= NAVBAR ================= */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-bold text-white shadow-md shadow-violet-500/25">
              ₹
            </div>

            <div>
              <p className="text-base font-bold tracking-tight text-slate-900">
                Finance<span className="text-violet-600">AI</span>
              </p>
              <p className="hidden text-[10px] font-medium text-slate-500 sm:block">
                Smart money management
              </p>
            </div>
          </a>

          {/* Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition hover:text-violet-600"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 transition hover:text-violet-600"
            >
              How it works
            </a>

            <a
              href="#ai"
              className="text-sm font-medium text-slate-600 transition hover:text-violet-600"
            >
              AI Assistant
            </a>

            <a
              href="#about"
              className="text-sm font-medium text-slate-600 transition hover:text-violet-600"
            >
              About
            </a>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={openLogin}
              className="hidden px-4 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 sm:block"
            >
              Login
            </button>

            <button
              onClick={openSignup}
              className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-500/20 transition hover:bg-violet-700 hover:shadow-violet-500/30"
            >
              Get Started
            </button>
          </div>
        </nav>
      </header>

      {/* ================= HERO ================= */}
      <main>
        <section className="relative">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-200/40 blur-[130px]" />
          <div className="pointer-events-none absolute right-10 top-32 h-[350px] w-[450px] rounded-full bg-blue-200/30 blur-[110px]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
            {/* Hero content */}
            <div>
              {/* Badge */}
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700 shadow-sm">
                <span className="text-violet-600">⚡</span>
                AI-powered personal finance
              </div>

              <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
                Your money.
                <br />
                <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  Smarter with AI.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                Track expenses, manage budgets, understand your spending
                habits, and get personalized financial advice with your
                intelligent AI assistant.
              </p>

              {/* CTA Buttons */}
              <div className="mt-9 flex flex-col gap-3.5 sm:flex-row">
                <button
                  onClick={openSignup}
                  className="group inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:scale-[1.02] hover:shadow-violet-500/35"
                >
                  Start Managing Money
                  <span className="ml-2 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </button>

                <button
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="rounded-xl border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                >
                  See How It Works
                </button>
              </div>

              {/* Trust Section */}
              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["👨🏻", "👩🏻", "👨🏽", "👩🏽"].map((avatar, index) => (
                    <div
                      key={index}
                      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-sm shadow-sm"
                    >
                      {avatar}
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Trusted by 10,000+ users
                  </p>
                  <p className="text-xs text-slate-500">
                    Making smarter financial decisions everyday
                  </p>
                </div>
              </div>
            </div>

            {/* ================= DASHBOARD PREVIEW ================= */}
            <div className="relative">
              <div className="absolute inset-10 rounded-full bg-violet-400/20 blur-[90px]" />

              <div className="relative rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl shadow-slate-200/80">
                {/* Dashboard top */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Total Balance
                    </p>

                    <div className="mt-2 flex items-baseline gap-3">
                      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                        ₹1,24,680
                      </h2>

                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        +12.5% this month
                      </span>
                    </div>
                  </div>

                  <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700">
                    ⋮
                  </button>
                </div>

                {/* Chart Preview */}
                <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Spending Overview
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Past 7 days
                      </p>
                    </div>

                    <span className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                      Weekly
                    </span>
                  </div>

                  {/* Bars */}
                  <div className="mt-6 flex h-36 items-end justify-between gap-3 px-2">
                    {[40, 65, 48, 78, 58, 92, 70].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="flex h-full flex-1 items-end"
                        >
                          <div
                            style={{ height: `${height}%` }}
                            className={`w-full rounded-t-md transition-all ${
                              index === 5
                                ? "bg-gradient-to-t from-violet-600 to-indigo-500 shadow-md shadow-violet-500/20"
                                : "bg-slate-200 hover:bg-slate-300"
                            }`}
                          />
                        </div>
                      ),
                    )}
                  </div>

                  <div className="mt-3 flex justify-between px-1 text-[10px] font-medium text-slate-500">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>

                {/* Transactions */}
                <div className="mt-6">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800">
                      Recent Transactions
                    </p>

                    <button className="text-xs font-semibold text-violet-600 transition hover:text-violet-700">
                      View all →
                    </button>
                  </div>

                  <div className="space-y-1">
                    {transactions.slice(0, 3).map((transaction) => (
                      <div
                        key={transaction.name}
                        className="flex items-center justify-between rounded-xl p-2.5 transition hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl text-base ${transaction.color}`}
                          >
                            {transaction.icon}
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {transaction.name}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {transaction.category}
                            </p>
                          </div>
                        </div>

                        <p
                          className={`text-xs font-bold ${
                            transaction.amount.startsWith("+")
                              ? "text-emerald-600"
                              : "text-slate-800"
                          }`}
                        >
                          {transaction.amount}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating AI card */}
              <div className="absolute -bottom-6 -left-6 hidden w-72 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xl shadow-slate-300/40 backdrop-blur-md sm:block">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
                    💡
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      AI Smart Insight
                    </p>

                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                      You spent 18% less on dining out this week. Great progress towards your goal! 🎉
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= STATS ================= */}
        <section className="border-y border-slate-200/80 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4">
            {[
              ["₹2.4Cr+", "Expenses tracked"],
              ["10K+", "Active users"],
              ["98%", "User satisfaction"],
              ["24/7", "AI assistance"],
            ].map(([number, label]) => (
              <div
                key={label}
                className="border-slate-100 px-6 py-10 text-center md:border-r last:md:border-r-0"
              >
                <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
                  {number}
                </p>

                <p className="mt-2 text-xs font-medium text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section
          id="features"
          className="mx-auto max-w-7xl px-6 py-28 lg:px-8"
        >
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-5 inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-700">
              ⚡ Everything in one place
            </div>

            <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Your complete{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                financial assistant
              </span>
            </h2>

            <p className="mt-5 leading-relaxed text-slate-600">
              Powerful tools designed to make managing your money simple,
              intelligent, and stress-free.
            </p>
          </div>

          {/* Feature grid */}
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/50"
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold ${
                    feature.color === "violet"
                      ? "border border-violet-100 bg-violet-50 text-violet-600"
                      : feature.color === "emerald"
                        ? "border border-emerald-100 bg-emerald-50 text-emerald-600"
                        : feature.color === "blue"
                          ? "border border-blue-100 bg-blue-50 text-blue-600"
                          : "border border-amber-100 bg-amber-50 text-amber-600"
                  }`}
                >
                  {feature.icon}
                </div>

                <h3 className="mt-6 text-lg font-bold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {feature.description}
                </p>

                <div className="mt-6 inline-flex items-center text-xs font-semibold text-violet-600 opacity-0 transition group-hover:opacity-100">
                  Learn more →
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= AI SECTION ================= */}
        <section
          id="ai"
          className="mx-auto max-w-7xl px-6 pb-28 lg:px-8"
        >
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-violet-50/70 via-white to-blue-50/50 p-8 shadow-lg shadow-slate-200/50 md:p-14">
            {/* Soft decorative glow */}
            <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-violet-200/50 blur-[110px]" />

            <div className="relative grid items-center gap-12 lg:grid-cols-2">
              {/* Text */}
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl text-white shadow-md shadow-violet-500/20">
                  🤖
                </div>

                <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                  AI FINANCIAL ASSISTANT
                </p>

                <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                  Your personal financial expert,
                  <span className="text-violet-600"> available 24/7.</span>
                </h2>

                <p className="mt-5 text-base leading-relaxed text-slate-600">
                  Stop wondering where your money goes. Ask your AI
                  assistant anything about your finances and get clear,
                  personalized answers in seconds.
                </p>

                <div className="mt-7 space-y-3">
                  {[
                    "Why did I spend more this month?",
                    "How much can I save next month?",
                    "Where can I reduce my expenses?",
                  ].map((question) => (
                    <div
                      key={question}
                      className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                        ✓
                      </span>
                      {question}
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Chat Demo */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-200/70">
                <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
                    🤖
                  </div>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Finance AI
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-600">
                      ● Active Now
                    </p>
                  </div>
                </div>

                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-violet-600 px-4 py-3 text-xs leading-relaxed text-white shadow-sm">
                    How can I save more money this month?
                  </div>
                </div>

                {/* AI response */}
                <div className="mt-4 flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700">
                    🤖
                  </div>

                  <div className="rounded-2xl rounded-tl-sm border border-slate-200/80 bg-slate-50/90 p-4 shadow-sm">
                    <p className="text-xs leading-relaxed text-slate-700">
                      Based on your spending patterns, you could save around{" "}
                      <span className="font-bold text-emerald-600">
                        ₹6,500
                      </span>{" "}
                      this month.
                    </p>

                    <div className="mt-3 space-y-1.5 text-[11px] text-slate-500">
                      <p>• Reduce dining expenses by ₹2,000</p>
                      <p>• Review recurring subscriptions: save ₹1,500</p>
                      <p>• Set a ₹3,000 weekend shopping cap</p>
                    </div>
                  </div>
                </div>

                {/* Input Demo */}
                <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  <span className="flex-1 px-3 text-xs text-slate-400">
                    Ask anything about your finances...
                  </span>

                  <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700">
                    ↑
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section
          id="how-it-works"
          className="border-y border-slate-200/80 bg-white"
        >
          <div className="mx-auto max-w-6xl px-6 py-28 lg:px-8">
            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                HOW IT WORKS
              </p>

              <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
                Start managing your money in minutes.
              </h2>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Add your expenses",
                  description:
                    "Record your income and expenses effortlessly. Organize everything in one unified dashboard.",
                },
                {
                  number: "02",
                  title: "Let AI analyze",
                  description:
                    "Our AI analyzes your transaction trends and identifies instant opportunities to save.",
                },
                {
                  number: "03",
                  title: "Make smarter decisions",
                  description:
                    "Follow personalized recommendations and build lasting, healthier financial habits.",
                },
              ].map((step) => (
                <div key={step.number} className="relative rounded-3xl border border-slate-100 bg-slate-50/60 p-8">
                  <span className="text-5xl font-black text-slate-200">
                    {step.number}
                  </span>

                  <h3 className="mt-4 text-xl font-bold text-slate-900">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section id="about" className="px-6 py-28">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 px-6 py-24 text-center text-white shadow-2xl shadow-violet-500/25">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-[90px]" />

            <div className="relative">
              <div className="mb-6 inline-flex rounded-full border border-white/20 bg-white/15 px-4 py-2 text-xs font-semibold text-white">
                ⚡ Take control of your finances
              </div>

              <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                Your financial future starts with
                <span className="text-violet-200">
                  {" "}
                  one smart decision.
                </span>
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-violet-100">
                Start tracking your expenses, understand your cash flow,
                and let AI guide you toward your financial milestones.
              </p>

              <button
                onClick={openSignup}
                className="mt-8 rounded-xl bg-white px-8 py-4 font-bold text-slate-900 shadow-xl transition hover:scale-105 hover:bg-slate-50"
              >
                Get Started — It's Free →
              </button>

              <p className="mt-4 text-xs text-violet-200">
                No credit card required • Instant setup
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-8 sm:flex-row lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
              ₹
            </div>

            <div>
              <p className="text-sm font-bold text-slate-900">
                Finance<span className="text-violet-600">AI</span>
              </p>
              <p className="text-[10px] text-slate-500">
                AI Expense & Finance Assistant
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            © 2026 FinanceAI. All rights reserved.
          </p>

          <div className="flex gap-6 text-xs font-medium text-slate-500">
            <a href="#" className="transition hover:text-violet-600">
              Privacy
            </a>
            <a href="#" className="transition hover:text-violet-600">
              Terms
            </a>
            <a href="#" className="transition hover:text-violet-600">
              Contact
            </a>
          </div>
        </div>
      </footer>

      {/* ================= AUTH MODAL ================= */}
      <AuthModal
        isOpen={authModal.isOpen}
        initialMode={authModal.mode}
        onClose={closeAuth}
      />
    </div>
  );
}

export default Home;