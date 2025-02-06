import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import TextModal from './TextModal';
import EditTextModal from './EditTextModal';

function HomePage() {
  const [texts, setTexts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTexts = async () => {
    const token = localStorage.getItem('token');
    console.log("🔍 Checking token:", token ? "Token exists" : "No token found");
    
    if (!token) {
      console.error("No token found - redirecting to signin");
      navigate('/signin');
      return;
    }

    try {
      setLoading(true);
      console.log("🟢 Making API request with token");
      const response = await axios.get('http://localhost:5000/api/text/mytexts', {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      console.log("🟢 API Response:", response.data);
      setTexts(response.data);
      setError('');
    } catch (err) {
      console.error('🔴 Error fetching texts:', err.response || err);
      setError('Failed to load texts');
      if (err.response?.status === 401) {
        console.log("🔴 Unauthorized - clearing token and redirecting");
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/signin');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    console.log("🔍 Initial auth check - Token:", token ? "exists" : "missing", "UserId:", userId ? "exists" : "missing");
    
    if (!token || !userId) {
      navigate('/signin');
    } else {
      fetchTexts();
    }
  }, [navigate]);

  const handleAddTextClick = () => {
    setShowModal(true);
  };

  const handleModalClose = async (success = false) => {
    setShowModal(false);
    if (success) {
      await fetchTexts();
    }
  };

  const handleEditClick = (text, e) => {
    e.stopPropagation(); // Prevent triggering any parent onClick handlers
    setSelectedText(text);
    setShowEditModal(true);
  };

  const handleEditModalClose = async (success = false) => {
    setShowEditModal(false);
    setSelectedText(null);
    if (success) {
      await fetchTexts();
    }
  };

  const handleDelete = async (textId, e) => {
    e.stopPropagation(); // Prevent triggering any parent onClick handlers
    
    if (!window.confirm('Are you sure you want to delete this text? This action cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/text/${textId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Refresh the texts list after deletion
      await fetchTexts();
    } catch (err) {
      console.error('Error deleting text:', err);
      setError('Failed to delete the text. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading-spinner">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="welcome-section">
        <h1>Your Language Learning Space</h1>
        <p>Create and manage your language learning texts</p>
      </div>
      
      <button 
        onClick={handleAddTextClick}
        className="primary-button"
        style={{ margin: '2rem 0' }}
      >
        + Add New Text
      </button>

      {error && <p className="error-message">{error}</p>}
      {showModal && <TextModal closeModal={handleModalClose} />}
      {showEditModal && selectedText && 
        <EditTextModal text={selectedText} closeModal={handleEditModalClose} />
      }

      <div className="text-grid">
        {texts.length > 0 ? (
          texts.map((text) => (
            <div key={text._id} className="text-card">
              <h3>{text.title}</h3>
              <p>{text.chunks && text.chunks[0] ? text.chunks[0].content.substring(0, 100) : ''}...</p>
              <div className="text-card-actions">
                <button 
                  onClick={() => navigate(`/text/${text._id}`)}
                  className="secondary-button"
                >
                  Read More
                </button>
                <button 
                  onClick={(e) => handleEditClick(text, e)}
                  className="secondary-button"
                >
                  Edit
                </button>
                <button 
                  onClick={(e) => handleDelete(text._id, e)}
                  className="secondary-button"
                  style={{ 
                    backgroundColor: 'var(--error)', 
                    color: 'white', 
                    borderColor: 'var(--error)',
                    opacity: 0.9,
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <h3>No texts yet</h3>
            <p>Click the "Add New Text" button to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;