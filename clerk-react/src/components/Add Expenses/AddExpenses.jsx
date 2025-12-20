import React, { useState, useEffect } from 'react'
import './AddExpenses.css'
import { useApp } from '../../context/AppContext'

const AddExpenses = ({ isOpen, onClose, groups: propGroups, selectedGroup, members: propMembers }) => {
  const { groups: contextGroups, createExpense, fetchExpenses } = useApp();
  
  // Use props if provided, otherwise fall back to context
  const groups = propGroups || contextGroups || [];
  
  // Stop/Start Lenis when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Stop Lenis smooth scroll when modal is open
      window.lenis?.stop();
    } else {
      // Resume Lenis smooth scroll when modal closes
      window.lenis?.start();
    }
    
    // Cleanup: resume Lenis when component unmounts
    return () => {
      window.lenis?.start();
    };
  }, [isOpen]);
  
  const [formData, setFormData] = useState({
    groupId: selectedGroup?.id || selectedGroup?._id || '',
    description: '',
    amount: '',
    paidBy: '',
    splitType: 'equal'
  });
  
  const [splits, setSplits] = useState([]);
  const [currentMembers, setCurrentMembers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Multiple payers support
  const [isMultiplePayers, setIsMultiplePayers] = useState(false);
  const [multiplePayers, setMultiplePayers] = useState([]);

  // Update form when selectedGroup changes
  useEffect(() => {
    if (selectedGroup) {
      setFormData(prev => ({
        ...prev,
        groupId: selectedGroup.id || selectedGroup._id || ''
      }));
      // Set members from the selected group
      const members = selectedGroup.members || propMembers || [];
      setCurrentMembers(members);
      initializeSplits(members, formData.amount);
      initializeMultiplePayers(members);
    }
  }, [selectedGroup, propMembers]);

  // Update members when group changes
  useEffect(() => {
    if (formData.groupId) {
      const group = groups.find(g => (g.id || g._id) === formData.groupId);
      if (group) {
        const members = group.members?.map(m => ({
          id: m.user?._id || m.id,
          name: m.user?.fullName || m.name || 'Unknown',
          email: m.user?.email || m.email
        })) || [];
        setCurrentMembers(members);
        initializeSplits(members, formData.amount);
        initializeMultiplePayers(members);
      }
    }
  }, [formData.groupId, groups]);

  // Initialize multiple payers (with deduplication)
  const initializeMultiplePayers = (members) => {
    // Deduplicate members by ID
    const uniqueMembers = [];
    const seenIds = new Set();
    
    members.forEach(member => {
      const id = member.id || member._id;
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        uniqueMembers.push(member);
      }
    });
    
    setMultiplePayers(uniqueMembers.map(member => ({
      userId: member.id || member._id,
      name: member.name,
      amount: '',
      isSelected: false
    })));
  };

  // Initialize splits based on members and split type (with deduplication)
  const initializeSplits = (members, amount) => {
    // Deduplicate members by ID
    const uniqueMembers = [];
    const seenIds = new Set();
    
    members.forEach(member => {
      const id = member.id || member._id;
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        uniqueMembers.push(member);
      }
    });
    
    const numMembers = uniqueMembers.length || 1;
    const amountNum = parseFloat(amount) || 0;
    
    setSplits(uniqueMembers.map(member => ({
      odId: member.id || member._id,
      odName: member.name,
      amount: formData.splitType === 'equal' ? (amountNum / numMembers).toFixed(2) : '',
      percentage: formData.splitType === 'percentage' ? (100 / numMembers).toFixed(1) : ''
    })));
  };

  // Update splits when amount or split type changes
  useEffect(() => {
    if (currentMembers.length > 0) {
      const numMembers = currentMembers.length;
      const amountNum = parseFloat(formData.amount) || 0;
      
      if (formData.splitType === 'equal') {
        setSplits(currentMembers.map(member => ({
          odId: member.id || member._id,
          odName: member.name,
          amount: (amountNum / numMembers).toFixed(2),
          percentage: ''
        })));
      } else if (formData.splitType === 'percentage') {
        setSplits(prev => prev.map(split => ({
          ...split,
          amount: ((parseFloat(split.percentage) || 0) / 100 * amountNum).toFixed(2)
        })));
      }
    }
  }, [formData.amount, formData.splitType, currentMembers]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSplitTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      splitType: type
    }));
  };

  const handleSplitChange = (index, field, value) => {
    setSplits(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // If percentage, recalculate amount
      if (field === 'percentage') {
        const amountNum = parseFloat(formData.amount) || 0;
        updated[index].amount = ((parseFloat(value) || 0) / 100 * amountNum).toFixed(2);
      }
      
      return updated;
    });
  };

  const validateSplits = () => {
    const totalAmount = parseFloat(formData.amount) || 0;
    
    if (formData.splitType === 'exact') {
      const splitSum = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
      if (Math.abs(splitSum - totalAmount) > 0.01) {
        return `Split amounts (${splitSum.toFixed(2)}) don't equal total (${totalAmount.toFixed(2)})`;
      }
    } else if (formData.splitType === 'percentage') {
      const percentSum = splits.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0);
      if (Math.abs(percentSum - 100) > 0.1) {
        return `Percentages (${percentSum.toFixed(1)}%) don't equal 100%`;
      }
    }
    return null;
  };

  // Validate multiple payers amounts
  const validateMultiplePayers = () => {
    if (!isMultiplePayers) return null;
    
    const totalAmount = parseFloat(formData.amount) || 0;
    // Consider payers with amount > 0 as selected
    const selectedPayers = multiplePayers.filter(p => parseFloat(p.amount) > 0);
    
    if (selectedPayers.length === 0) {
      return 'Please select at least one payer';
    }
    
    const payerSum = selectedPayers.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    if (Math.abs(payerSum - totalAmount) > 0.01) {
      return `Payer amounts (₹${payerSum.toFixed(2)}) don't equal total (₹${totalAmount.toFixed(2)})`;
    }
    
    return null;
  };

  // Handle payer selection toggle
  const handlePayerToggle = (index) => {
    setMultiplePayers(prev => {
      const updated = [...prev];
      updated[index].isSelected = !updated[index].isSelected;
      if (!updated[index].isSelected) {
        updated[index].amount = '';
      }
      return updated;
    });
  };

  // Handle payer amount change - auto-select when typing
  const handlePayerAmountChange = (index, value) => {
    setMultiplePayers(prev => {
      const updated = [...prev];
      updated[index].amount = value;
      // Auto-select if amount is entered, auto-deselect if cleared
      updated[index].isSelected = parseFloat(value) > 0;
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate
    if (!formData.groupId) {
      setError('Please select a group');
      return;
    }
    
    // Validate payer(s)
    if (isMultiplePayers) {
      const payerError = validateMultiplePayers();
      if (payerError) {
        setError(payerError);
        return;
      }
    } else if (!formData.paidBy) {
      setError('Please select who paid');
      return;
    }
    
    const validationError = validateSplits();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Creating expense with splits:", splits);
      console.log("Current members:", currentMembers);
      
      let expenseData = {
        groupId: formData.groupId,
        description: formData.description,
        amount: parseFloat(formData.amount),
        splitType: formData.splitType,
        splits: splits.map(s => ({
          userId: s.odId,
          amount: parseFloat(s.amount) || 0,
          percentage: formData.splitType === 'percentage' ? parseFloat(s.percentage) || 0 : undefined
        }))
      };
      
      // Add payer info based on single or multiple payers
      if (isMultiplePayers) {
        // Get payers with amount > 0
        const selectedPayers = multiplePayers.filter(p => parseFloat(p.amount) > 0);
        expenseData.paidByMultiple = selectedPayers.map(p => ({
          userId: p.userId,
          amount: parseFloat(p.amount)
        }));
      } else {
        const paidByMember = currentMembers.find(m => m.name === formData.paidBy || m.id === formData.paidBy);
        expenseData.paidBy = paidByMember?.id || formData.paidBy;
      }
      
      console.log("Expense data being sent:", expenseData);
      
      await createExpense(expenseData);
      await fetchExpenses();
      
      // Reset form
      setFormData({
        groupId: selectedGroup?.id || selectedGroup?._id || '',
        description: '',
        amount: '',
        paidBy: '',
        splitType: 'equal'
      });
      setIsMultiplePayers(false);
      initializeMultiplePayers(currentMembers);
      
      onClose(true); // Pass true to indicate expense was added
    } catch (err) {
      console.error('Failed to add expense:', err);
      setError(err.message || 'Failed to add expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container add-expense-modal">
        <div className="modal-header">
          <h2>Add Expense</h2>
          <button className="close-btn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          
          <div className="form-group">
            <label>Group <span className="required">*</span></label>
            <div className="select-wrapper">
              <select 
                name="groupId" 
                value={formData.groupId} 
                onChange={handleInputChange}
                required
              >
                <option value="">Select a group</option>
                {groups?.map((group) => (
                  <option key={group.id || group._id} value={group.id || group._id}>
                    {group.name}
                  </option>
                ))}
              </select>
              <span className="select-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Description <span className="required">*</span></label>
            <input 
              type="text" 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="e.g., Dinner at restaurant"
              required
            />
          </div>

          <div className="form-group">
            <label>Amount <span className="required">*</span></label>
            <div className="amount-input">
              <span className="currency-symbol">₹</span>
              <input 
                type="number" 
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="paid-by-header">
              <label>Paid by <span className="required">*</span></label>
              <label className="multiple-payers-toggle">
                <input 
                  type="checkbox" 
                  checked={isMultiplePayers}
                  onChange={(e) => setIsMultiplePayers(e.target.checked)}
                />
                <span>Multiple payers</span>
              </label>
            </div>
            
            {!isMultiplePayers ? (
              <div className="select-wrapper">
                <select 
                  name="paidBy" 
                  value={formData.paidBy} 
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select who paid</option>
                  {currentMembers?.map((member) => (
                    <option key={member.id || member._id} value={member.id || member._id}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <span className="select-arrow">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </div>
            ) : (
              <div className="multiple-payers-list">
                {multiplePayers.map((payer, index) => (
                  <div key={`payer-${index}-${payer.userId}`} className={`payer-item ${parseFloat(payer.amount) > 0 ? 'selected' : ''}`}>
                    <span className="payer-name">{payer.name}</span>
                    <div className="payer-amount-input">
                      <span className="currency-symbol">₹</span>
                      <input 
                        type="number"
                        value={payer.amount}
                        onChange={(e) => handlePayerAmountChange(index, e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                ))}
                {formData.amount && (
                  <div className="payer-total">
                    <span>Total paid:</span>
                    <span className={
                      Math.abs(multiplePayers.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) - parseFloat(formData.amount)) < 0.01 
                        ? 'valid' 
                        : 'invalid'
                    }>
                      ₹{multiplePayers.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toFixed(2)} / ₹{parseFloat(formData.amount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Split Type</label>
            <div className="split-type-options">
              <button 
                type="button"
                className={`split-option ${formData.splitType === 'equal' ? 'active' : ''}`}
                onClick={() => handleSplitTypeChange('equal')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
                Equal
              </button>
              <button 
                type="button"
                className={`split-option ${formData.splitType === 'exact' ? 'active' : ''}`}
                onClick={() => handleSplitTypeChange('exact')}
              >
                <span className="dollar-icon">₹</span>
                Exact
              </button>
              <button 
                type="button"
                className={`split-option ${formData.splitType === 'percentage' ? 'active' : ''}`}
                onClick={() => handleSplitTypeChange('percentage')}
              >
                <span className="percent-icon">%</span>
                Percentage
              </button>
            </div>
          </div>

          {/* Split Details - Show for Exact and Percentage */}
          {(formData.splitType === 'exact' || formData.splitType === 'percentage') && currentMembers.length > 0 && (
            <div className="form-group splits-section">
              <label>Split Details</label>
              <div className="splits-list">
                {splits.map((split, index) => (
                  <div key={split.odId || index} className="split-item">
                    <span className="split-member-name">{split.odName}</span>
                    {formData.splitType === 'exact' ? (
                      <div className="split-input-wrapper">
                        <span className="split-currency">₹</span>
                        <input
                          type="number"
                          value={split.amount}
                          onChange={(e) => handleSplitChange(index, 'amount', e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    ) : (
                      <div className="split-input-wrapper percentage">
                        <input
                          type="number"
                          value={split.percentage}
                          onChange={(e) => handleSplitChange(index, 'percentage', e.target.value)}
                          placeholder="0"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                        <span className="split-percent">%</span>
                        <span className="split-calculated">= ₹{split.amount}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {formData.splitType === 'exact' && (
                <div className="splits-total">
                  Total: ₹{splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0).toFixed(2)} 
                  / ₹{parseFloat(formData.amount || 0).toFixed(2)}
                </div>
              )}
              {formData.splitType === 'percentage' && (
                <div className="splits-total">
                  Total: {splits.reduce((sum, s) => sum + (parseFloat(s.percentage) || 0), 0).toFixed(1)}% / 100%
                </div>
              )}
            </div>
          )}

          {/* Equal Split Preview */}
          {formData.splitType === 'equal' && currentMembers.length > 0 && formData.amount && (
            <div className="form-group equal-split-preview">
              <label>Split Preview</label>
              <p className="split-preview-text">
                ₹{(parseFloat(formData.amount) / currentMembers.length).toFixed(2)} per person 
                ({currentMembers.length} {currentMembers.length === 1 ? 'member' : 'members'})
              </p>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="submit-btn add-expense-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                'Adding...'
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Add Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddExpenses