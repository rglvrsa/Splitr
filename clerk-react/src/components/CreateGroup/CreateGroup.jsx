import React, { useState, useEffect } from 'react'
import './CreateGroup.css'

const CreateGroup = ({ isOpen, onClose, onCreateGroup }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.name.trim() && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onCreateGroup(formData);
        setFormData({ name: '', description: '' });
        onClose();
      } catch (error) {
        // Error is handled in parent component
        console.error('Create group error:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-container create-group-modal">
        <div className="modal-header">
          <h2>Create New Group</h2>
          <button className="close-btn" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Group Name <span className="required">*</span></label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Trip to Goa, Roommates"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Add a brief description for your group (optional)"
              rows="3"
            />
          </div>

          <div className="group-preview">
            <div className="preview-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div className="preview-info">
              <span className="preview-name">{formData.name || 'Group Name'}</span>
              <span className="preview-desc">{formData.description || 'No description'}</span>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="submit-btn create-group-submit" disabled={isSubmitting}>
              {isSubmitting ? (
                'Creating...'
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Create Group
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateGroup
