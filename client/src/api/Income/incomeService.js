import axiosInstance from "../Auth/axiosinstance";

/**
 * Fetch all incomes for the logged-in user
 * @param {Object} params - optional query params: { category, search, limit, offset }
 */
export const fetchIncomes = async (params = {}) => {
  const response = await axiosInstance.get("/api/incomes", { params });
  return response.data;
};

/**
 * Fetch live income summary & analytics (Total, monthly, source breakdown)
 */
export const fetchIncomeSummary = async () => {
  const response = await axiosInstance.get("/api/incomes/summary");
  return response.data;
};

/**
 * Create a new income entry in MySQL
 * @param {Object} incomeData - { source, amount, category, notes, date }
 */
export const createIncome = async (incomeData) => {
  const response = await axiosInstance.post("/api/incomes", incomeData);
  return response.data;
};

/**
 * Get single income details by ID
 * @param {number} id
 */
export const getIncomeById = async (id) => {
  const response = await axiosInstance.get(`/api/incomes/${id}`);
  return response.data;
};

/**
 * Update an existing income entry
 * @param {number} id
 * @param {Object} incomeData
 */
export const updateIncome = async (id, incomeData) => {
  const response = await axiosInstance.put(`/api/incomes/${id}`, incomeData);
  return response.data;
};

/**
 * Delete an income entry from MySQL
 * @param {number} id
 */
export const deleteIncome = async (id) => {
  const response = await axiosInstance.delete(`/api/incomes/${id}`);
  return response.data;
};
