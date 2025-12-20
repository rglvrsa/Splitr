import React, { useState } from 'react'
import './AllExpenses.css'
import AddExpenses from '../../components/Add Expenses/AddExpenses'
import { useApp } from '../../context/AppContext'

const AllExpenses = () => {
  const { expenses, groups, loading } = useApp();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  // Transform groups for the modal
  const transformedGroups = groups.map(group => ({
    id: group._id,
    name: group.name,
    members: group.members?.map(m => ({
      id: m.user?._id,
      clerkId: m.user?.clerkId,
      initials: (m.user?.fullName?.split(' ').map(n => n[0]).join('') || m.user?.email?.[0] || 'U').toUpperCase(),
      name: m.user?.fullName || m.user?.email || 'Unknown',
      email: m.user?.email,
      imageUrl: m.user?.imageUrl
    })) || []
  }));

  const handleOpenAddExpense = () => {
    setIsAddExpenseOpen(true);
  };

  const handleCloseAddExpense = () => {
    setIsAddExpenseOpen(false);
  };

  return (
    <div id="all-expenses">
      <div className="page-header">
        <div className="header-content">
          <h1>All Expenses</h1>
          <p>View all your shared expenses</p>
        </div>
        <button className="add-expense-btn" onClick={handleOpenAddExpense}>
          + Add Expense
        </button>
      </div>

      <div className="expenses-container">
        {loading ? (
          <div className="loading-state">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="empty-state">
            <p>No expenses yet. Add your first expense!</p>
          </div>
        ) : (
          expenses.map((expense) => (
            <div className="expense-card" key={expense._id}>
              <div className="expense-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </div>
              <div className="expense-info">
                <h3 className="expense-title">{expense.description}</h3>
                <p className="expense-meta">
                  Paid by <span className="payer-name">{expense.paidBy?.fullName || 'Unknown'}</span>
                  <span className="separator">in</span>
                  <span className="group-name">{expense.group?.name || 'Unknown'}</span>
                  <span className="expense-date">
                    {new Date(expense.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </p>
              </div>
              <div className="expense-amount-section">
                <span className="expense-amount">₹ {expense.amount?.toFixed(2)}</span>
                <span className={`expense-tag ${expense.splitType}`}>{expense.splitType}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <AddExpenses 
        isOpen={isAddExpenseOpen}
        onClose={handleCloseAddExpense}
        groups={transformedGroups}
        selectedGroup={transformedGroups[0]}
        members={transformedGroups[0]?.members}
      />
    </div>
  )
}

export default AllExpenses