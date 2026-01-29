import React, { useState, useEffect } from 'react'
import './AddMember.css'

const AddMember = ({ isOpen, onClose, members, onAddMember }) => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [inputMode, setInputMode] = useState('email'); // 'email' or 'phone'

  // Stop/Start Lenis and lock body scroll when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      window.lenis?.stop();
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      window.lenis?.start();
      // Restore body scroll
      document.body.style.overflow = '';
    }
    return () => {
      window.lenis?.start();
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle wheel events for modal content scrolling
  const handleWheel = (e) => {
    // Allow the default wheel behavior for scrolling
    e.stopPropagation();
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMode === 'email' && email.trim()) {
      onAddMember(email.trim(), null);
      setEmail('');
      setPhoneNumber('');
      onClose();
    } else if (inputMode === 'phone' && phoneNumber.trim()) {
      onAddMember(null, phoneNumber.trim());
      setEmail('');
      setPhoneNumber('');
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  const switchMode = (mode) => {
    setInputMode(mode);
    setEmail('');
    setPhoneNumber('');
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container add-member-modal" onWheel={handleWheel}>
        <div className="modal-header">
          <h2>Add Member</h2>
          <button className="close-btn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {/* Toggle Buttons */}
          <div className="input-mode-toggle">
            <button
              type="button"
              className={`toggle-btn ${inputMode === 'email' ? 'active' : ''}`}
              onClick={() => switchMode('email')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              Email
            </button>
            <button
              type="button"
              className={`toggle-btn ${inputMode === 'phone' ? 'active' : ''}`}
              onClick={() => switchMode('phone')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              Phone
            </button>
          </div>

          <div className="form-group">
            {inputMode === 'email' ? (
              <>
                <label>Member Email</label>
                <div className="email-input-wrapper">
                 <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter member's email address"
                    required
                  />
                </div>
                <span className="helper-text">The person must have an account to be added as a member</span>
              </>
            ) : (
              <>
                <label>Member Phone Number</label>
                <div className="email-input-wrapper">
                 
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter member's phone number"
                    required
                  />
                </div>
                <span className="helper-text">The person must have registered with this phone number</span>
              </>
            )}
          </div>

          <div className="current-members-section">
            <h3>Current Members</h3>
            <div className="members-list">
              {members?.map((member, index) => (
                <div className="member-item" key={index}>
                  {member.imageUrl ? (
                    <img 
                      src={member.imageUrl} 
                      alt={member.name} 
                      className="member-profile-img"
                    />
                  ) : (
                    <div className="member-avatar-large">
                      {member.initials}
                    </div>
                  )}
                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    <span className="member-email">{member.email}</span>
                    {member.phoneNumber && (
                      <span className="member-phone">{member.phoneNumber}</span>
                    )}
                  </div>
                  <span className="member-badge">Member</span>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn add-member-submit">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
              Add Member
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddMember
