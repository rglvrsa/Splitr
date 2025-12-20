// API base URL - Use VITE_ prefix for Vite environment variables
// Remove trailing slash if present
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');
console.log("Using API URL:", API_URL);

// Helper function for API calls
const apiRequest = async (endpoint, options = {}) => {
  // Ensure endpoint starts with /api
  const fullEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
  const url = `${API_URL}${fullEndpoint}`;
  console.log("Fetching:", url);
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`API Error [${response.status}]:`, data);
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }
    
    return data;
  } catch (error) {
    // Network error or JSON parse error
    if (error.name === 'TypeError') {
      console.error('Network error:', error.message);
      throw new Error(`Cannot connect to server at ${API_URL}. Check if backend is deployed.`);
    }
    throw error;
  }
};

// ============ USER API ============
export const userAPI = {
  sync: (userData) => apiRequest('/users/sync', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  getProfile: (clerkId) => apiRequest(`/users/profile/${clerkId}`),
  getByEmail: (email) => apiRequest(`/users/email/${encodeURIComponent(email)}`),
  search: (query) => apiRequest(`/users/search?query=${encodeURIComponent(query)}`),
};

// ============ GROUP API ============
export const groupAPI = {
  create: (data) => apiRequest('/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getUserGroups: (clerkId) => apiRequest(`/groups/user/${clerkId}`),
  getById: (groupId) => apiRequest(`/groups/${groupId}`),
  update: (groupId, data) => apiRequest(`/groups/${groupId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (groupId) => apiRequest(`/groups/${groupId}`, {
    method: 'DELETE',
  }),
  addMember: (groupId, email) => apiRequest(`/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),
  removeMember: (groupId, userId) => apiRequest(`/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  }),
};

// ============ EXPENSE API ============
export const expenseAPI = {
  create: (data) => apiRequest('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getGroupExpenses: (groupId) => apiRequest(`/expenses/group/${groupId}`),
  getUserExpenses: (clerkId) => apiRequest(`/expenses/user/${clerkId}`),
  getById: (expenseId) => apiRequest(`/expenses/${expenseId}`),
  update: (expenseId, data) => apiRequest(`/expenses/${expenseId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (expenseId) => apiRequest(`/expenses/${expenseId}`, {
    method: 'DELETE',
  }),
};

// ============ BALANCE API ============
export const balanceAPI = {
  getUserBalances: (clerkId) => apiRequest(`/balances/user/${clerkId}`),
  getGroupBalances: (groupId, clerkId) => {
    const query = clerkId ? `?clerkId=${clerkId}` : '';
    return apiRequest(`/balances/group/${groupId}${query}`);
  },
  getSimplified: (groupId) => apiRequest(`/balances/group/${groupId}/simplified`),
  cleanup: (groupId) => apiRequest(`/balances/group/${groupId}/cleanup`, {
    method: 'POST',
  }),
};

// ============ SETTLEMENT API ============
export const settlementAPI = {
  create: (data) => apiRequest('/settlements', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getGroupSettlements: (groupId) => apiRequest(`/settlements/group/${groupId}`),
  getUserSettlements: (clerkId) => apiRequest(`/settlements/user/${clerkId}`),
  delete: (settlementId) => apiRequest(`/settlements/${settlementId}`, {
    method: 'DELETE',
  }),
};
