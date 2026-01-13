import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useApp } from '../../context/AppContext';
import './Profile.css';

const Profile = () => {
  const { user: clerkUser } = useUser();
  const { user, setUser } = useApp();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setPhoneNumber(user.phoneNumber || '');
      setUpiId(user.upiId || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate UPI ID format
    if (upiId && !upiId.includes('@')) {
      setMessage({ 
        type: 'error', 
        text: 'Invalid UPI ID format. It should be like: 9876543210@paytm or username@ybl' 
      });
      setLoading(false);
      return;
    }

    // Validate phone number format (basic)
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      setMessage({ 
        type: 'error', 
        text: 'Invalid phone number. Please enter 10 digits without +91' 
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://splitr-lake.vercel.app/api/users/profile/${clerkUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phoneNumber, upiId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile Settings</h1>
          <p>Add your payment details for seamless settlements</p>
        </div>

        <div className="profile-card">
          <div className="user-info">
            <img 
              src={clerkUser?.imageUrl || '/default-avatar.png'} 
              alt={clerkUser?.fullName || 'User'} 
              className="profile-avatar"
            />
            <div className="user-details">
              <h2>{clerkUser?.fullName || 'User'}</h2>
              <p>{clerkUser?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="phoneNumber">
                Phone Number
                <span className="optional">(Optional)</span>
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="9876543210"
                maxLength="10"
              />
              <small>Enter 10 digits without +91</small>
            </div>

            <div className="form-group">
              <label htmlFor="upiId">
                UPI ID
                <span className="required">*Required for payments</span>
              </label>
              <input
                type="text"
                id="upiId"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="9876543210@paytm or username@ybl"
              />
              <small>
                Your UPI ID can be found in your payment app (GPay, PhonePe, Paytm, etc.)
                <br />
                Common formats: phonenumber@paytm, phonenumber@ybl, phonenumber@okaxis
              </small>
            </div>

            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="info-card">
          <h3>Why add UPI ID?</h3>
          <ul>
            <li>✅ Friends can pay you directly through GPay or PhonePe</li>
            <li>✅ One-click payment settlements</li>
            <li>✅ No need to share UPI ID every time</li>
            <li>✅ Faster and easier group settlements</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profile;
