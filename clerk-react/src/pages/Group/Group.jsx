import React, { useState, useEffect } from 'react'
import './Group.css'
import AddExpenses from '../../components/Add Expenses/AddExpenses'
import AddMember from '../../components/AddMember/AddMember'
import CreateGroup from '../../components/CreateGroup/CreateGroup'
import { useApp } from '../../context/AppContext'
import { expenseAPI, balanceAPI } from '../../services/api'

const Group = () => {
  const { groups, fetchGroups, createGroup, addMemberToGroup, settleUp, clerkUser, loading } = useApp();
  
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('expenses');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  
  // Group-specific data
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [groupBalances, setGroupBalances] = useState([]);
  const [loadingGroupData, setLoadingGroupData] = useState(false);

  // Refresh groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  // State for simplified settlements from API
  const [simplifiedSettlements, setSimplifiedSettlements] = useState([]);

  // Fetch group expenses and balances when a group is selected
  useEffect(() => {
    const fetchGroupData = async () => {
      if (!selectedGroup?.id) return;
      
      setLoadingGroupData(true);
      try {
        // Fetch expenses for this group
        const expensesRes = await expenseAPI.getGroupExpenses(selectedGroup.id);
        setGroupExpenses(expensesRes.data || []);
        
        // Fetch balances for this group
        if (clerkUser?.id) {
          const balancesRes = await balanceAPI.getGroupBalances(selectedGroup.id, clerkUser.id);
          setGroupBalances(balancesRes.data?.balances || []);
        }
        
        // Fetch simplified settlements (deduplicated from backend)
        const simplifiedRes = await balanceAPI.getSimplified(selectedGroup.id);
        setSimplifiedSettlements(simplifiedRes.data || []);
      } catch (err) {
        console.error('Failed to fetch group data:', err);
      } finally {
        setLoadingGroupData(false);
      }
    };
    
    fetchGroupData();
  }, [selectedGroup?.id, clerkUser?.id]);

  // Transform backend groups to UI format
  const transformedGroups = groups.map(group => ({
    id: group._id,
    name: group.name,
    description: group.description,
    members: group.members?.map(m => ({
      id: m.user?._id,
      initials: (m.user?.fullName?.split(' ').map(n => n[0]).join('') || m.user?.email?.[0] || 'U').toUpperCase(),
      name: m.user?.fullName || m.user?.email || 'Unknown',
      email: m.user?.email,
      imageUrl: m.user?.imageUrl
    })) || [],
    expenses: [],
    total: group.totalExpenses || 0
  }));

  const handleCardClick = (group) => {
    setSelectedGroup(group);
  };

  const handleBackClick = () => {
    setSelectedGroup(null);
    setActiveTab('expenses');
  };

  // Refresh group data (expenses and balances)
  const refreshGroupData = async () => {
    if (!selectedGroup?.id) return;
    
    try {
      const expensesRes = await expenseAPI.getGroupExpenses(selectedGroup.id);
      setGroupExpenses(expensesRes.data || []);
      
      if (clerkUser?.id) {
        const balancesRes = await balanceAPI.getGroupBalances(selectedGroup.id, clerkUser.id);
        setGroupBalances(balancesRes.data?.balances || []);
      }
      
      // Also refresh simplified settlements
      const simplifiedRes = await balanceAPI.getSimplified(selectedGroup.id);
      setSimplifiedSettlements(simplifiedRes.data || []);
    } catch (err) {
      console.error('Failed to refresh group data:', err);
    }
  };

  // Add Expense Modal
  const handleOpenAddExpense = () => {
    setIsAddExpenseOpen(true);
  };

  const handleCloseAddExpense = async (expenseAdded = false) => {
    setIsAddExpenseOpen(false);
    // Refresh data if an expense was added
    if (expenseAdded) {
      await refreshGroupData();
    }
  };

  // Add Member Modal
  const handleOpenAddMember = () => {
    setIsAddMemberOpen(true);
  };

  const handleCloseAddMember = () => {
    setIsAddMemberOpen(false);
  };

  const handleAddMember = async (email) => {
    if (!selectedGroup) return;
    try {
      // Use the response from the API to update the selected group immediately
      const updated = await addMemberToGroup(selectedGroup.id, email);

      // Transform the returned backend group into the UI-friendly shape
      const updatedGroup = {
        id: updated._id,
        name: updated.name,
        description: updated.description,
        members: updated.members?.map(m => ({
          id: m.user?._id,
          initials: (m.user?.fullName?.split(' ').map(n => n[0]).join('') || m.user?.email?.[0] || 'U').toUpperCase(),
          name: m.user?.fullName || m.user?.email || 'Unknown',
          email: m.user?.email,
          imageUrl: m.user?.imageUrl
        })) || [],
        expenses: [],
        total: updated.totalExpenses || 0
      };

      // Update selected group in UI immediately
      setSelectedGroup(updatedGroup);

      // Refresh groups list in background to keep global state consistent
      fetchGroups();
    } catch (err) {
      console.error('Failed to add member:', err);
      alert(err.message || 'Failed to add member');
      throw err;
    }
  };

  // Create Group Modal
  const handleOpenCreateGroup = () => {
    setIsCreateGroupOpen(true);
  };

  const handleCloseCreateGroup = () => {
    setIsCreateGroupOpen(false);
  };

  const handleCreateGroup = async (groupData) => {
    try {
      await createGroup(groupData.name, groupData.description);
      await fetchGroups();
      setIsCreateGroupOpen(false);
    } catch (err) {
      console.error('Failed to create group:', err);
      alert(err.message || 'Failed to create group');
      throw err; // Re-throw so CreateGroup component knows it failed
    }
  };

  // Calculate balances from fetched group balances
  const calculateBalances = () => {
    if (!selectedGroup) return [];
    
    const members = selectedGroup.members || [];
    console.log("Members:", members);
    console.log("Group Balances from API:", groupBalances);
    
    // If we have fetched group balances, process them
    if (groupBalances.length > 0) {
      // Create a map of member balances using string IDs as keys
      const balanceMap = {};
      
      // Initialize all members with 0 balance
      members.forEach(member => {
        const memberId = String(member.id);
        balanceMap[memberId] = { 
          name: member.name, 
          balance: 0, 
          initials: member.initials, 
          imageUrl: member.imageUrl 
        };
      });

      // Process balance records - each balance shows "from owes to amount"
      groupBalances.forEach(b => {
        const fromId = String(b.from?._id);
        const toId = String(b.to?._id);
        const amount = b.amount;

        // Person who owes (from) has negative balance
        if (fromId && balanceMap[fromId]) {
          balanceMap[fromId].balance -= amount;
        }
        // Person who is owed (to) has positive balance
        if (toId && balanceMap[toId]) {
          balanceMap[toId].balance += amount;
        }
      });

      return Object.entries(balanceMap)
        .filter(([id, data]) => Math.abs(data.balance) > 0.01)
        .map(([id, data]) => ({
          id,
          name: data.name,
          balance: data.balance,
          initials: data.initials,
          imageUrl: data.imageUrl
        }));
    }
    
    // Fallback: Calculate from expenses if no balance data
    if (!groupExpenses.length) return [];
    
    const balances = {};
    
    members.forEach(member => {
      const memberId = String(member.id);
      balances[memberId] = { name: member.name, amount: 0, initials: member.initials, imageUrl: member.imageUrl };
    });

    const totalExpenses = groupExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const perPersonShare = totalExpenses / members.length;

    groupExpenses.forEach(expense => {
      const payerId = String(expense.paidBy?._id || expense.paidBy);
      if (balances[payerId]) {
        balances[payerId].amount += expense.amount;
      }
    });

    return Object.entries(balances).map(([id, data]) => ({
      id,
      name: data.name,
      balance: data.amount - perPersonShare,
      initials: data.initials,
      imageUrl: data.imageUrl
    }));
  };

  // Calculate settlements
  const calculateSettlements = () => {
    const balances = calculateBalances();
    console.log("Balances for settlements:", balances);
    const settlements = [];
    
    const debtors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
    const creditors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

      if (amount > 0) {
        settlements.push({
          fromId: debtor.id,
          from: debtor.name,
          fromInitials: debtor.initials,
          fromImageUrl: debtor.imageUrl,
          toId: creditor.id,
          to: creditor.name,
          toInitials: creditor.initials,
          toImageUrl: creditor.imageUrl,
          amount
        });
      }

      debtors[i].balance += amount;
      creditors[j].balance -= amount;

      if (Math.abs(debtors[i].balance) < 0.01) i++;
      if (creditors[j].balance < 0.01) j++;
    }

    return settlements;
  };

  // Handle settle button click (for local calculations - legacy)
  const handleSettle = async (settlement) => {
    try {
      await settleUp({
        groupId: selectedGroup.id,
        paidBy: settlement.fromId,
        paidTo: settlement.toId,
        amount: settlement.amount,
        paymentMethod: 'cash'
      });
      
      // Refresh group data after settlement (no alert, just update UI)
      await refreshGroupData();
    } catch (err) {
      console.error('Failed to settle:', err);
    }
  };

  // Handle settle button click (for API-based simplified settlements)
  const handleSettleFromAPI = async (settlement) => {
    try {
      await settleUp({
        groupId: selectedGroup.id,
        paidBy: settlement.from?._id,
        paidTo: settlement.to?._id,
        amount: settlement.amount,
        paymentMethod: 'cash'
      });
      
      // Refresh group data after settlement (no alert, just update UI)
      await refreshGroupData();
    } catch (err) {
      console.error('Failed to settle:', err);
    }
  };

  // Group Detail View
  if (selectedGroup) {
    return (
      <div id="group">
        <div id="groupdetail">
          <button className="back-btn" onClick={handleBackClick}>
            <span>‹</span> Back to Groups
          </button>
          
          <div className="detail-header">
            <div className="detail-title-section">
              <h1 className="detail-title">{selectedGroup.name}</h1>
              <div className="detail-members-info">
                <div className="detail-avatars">
                  {selectedGroup.members.map((member, index) => (
                    member.imageUrl ? (
                      <img 
                        src={member.imageUrl} 
                        alt={member.name}
                        className="member-avatar-img"
                        key={index}
                        style={{ marginLeft: index > 0 ? '-10px' : '0' }}
                      />
                    ) : (
                      <div 
                        className="member-avatar" 
                        key={index}
                        style={{ marginLeft: index > 0 ? '-10px' : '0' }}
                      >
                        {member.initials}
                      </div>
                    )
                  ))}
                </div>
                <span className="members-count">{selectedGroup.members.length} members</span>
              </div>
            </div>
            <div className="detail-actions">
              <button className="add-member-btn" onClick={handleOpenAddMember}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Add Member
              </button>
              <button className="add-expense-btn" onClick={handleOpenAddExpense}>+ Add Expense</button>
            </div>
          </div>

          <div className="detail-tabs">
            <button 
              className={`tab ${activeTab === 'expenses' ? 'active' : ''}`}
              onClick={() => setActiveTab('expenses')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              Expenses
            </button>
            <button 
              className={`tab ${activeTab === 'balances' ? 'active' : ''}`}
              onClick={() => setActiveTab('balances')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
              Balances
            </button>
            <button 
              className={`tab ${activeTab === 'settle' ? 'active' : ''}`}
              onClick={() => setActiveTab('settle')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Settle Up
            </button>
          </div>

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="expenses-list">
              {loadingGroupData ? (
                <div className="empty-state">
                  <p>Loading expenses...</p>
                </div>
              ) : groupExpenses.length === 0 ? (
                <div className="empty-state">
                  <p>No expenses yet. Add your first expense!</p>
                </div>
              ) : (
                groupExpenses.map((expense) => (
                  <div className="expense-item" key={expense._id}>
                    <div className="expense-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                      </svg>
                    </div>
                    <div className="expense-details">
                      <h4 className="expense-title">{expense.description}</h4>
                      <div className="expense-meta">
                        <span>Paid by {
                          expense.paidByMultiple && expense.paidByMultiple.length > 1
                            ? expense.paidByMultiple.map(p => p.user?.fullName || 'Unknown').join(', ')
                            : expense.paidBy?.fullName || expense.paidBy?.email || 'Unknown'
                        }</span>
                        <span>{new Date(expense.expenseDate || expense.createdAt).toLocaleDateString()}</span>
                        <span className="split-badge">{expense.splitType}</span>
                        {expense.paidByMultiple && expense.paidByMultiple.length > 1 && (
                          <span className="split-badge multi-payer">Multiple Payers</span>
                        )}
                      </div>
                    </div>
                    <div className="expense-amount">₹{expense.amount.toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Balances Tab */}
          {activeTab === 'balances' && (
            <div className="balances-list">
              {loadingGroupData ? (
                <div className="empty-state">
                  <p>Loading balances...</p>
                </div>
              ) : groupBalances.length === 0 ? (
                <div className="empty-state">
                  <p>No balances yet. All settled up!</p>
                </div>
              ) : (
                groupBalances.map((balance, index) => (
                  <div className="balance-item" key={index}>
                    <div className="balance-user">
                      {balance.from?.imageUrl ? (
                        <img src={balance.from.imageUrl} alt={balance.from.fullName} className="member-avatar-img" />
                      ) : (
                        <div className="member-avatar">{(balance.from?.fullName || 'U')[0]}</div>
                      )}
                      <span className="balance-name">{balance.from?.fullName || 'Unknown'}</span>
                    </div>
                    <div className="balance-arrow">
                      <span>owes</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>
                    <div className="balance-user">
                      {balance.to?.imageUrl ? (
                        <img src={balance.to.imageUrl} alt={balance.to.fullName} className="member-avatar-img" />
                      ) : (
                        <div className="member-avatar">{(balance.to?.fullName || 'U')[0]}</div>
                      )}
                      <span className="balance-name">{balance.to?.fullName || 'Unknown'}</span>
                    </div>
                    <div className="balance-amount negative">
                      ₹{balance.amount.toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Settle Up Tab */}
          {activeTab === 'settle' && (
            <div className="settle-list">
              {loadingGroupData ? (
                <div className="empty-state">
                  <p>Loading settlements...</p>
                </div>
              ) : simplifiedSettlements.length === 0 ? (
                <div className="empty-state settled">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <p>All settled up! No payments needed.</p>
                </div>
              ) : (
                simplifiedSettlements.map((settlement, index) => (
                  <div className="settle-item" key={index}>
                    <div className="settle-from">
                      {settlement.from?.imageUrl ? (
                        <img src={settlement.from.imageUrl} alt={settlement.from.fullName} className="member-avatar-img" />
                      ) : (
                        <div className="member-avatar">{(settlement.from?.fullName || 'U')[0]}</div>
                      )}
                      <span>{settlement.from?.fullName || 'Unknown'}</span>
                    </div>
                    <div className="settle-arrow">
                      <span>pays</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>
                    <div className="settle-to">
                      {settlement.to?.imageUrl ? (
                        <img src={settlement.to.imageUrl} alt={settlement.to.fullName} className="member-avatar-img" />
                      ) : (
                        <div className="member-avatar">{(settlement.to?.fullName || 'U')[0]}</div>
                      )}
                      <span>{settlement.to?.fullName || 'Unknown'}</span>
                    </div>
                    <div className="settle-amount">₹{settlement.amount.toFixed(2)}</div>
                    <button className="settle-btn" onClick={() => handleSettleFromAPI(settlement)}>Settle</button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <AddExpenses 
          isOpen={isAddExpenseOpen}
          onClose={handleCloseAddExpense}
          groups={groups}
          selectedGroup={selectedGroup}
          members={selectedGroup.members}
        />

        <AddMember
          isOpen={isAddMemberOpen}
          onClose={handleCloseAddMember}
          members={selectedGroup.members}
          onAddMember={handleAddMember}
        />
      </div>
    );
  }

  // Group List View
  return (
    <>
      <div id="group">
        <div id="grouphead">
          <h1>Group Page</h1>
          <h6>Manage your groups here</h6>
        </div>
        <div id="groupmain">
          <div id="groupmainbut">
            <button className="create-group-btn" onClick={handleOpenCreateGroup}>+ Create Group</button>
          </div>
          <div id="groupmainlist">
            {loading ? (
              <div className="loading-state">Loading groups...</div>
            ) : transformedGroups.length === 0 ? (
              <div className="empty-state">
                <p>No groups yet. Create your first group!</p>
              </div>
            ) : (
              transformedGroups.map((group) => (
              <div className="group-card" key={group.id} onClick={() => handleCardClick(group)}>
                <div className="group-card-header">
                  <div className="group-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </div>
                  <span className="group-arrow">›</span>
                </div>
                <h3 className="group-name">{group.name}</h3>
                <div className="group-stats">
                  <div className="stat">
                    <span className="stat-label">Members</span>
                    <span className="stat-value">{group.members.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Expenses</span>
                    <span className="stat-value">{group.expenses.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Total</span>
                    <span className="stat-value">₹{group.total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="group-members">
                  {group.members.map((member, index) => (
                    member.imageUrl ? (
                      <img 
                        src={member.imageUrl} 
                        alt={member.name}
                        className="member-avatar-img"
                        key={index}
                        style={{ marginLeft: index > 0 ? '-10px' : '0' }}
                      />
                    ) : (
                      <div 
                        className="member-avatar" 
                        key={index}
                        style={{ marginLeft: index > 0 ? '-10px' : '0' }}
                      >
                        {member.initials}
                      </div>
                    )
                  ))}
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>

      <CreateGroup
        isOpen={isCreateGroupOpen}
        onClose={handleCloseCreateGroup}
        onCreateGroup={handleCreateGroup}
      />
    </>
  )
}

export default Group