import React, { useState, useEffect } from 'react';
import TextModal from '../components/TextModal';
import EditTextModal from '../components/EditTextModal';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../utils/api';



const LanguageHome = () => {
  const [texts, setTexts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedText, setSelectedText] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Get languageId from URL
  const languageId = window.location.pathname.split('/')[2];

  // Language display names
  const languageNames = {
    russian: 'Russian',
    spanish: 'Spanish',
    french: 'French',
    hebrew: 'Hebrew',
    german: 'German',
    arabic: 'Arabic'
  };

  const fetchTexts = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      window.location.href = '/signin';
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/text/${languageId}/mytexts`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          window.location.href = '/signin';
          throw new Error('Authentication expired. Please sign in again.');
        }
        throw new Error('Failed to fetch texts');
      }
      
      const data = await response.json();
      setTexts(data);
      setError('');
    } catch (err) {
      console.error('Error fetching texts:', err);
      setError('Failed to load texts');
      if (err.message.includes('Authentication expired')) {
        window.location.href = '/signin';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/signin';
    } else {
      fetchTexts();
    }
  }, [languageId]);


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
    e.stopPropagation();
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
    e.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this text?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/signin';
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/text/${languageId}/${textId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete text');
      }
      
      await fetchTexts();
    } catch (err) {
      console.error('Error deleting text:', err);
      setError('Failed to delete the text. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 mb-8 text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Your {languageNames[languageId]} Texts</h1>
        <p className="text-xl opacity-90">Create and manage your {languageNames[languageId]} learning materials</p>
      </div>
      
      <div className="flex justify-between items-center mb-8">
        <button 
            onClick={() => navigate('/language-selection')}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
        >
            ← Back to Languages
        </button>
        
        <div className="flex gap-4">
            <button 
            onClick={() => navigate(`/practice/${languageId}`)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
            Practice Cards
            </button>
            <button 
            onClick={handleAddTextClick}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
            + Add New Text
            </button>
        </div>
    </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      
      {showModal && <TextModal languageId={languageId} closeModal={handleModalClose} />}
      {showEditModal && selectedText && 
        <EditTextModal 
          text={selectedText} 
          languageId={languageId} 
          closeModal={handleEditModalClose} 
        />
      }

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {texts.length > 0 ? (
          texts.map((text) => (
            <div key={text._id} className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
              <h3 className="text-xl font-semibold mb-2 text-indigo-600">{text.title}</h3>
              <p className="text-gray-600 mb-4">
                {text.chunks && text.chunks[0] ? text.chunks[0].content.substring(0, 100) : ''}...
              </p>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => window.location.href = `/text/${languageId}/${text._id}`}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                >
                  Read More
                </button>
                <button 
                  onClick={(e) => handleEditClick(text, e)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
                >
                  Edit
                </button>
                <button 
                  onClick={(e) => handleDelete(text._id, e)}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No texts yet</h3>
            <p className="text-gray-500">Click the "Add New Text" button to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageHome;

