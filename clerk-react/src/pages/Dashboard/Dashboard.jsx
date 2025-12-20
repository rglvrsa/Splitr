import React, { useState } from 'react';
import './Dashboard.css';
import { useUser } from "@clerk/clerk-react";
import { Link } from 'react-router-dom';
import AddExpenses from '../../components/Add Expenses/AddExpenses';
import { useApp } from '../../context/AppContext';

const Dashboard = () => {
  const { user } = useUser();
  const { groups, expenses, balances, loading } = useApp();
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

  // Get recent expenses (last 5)
  const recentExpenses = expenses.slice(0, 5);

  return (
    <>
    
    <div id="dashboard">
      <div id="dashhead">
        <h3>Welcome Back,</h3>
        <h1>{user?.firstName || user?.username || 'User'}</h1>
        <h5>Here's your expense summary</h5>
      </div>
      <div id="dashmid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-red">
            <i className="ri-arrow-down-line"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">You Owe</span>
            <span className="stat-value stat-value-red">Rs {balances.totalYouOwe?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-green">
            <i className="ri-arrow-up-line"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">You Are Owed</span>
            <span className="stat-value stat-value-green">Rs {balances.totalYouAreOwed?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-purple">
            <i className="ri-group-line"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Active Groups</span>
            <span className="stat-value">{groups.length}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <i className="ri-money-dollar-box-line"></i>
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value">{expenses.length}</span>
          </div>
        </div>
      </div>
      <div id="dashbot">
        <div id="dashbotbuttons">
          <button className="dash-btn dash-btn-primary" onClick={handleOpenAddExpense}>
            <i className="ri-add-line"></i>
            <span>Add Expense</span>
          </button>
          <Link to ="/group">
          <button className="dash-btn dash-btn-secondary">
            <i className="ri-group-2-line"></i>
            <span>Groups</span>
          </button>
          </Link>
          <Link to ="/all-expenses">
          <button className="dash-btn dash-btn-tertiary">
            <i className="ri-file-list-3-line"></i>
            <span>All Expenses</span>
          </button>
          </Link>
          <Link to ="/all-balances">
          <button className="dash-btn dash-btn-quaternary">
            <i className="ri-wallet-3-line"></i>
            <span>All Balances</span>
          </button>
          </Link>
        </div>
        <div id="dashbotothers">
          {/* Outstanding Balances Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Outstanding Balances</h2>
              <Link to="/all-balances"><button className="view-all-btn">View All</button></Link>
            </div>
            {balances.youOwe?.length > 0 || balances.youAreOwed?.length > 0 ? (
              <div className="card-content">
                {balances.youOwe?.slice(0, 3).map((item, idx) => (
                  <div className="balance-item" key={idx}>
                    <span className="balance-name">You owe {item.user?.fullName || 'Unknown'}</span>
                    <span className="balance-amount balance-negative">Rs {item.amount?.toFixed(2)}</span>
                  </div>
                ))}
                {balances.youAreOwed?.slice(0, 3).map((item, idx) => (
                  <div className="balance-item" key={idx}>
                    <span className="balance-name">{item.user?.fullName || 'Unknown'} owes you</span>
                    <span className="balance-amount balance-positive">Rs {item.amount?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card-content empty-state">
                <div className="empty-icon">
                  <i className="ri-line-chart-line"></i>
                </div>
                <h3>All Settled Up!</h3>
                <p>No outstanding balances. You're all caught up.</p>
              </div>
            )}
          </div>

          {/* Recent Expenses Card */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Recent Expenses</h2>
              <Link to="/all-expenses"><button className="view-all-btn">View All</button></Link>
            </div>
            <div className="card-content">
              {recentExpenses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="ri-money-dollar-box-line"></i>
                  </div>
                  <h3>No Expenses Yet</h3>
                  <p>Add your first expense to get started!</p>
                </div>
              ) : (
                recentExpenses.map((expense) => (
                  <div className="expense-item" key={expense._id}>
                    <div className="expense-icon">
                      <i className="ri-money-dollar-box-line"></i>
                    </div>
                    <div className="expense-details">
                      <span className="expense-title">{expense.description}</span>
                      <span className="expense-meta">
                        Paid by {expense.paidBy?.fullName || 'Unknown'} &nbsp; 
                        {new Date(expense.expenseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="expense-amount-section">
                      <span className="expense-amount">₹ {expense.amount?.toFixed(2)}</span>
                      <span className="expense-tag">{expense.splitType}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

    </div>

    <AddExpenses 
      isOpen={isAddExpenseOpen}
      onClose={handleCloseAddExpense}
      groups={transformedGroups}
      selectedGroup={transformedGroups[0]}
      members={transformedGroups[0]?.members}
    />
      
    </>
  )
}

export default Dashboard