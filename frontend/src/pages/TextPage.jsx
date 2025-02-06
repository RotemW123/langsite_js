import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import EditTextModal from './EditTextModal';

function TextPage() {
  // Original state
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit and delete state
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Practice functionality state
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceWords, setPracticeWords] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [selectedCases, setSelectedCases] = useState({
    nominative: false,
    accusative: false,
    genitive: false,
    dative: false,
    instrumental: false,
    prepositional: false
  });

  const { textId } = useParams();
  const navigate = useNavigate();

  const fetchText = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/text/${textId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          navigate('/signin');
          return;
        }
        throw new Error('Failed to load text');
      }

      const data = await response.json();
      setText(data);
    } catch (err) {
      console.error('Error fetching text:', err);
      setError('Failed to load the text. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchText();
  }, [textId, navigate]);

  // Edit and Delete handlers
  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditModalClose = async (success = false) => {
    setShowEditModal(false);
    if (success) {
      // Refresh the text data
      fetchText();
    }
  };

  const handleDelete = async () => {
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

      navigate('/home');
    } catch (err) {
      console.error('Error deleting text:', err);
      setError('Failed to delete the text. Please try again.');
    }
  };

  // Practice functionality handlers
  const handleCaseToggle = (caseName) => {
    setSelectedCases(prev => ({
      ...prev,
      [caseName]: !prev[caseName]
    }));
  };

  const handlePracticeClick = async () => {
    const selectedCasesList = Object.entries(selectedCases)
      .filter(([_, isSelected]) => isSelected)
      .map(([caseName]) => caseName);

    if (selectedCasesList.length === 0) {
      alert('Please select at least one grammatical case to practice');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.content,
          cases: selectedCasesList
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze text');
      }

      const data = await response.json();
      setPracticeWords(data.words);
      setUserAnswers({});
      setFeedback({});
      setPracticeMode(true);
    } catch (err) {
      console.error('Error starting practice:', err);
      setError('Failed to analyze text for practice');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (wordId, value) => {
    setUserAnswers(prev => ({
      ...prev,
      [wordId]: value
    }));
  };

  const checkAnswer = async (wordId) => {
    try {
      const word = practiceWords[wordId];
      console.log('Checking word:', {
        original: word.original,
        answer: userAnswers[wordId],
        nominative: word.nominative,
        case: word.case,
      });

      const response = await fetch('http://localhost:5001/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original: word.original,
          answer: userAnswers[wordId],
          case: word.case
        })
      });

      if (!response.ok) {
        throw new Error('Failed to check answer');
      }

      const data = await response.json();
      console.log('Server response:', data);

      setFeedback(prev => ({
        ...prev,
        [wordId]: data
      }));
    } catch (err) {
      console.error('Error checking answer:', err);
      setFeedback(prev => ({
        ...prev,
        [wordId]: { correct: false, message: 'Error checking answer' }
      }));
    }
  };

  const renderPracticeText = () => {
    if (!text?.content) return null;

    if (!practiceWords.length) {
      return <p className="text-content">{text.content}</p>;
    }

    let content = text.content;
    const elements = [];
    let lastIndex = 0;

    practiceWords.forEach((word, index) => {
      elements.push(
        <span key={`text-${index}`}>
          {content.slice(lastIndex, word.position)}
        </span>
      );

      elements.push(
        <span key={`practice-${index}`} className="practice-word">
          <input
            type="text"
            value={userAnswers[index] || ''}
            onChange={(e) => handleAnswerChange(index, e.target.value)}
            placeholder={word.nominative}
            className={`practice-input ${
              feedback[index]?.correct ? 'correct' : 
              feedback[index]?.correct === false ? 'incorrect' : ''
            }`}
          />
          <button 
            onClick={() => checkAnswer(index)}
            className="check-button secondary-button"
          >
            Check
          </button>
          {feedback[index] && (
            <span className={`feedback ${feedback[index].correct ? 'correct' : 'incorrect'}`}>
              {feedback[index].message}
            </span>
          )}
        </span>
      );

      lastIndex = word.position + word.length;
    });

    elements.push(
      <span key="text-end">
        {content.slice(lastIndex)}
      </span>
    );

    return <div className="practice-text">{elements}</div>;
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

  if (error) {
    return (
      <div className="App">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            onClick={() => navigate('/home')} 
            className="secondary-button"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!text) {
    return (
      <div className="App">
        <div className="error-container">
          <h2>Text Not Found</h2>
          <button 
            onClick={() => navigate('/home')} 
            className="secondary-button"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="text-practice-container">
        <div className="text-header">
          <div className="text-header-actions">
            <button 
              onClick={() => navigate('/home')} 
              className="secondary-button"
            >
              ← Back to Home
            </button>
            <div className="text-actions">
              <button 
                onClick={handleEdit}
                className="secondary-button"
              >
                Edit
              </button>
              <button 
                onClick={handleDelete}
                className="secondary-button"
                style={{ backgroundColor: 'var(--error)', color: 'white', borderColor: 'var(--error)' }}
              >
                Delete
              </button>
            </div>
          </div>
          <h1>{text.title}</h1>
        </div>

        <div className="text-practice-layout">
          {/* Text content */}
          <div className="text-content">
            {practiceMode ? renderPracticeText() : <p>{text.content}</p>}
          </div>

          {/* Practice panel */}
          <div className="practice-panel">
            <h3>Russian Grammar Cases</h3>
            <div className="cases-grid">
              {Object.entries(selectedCases).map(([caseName, isSelected]) => (
                <label key={caseName} className="case-checkbox">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleCaseToggle(caseName)}
                    disabled={practiceMode}
                  />
                  {caseName.charAt(0).toUpperCase() + caseName.slice(1)}
                </label>
              ))}
            </div>
            <button 
              onClick={practiceMode ? () => setPracticeMode(false) : handlePracticeClick}
              className="primary-button practice-button"
              disabled={!practiceMode && !Object.values(selectedCases).some(Boolean)}
            >
              {practiceMode ? 'Exit Practice Mode' : 'Practice Selected Cases'}
            </button>
          </div>
        </div>
      </div>
      {showEditModal && <EditTextModal text={text} closeModal={handleEditModalClose} />}
    </div>
  );
}

export default TextPage;