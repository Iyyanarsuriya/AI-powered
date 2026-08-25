import axiosInstance from "../axiosinstance";

/**
 * Register a new user
 * @param {Object} userData - { full_name, email, password, confirm_password, terms_accepted }
 */
export const registerUser = async (userData) => {
  const response = await axiosInstance.post("/api/auth/signup", userData);
  return response.data;
};

/**
 * Login user and receive JWT access token
 * @param {Object} credentials - { email, password, remember_me }
 */
export const loginUser = async (credentials) => {
  const response = await axiosInstance.post("/api/auth/login", credentials);
  return response.data;
};

/**
 * Logout user by clearing stored auth tokens
 */
export const logoutUser = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Get current stored user profile
 */
export const getCurrentStoredUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};
