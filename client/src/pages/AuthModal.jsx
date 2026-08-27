import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AuthModal({ isOpen, onClose, initialMode = "login" }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Sync mode with initialMode when opened
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrors({});
      setSuccessMessage("");
      setShowPassword(false);
    }
  }, [isOpen, initialMode]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear field-specific error on change
    if (errors[name] || errors.general) {
      setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (mode === "signup" && !formData.name.trim()) {
      newErrors.name = "Full name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (mode === "signup") {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      if (!formData.agreeTerms) {
        newErrors.agreeTerms = "You must accept terms & conditions";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      if (mode === "signup") {
        await register({
          full_name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          confirm_password: formData.confirmPassword,
          terms_accepted: formData.agreeTerms,
        });

        setSuccessMessage("Account created successfully! Please log in.");
        setTimeout(() => {
          setMode("login");
          setSuccessMessage("");
        }, 1500);
      } else {
        const data = await login({
          email: formData.email.trim(),
          password: formData.password,
          remember_me: formData.rememberMe,
        });

        setSuccessMessage(`Welcome back, ${data.user.full_name}!`);
        setTimeout(() => {
          onClose();
          navigate("/dashboard");
        }, 600);
      }
    } catch (err) {
      console.error("Auth error:", err);
      let errorMsg = "Something went wrong. Please check your connection.";
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === "string") {
          errorMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map((d) => d.msg).join(", ");
        }
      }
      setErrors({ general: errorMsg });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl shadow-slate-900/20 transition-all sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
          aria-label="Close modal"
        >
          ✕
        </button>

        {/* Modal Header */}
        <div className="text-center">
          {/* Logo Badge */}
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl font-bold text-white shadow-md shadow-violet-500/25">
            ₹
          </div>

          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
            {mode === "login" ? "Welcome back!" : "Create your account"}
          </h2>
          <p className="mt-1.5 text-xs text-slate-500">
            {mode === "login"
              ? "Enter your credentials to access your financial dashboard"
              : "Start tracking and managing your personal finances"}
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
            {successMessage}
          </div>
        )}

        {/* General Error Banner */}
        {errors.general && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
            {errors.general}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrors({});
              setSuccessMessage("");
            }}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrors({});
              setSuccessMessage("");
            }}
            className={`rounded-xl py-2 text-xs font-bold transition ${
              mode === "signup"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Full Name (Sign Up only) */}
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    errors.name
                      ? "border-red-400 bg-red-50/30 focus:ring-red-300"
                      : "border-slate-200 bg-slate-50/50 focus:border-violet-500 focus:bg-white focus:ring-violet-200"
                  }`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.name}
                </p>
              )}
            </div>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Email Address
            </label>
            <div className="mt-1">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  errors.email
                    ? "border-red-400 bg-red-50/30 focus:ring-red-300"
                    : "border-slate-200 bg-slate-50/50 focus:border-violet-500 focus:bg-white focus:ring-violet-200"
                }`}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] font-medium text-red-500">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              {mode === "login" && (
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Password reset instructions sent to your email.");
                  }}
                  className="text-[11px] font-semibold text-violet-600 hover:text-violet-700"
                >
                  Forgot password?
                </a>
              )}
            </div>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full rounded-xl border px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  errors.password
                    ? "border-red-400 bg-red-50/30 focus:ring-red-300"
                    : "border-slate-200 bg-slate-50/50 focus:border-violet-500 focus:bg-white focus:ring-violet-200"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] font-medium text-red-500">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password (Sign Up only) */}
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? "border-red-400 bg-red-50/30 focus:ring-red-300"
                      : "border-slate-200 bg-slate-50/50 focus:border-violet-500 focus:bg-white focus:ring-violet-200"
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Checkbox Options */}
          {mode === "login" ? (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 text-xs font-medium text-slate-600 select-none"
              >
                Remember me for 30 days
              </label>
            </div>
          ) : (
            <div>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <label
                  htmlFor="agreeTerms"
                  className="ml-2 text-xs font-medium text-slate-600 select-none"
                >
                  I agree to the{" "}
                  <a href="#terms" className="text-violet-600 underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#privacy" className="text-violet-600 underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.agreeTerms && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.agreeTerms}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:scale-[1.01] hover:shadow-violet-500/35 disabled:opacity-70"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Processing...
              </span>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer switch */}
        <p className="mt-6 text-center text-xs text-slate-500">
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrors({});
                }}
                className="font-bold text-violet-600 hover:text-violet-700"
              >
                Sign up for free
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrors({});
                }}
                className="font-bold text-violet-600 hover:text-violet-700"
              >
                Log in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function LoginModal(props) {
  return <AuthModal {...props} initialMode="login" />;
}

export function SignupModal(props) {
  return <AuthModal {...props} initialMode="signup" />;
}

export default AuthModal;
