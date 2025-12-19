import React, { useState } from 'react'
import './AllBalances.css'
import { useApp } from '../../context/AppContext'

const AllBalances = () => {
  const { balances, groups, settleUp, fetchBalances, loading } = useApp();
  const [settling, setSettling] = useState(null);

  // Helper to get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Get group name by ID
  const getGroupName = (groupId) => {
    const group = groups.find(g => g._id === groupId);
    return group ? group.name : 'Unknown Group';
  };

  // Handle settle balance
  const handleSettle = async (balance) => {
    console.log("Settling balance:", balance);
    setSettling(balance._id);
    try {
      // For 'owe' type: You (current user) paid the other person
      // For 'owed' type: The other person paid you
      const settleData = {
        groupId: balance.groupId || balance.group?._id || balance.group,
        amount: balance.amount,
        paymentMethod: 'cash'
      };

      if (balance.type === 'owe') {
        // You owe someone, so you're paying them
        // paidBy = current user (will be set by backend from clerkId)
        // paidTo = the person you owe
        settleData.paidTo = balance.toUser?._id || balance.user?._id;
        // Let backend get current user from clerkId
      } else {
        // Someone owes you (type === 'owed'), so they're paying you
        // paidBy = the person who owes you
        // paidTo = current user (will be set by backend from clerkId)
        settleData.paidBy = balance.fromUser?._id || balance.user?._id;
        // Let backend get current user as paidTo from clerkId
      }

      console.log("Settle data:", settleData);
      await settleUp(settleData);
      await fetchBalances();
    } catch (error) {
      console.error('Error settling balance:', error);
    } finally {
      setSettling(null);
    }
  };

  // Combine youOwe and youAreOwed into a single list for display
  // balances is an object: { youOwe: [], youAreOwed: [], totalYouOwe, totalYouAreOwed, netBalance }
  // Each item has: { user, group, amount } where user is the other person
  const youOweList = Array.isArray(balances?.youOwe) ? balances.youOwe : [];
  const youAreOwedList = Array.isArray(balances?.youAreOwed) ? balances.youAreOwed : [];

  console.log("Balances data:", balances);
  console.log("You owe list:", youOweList);
  console.log("You are owed list:", youAreOwedList);

  // Format balance data for display
  const formattedBalances = [
    ...youOweList.map((balance, idx) => ({
      ...balance,
      _id: balance._id || `owe-${idx}`,
      type: 'owe',
      fromName: 'You',
      fromInitials: 'Y',
      fromImageUrl: null,
      // The 'user' field contains who you owe money TO
      toUser: balance.user,
      toName: balance.user?.fullName || balance.user?.firstName || balance.user?.email || 'Unknown',
      toInitials: getInitials(balance.user?.fullName || balance.user?.firstName),
      toImageUrl: balance.user?.imageUrl,
      groupName: balance.group?.name || getGroupName(balance.group),
      groupId: balance.group?._id || balance.group
    })),
    ...youAreOwedList.map((balance, idx) => ({
      ...balance,
      _id: balance._id || `owed-${idx}`,
      type: 'owed',
      // The 'user' field contains who owes money TO you
      fromUser: balance.user,
      fromName: balance.user?.fullName || balance.user?.firstName || balance.user?.email || 'Unknown',
      fromInitials: getInitials(balance.user?.fullName || balance.user?.firstName),
      fromImageUrl: balance.user?.imageUrl,
      toName: 'You',
      toInitials: 'Y',
      toImageUrl: null,
      groupName: balance.group?.name || getGroupName(balance.group),
      groupId: balance.group?._id || balance.group
    }))
  ];

  if (loading) {
    return (
      <div id="all-balances">
        <div className="page-header">
          <div className="header-content">
            <h1>All Balances</h1>
            <p>Loading balances...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="all-balances">
      <div className="page-header">
        <div className="header-content">
          <h1>All Balances</h1>
          <p>See who owes whom across all groups</p>
        </div>
      </div>

      <div className="balances-container">
        {formattedBalances.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <h3>All Settled Up!</h3>
            <p>No outstanding balances across any groups.</p>
          </div>
        ) : (
          formattedBalances.map((balance) => (
            <div className="balance-card" key={balance._id}>
              <div className="balance-avatars">
                {balance.fromImageUrl ? (
                  <img src={balance.fromImageUrl} alt={balance.fromName} className="avatar-img from-avatar" />
                ) : (
                  <div className="avatar from-avatar">{balance.fromInitials}</div>
                )}
                <span className="arrow">→</span>
                {balance.toImageUrl ? (
                  <img src={balance.toImageUrl} alt={balance.toName} className="avatar-img to-avatar" />
                ) : (
                  <div className="avatar to-avatar">{balance.toInitials}</div>
                )}
              </div>
              <div className="balance-info">
                <h3 className="balance-title">{balance.fromName}</h3>
                <p className="balance-meta">
                  owes <span className="creditor-name">{balance.toName}</span>
                  <span className="separator">in</span>
                  <span className="group-name">{balance.groupName}</span>
                </p>
              </div>
              <div className="balance-right">
                <span className="balance-amount">₹{balance.amount.toFixed(2)}</span>
                <button 
                  className="settle-btn" 
                  onClick={() => handleSettle(balance)}
                  disabled={settling === balance._id}
                >
                  {settling === balance._id ? (
                    'Settling...'
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Settle
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AllBalances