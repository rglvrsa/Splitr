import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { userAPI, groupAPI, expenseAPI, balanceAPI, settlementAPI } from '../services/api';

// Create Context
const AppContext = createContext(null);

// Provider Component
export const AppProvider = ({ children }) => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  
  // State
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState({ youOwe: [], youAreOwed: [], totalYouOwe: 0, totalYouAreOwed: 0, netBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync user with backend when Clerk user is available
  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !isSignedIn || !clerkUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await userAPI.sync({
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          fullName: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
          imageUrl: clerkUser.imageUrl || '',
        });
        setUser(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to sync user:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [clerkUser, isLoaded, isSignedIn]);

  // Fetch groups when user is available
  const fetchGroups = useCallback(async () => {
    if (!clerkUser?.id) return;
    try {
      const response = await groupAPI.getUserGroups(clerkUser.id);
      setGroups(response.data || []);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  }, [clerkUser?.id]);

  // Fetch user expenses
  const fetchExpenses = useCallback(async () => {
    if (!clerkUser?.id) return;
    try {
      const response = await expenseAPI.getUserExpenses(clerkUser.id);
      setExpenses(response.data || []);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    }
  }, [clerkUser?.id]);

  // Fetch user balances
  const fetchBalances = useCallback(async () => {
    if (!clerkUser?.id) return;
    try {
      const response = await balanceAPI.getUserBalances(clerkUser.id);
      setBalances(response.data || { youOwe: [], youAreOwed: [], totalYouOwe: 0, totalYouAreOwed: 0, netBalance: 0 });
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  }, [clerkUser?.id]);

  // Fetch all data when user is synced
  useEffect(() => {
    if (user) {
      fetchGroups();
      fetchExpenses();
      fetchBalances();
    }
  }, [user, fetchGroups, fetchExpenses, fetchBalances]);

  // ============ GROUP ACTIONS ============
  const createGroup = async (name, description) => {
    if (!clerkUser?.id) {
      throw new Error('User not authenticated');
    }
    
    // Ensure user is synced first
    if (!user) {
      try {
        const syncResponse = await userAPI.sync({
          clerkId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          fullName: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
          imageUrl: clerkUser.imageUrl || '',
        });
        setUser(syncResponse.data);
      } catch (err) {
        console.error('Failed to sync user before creating group:', err);
        throw new Error('Failed to sync user. Please try again.');
      }
    }
    
    try {
      const response = await groupAPI.create({
        name,
        description,
        createdByClerkId: clerkUser.id,
      });
      setGroups(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error('Failed to create group:', err);
      throw err;
    }
  };

  const addMemberToGroup = async (groupId, email) => {
    try {
      const response = await groupAPI.addMember(groupId, email);
      setGroups(prev => prev.map(g => g._id === groupId ? response.data : g));
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const removeMemberFromGroup = async (groupId, userId) => {
    try {
      const response = await groupAPI.removeMember(groupId, userId);
      setGroups(prev => prev.map(g => g._id === groupId ? response.data : g));
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const deleteGroup = async (groupId) => {
    try {
      await groupAPI.delete(groupId);
      setGroups(prev => prev.filter(g => g._id !== groupId));
    } catch (err) {
      throw err;
    }
  };

  // ============ EXPENSE ACTIONS ============
  const createExpense = async (expenseData) => {
    try {
      const response = await expenseAPI.create({
        ...expenseData,
        paidByClerkId: clerkUser.id,
      });
      setExpenses(prev => [response.data, ...prev]);
      // Refresh balances after expense
      await fetchBalances();
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  const deleteExpense = async (expenseId) => {
    try {
      await expenseAPI.delete(expenseId);
      setExpenses(prev => prev.filter(e => e._id !== expenseId));
      // Refresh balances after deletion
      await fetchBalances();
    } catch (err) {
      throw err;
    }
  };

  // ============ SETTLEMENT ACTIONS ============
  const settleUp = async (settlementData) => {
    try {
      // settlementData can contain: groupId, paidBy, paidTo, amount, paymentMethod, notes
      const data = {
        groupId: settlementData.groupId,
        amount: settlementData.amount,
        paymentMethod: settlementData.paymentMethod || 'cash',
        notes: settlementData.notes || '',
      };

      // Set paidBy - use provided ID or current user's clerkId
      if (settlementData.paidBy) {
        data.paidBy = settlementData.paidBy;
      } else {
        // If no paidBy, current user is the payer
        data.paidByClerkId = clerkUser.id;
      }

      // Set paidTo - use provided ID or current user's clerkId
      if (settlementData.paidTo) {
        data.paidTo = settlementData.paidTo;
      } else if (settlementData.paidToClerkId) {
        data.paidToClerkId = settlementData.paidToClerkId;
      } else if (settlementData.paidBy) {
        // If paidBy is set but paidTo is not, current user is the receiver
        data.paidToClerkId = clerkUser.id;
      }

      console.log("Sending settlement data:", data);
      const response = await settlementAPI.create(data);
      // Refresh balances after settlement
      await fetchBalances();
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Context value
  const value = {
    // User
    user,
    clerkUser,
    clerkId: clerkUser?.id,
    loading,
    error,
    isSignedIn,

    // Groups
    groups,
    fetchGroups,
    createGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    deleteGroup,

    // Expenses
    expenses,
    fetchExpenses,
    createExpense,
    deleteExpense,

    // Balances
    balances,
    fetchBalances,

    // Settlements
    settleUp,

    // Refresh all data
    refreshData: async () => {
      await Promise.all([fetchGroups(), fetchExpenses(), fetchBalances()]);
    },
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export default AppContext;
