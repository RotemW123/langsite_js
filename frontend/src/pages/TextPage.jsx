import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

function TextPage() {
  // Original state
  const [text, setText] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New state for practice functionality
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

  // Original useEffect for fetching text
  useEffect(() => {
    const fetchText = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/text/${textId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setText(response.data);
      } catch (err) {
        console.error('Error fetching text:', err);
        setError('Failed to load the text. Please try again.');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          navigate('/signin');
        }
      } finally {
        setLoading(false);
      }
    };
  
    fetchText();
  }, [textId, navigate]);

  // New handlers for practice functionality
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
      const response = await axios.post('http://localhost:5001/analyze', {
        text: text.content,
        cases: selectedCasesList
      });

      setPracticeWords(response.data.words);
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
      const response = await axios.post('http://localhost:5001/check', {
        original: word.original,
        answer: userAnswers[wordId],
        case: word.case
      });

      setFeedback(prev => ({
        ...prev,
        [wordId]: response.data
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
    if (!text || !practiceWords.length) return null;

    let content = text.content;
    const elements = [];
    let lastIndex = 0;

    practiceWords.forEach((word, index) => {
      // Add text before the practice word
      elements.push(content.slice(lastIndex, word.position));

      // Add the practice input
      elements.push(
        <span key={index} className="practice-word">
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

    // Add remaining text
    elements.push(content.slice(lastIndex));

    return <div className="practice-text">{elements}</div>;
  };

  // Loading state
  if (loading) {
    return (
      <div className="App">
        <div className="loading-spinner">
          Loading...
        </div>
      </div>
    );
  }

  // Error state
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

  // Not found state
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

  // Main render
  return (
    <div className="App">
      <div className="text-practice-container">
        <div className="text-header">
          <button 
            onClick={() => navigate('/home')} 
            className="secondary-button"
          >
            ← Back to Home
          </button>
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
    </div>
  );
}

export default TextPage;