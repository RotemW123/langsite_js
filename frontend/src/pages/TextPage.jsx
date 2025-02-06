import { useParams } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import EditTextModal from "./EditTextModal";

const CHUNKS_PER_PAGE = 5;
function TextPage() {  // Remove the { textId } prop
  const { textId } = useParams();
  // Original state
  const [title, setTitle] = useState('');
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
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

  const fetchChunks = async (page) => {
    const token = localStorage.getItem('token'); // Add this line at the start of the function
    if (!token) {
      window.location.href = '/signin';
      return;
    }
  
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/text/${textId}/chunks?page=${page}&limit=${CHUNKS_PER_PAGE}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          window.location.href = '/signin';
          return;
        }
        throw new Error('Failed to fetch chunks');
      }
  
      const data = await response.json();
      console.log("Received chunks data:", data);  // Add this to debug
  
      if (page === 0) {
        setChunks(data.chunks);
        setTitle(data.title);
      } else {
        setChunks(prev => [...prev, ...data.chunks]);
      }
  
      setHasMore(data.hasMore);
      setCurrentPage(data.currentPage);
    } catch (err) {
      console.error('Error fetching chunks:', err);
      setError('Failed to load text chunks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChunks(0);
  }, [textId]);

  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    fetchChunks(currentPage + 1);
  };

  const getFullText = () => {
    return chunks.map(chunk => chunk.content).join('');
  };

  // Edit and Delete handlers
  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditModalClose = async (success = false) => {
    setShowEditModal(false);
    if (success) {
      // Refresh the text data
      fetchChunks(0);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this text? This action cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/signin';
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/text/${textId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete text');
      window.location.href = '/home';
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
      const visibleText = getFullText();
      const response = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: visibleText,
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
    if (!chunks.length) return null;

    const fullText = getFullText();
    const elements = [];
    let lastIndex = 0;

    practiceWords.forEach((word, index) => {
      elements.push(
        <span key={`text-${index}`}>
          {fullText.slice(lastIndex, word.position)}
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
        {fullText.slice(lastIndex)}
      </span>
    );

    return <div className="practice-text">{elements}</div>;
  };

  if (loading && chunks.length === 0) {
    return (
      <div className="loading-spinner">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          onClick={() => window.location.href = '/home'} 
          className="secondary-button"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="text-practice-container">
      <div className="text-header">
        <div className="text-header-actions">
          <button 
            onClick={() => window.location.href = '/home'} 
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
        <h1>{title}</h1>
      </div>

      <div className="text-practice-layout">
        {/* Text content */}
        <div className="text-content">
          {practiceMode ? renderPracticeText() : (
            <>
              {chunks.map((chunk, index) => (
                <div key={index} className="mb-4">
                  {chunk.content}
                </div>
              ))}
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="primary-button"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
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
      {showEditModal && <EditTextModal text={{ _id: textId, title, content: getFullText() }} closeModal={handleEditModalClose} />}
    </div>
  );
}

export default TextPage;