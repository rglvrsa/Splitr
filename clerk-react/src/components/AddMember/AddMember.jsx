import React, { useState, useEffect } from 'react'
import './AddMember.css'

const AddMember = ({ isOpen, onClose, members, onAddMember }) => {
  const [email, setEmail] = useState('');

  // Stop/Start Lenis when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      window.lenis?.stop();
    } else {
      window.lenis?.start();
    }
    return () => {
      window.lenis?.start();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      onAddMember(email);
      setEmail('');
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container add-member-modal">
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
          <div className="form-group">
            <label>Member Email</label>
            <div className="email-input-wrapper">
              <svg className="email-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter member's email address"
                required
              />
            </div>
            <span className="helper-text">The person must have an account to be added as a member</span>
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
