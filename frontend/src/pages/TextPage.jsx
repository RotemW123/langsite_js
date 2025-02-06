import { useParams } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import EditTextModal from "./EditTextModal";

const CHUNKS_PER_PAGE = 1;
function TextPage() {  // Remove the { textId } prop
  const [visibleChunks, setVisibleChunks] = useState([])
  const [analyzedText, setAnalyzedText] = useState('');
  const [practiceLoading, setPracticeLoading] = useState(false)
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

  const [analyzedChunks, setAnalyzedChunks] = useState(new Set()); // Track which chunks have been analyzed

  
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
    const token = localStorage.getItem('token');
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
        throw new Error('Failed to fetch chunks');
      }

      const data = await response.json();
      
      if (page === 0) {
        setChunks([data.chunks[0]]); // Only set first chunk
        setVisibleChunks([data.chunks[0]]);
        setTitle(data.title);
      } else {
        const nextChunk = data.chunks[0]; // Get only one new chunk
        setChunks(prev => [...prev, nextChunk]);
        if (practiceMode) {
          // In practice mode, wait for analysis before showing
          await analyzeAndAddChunk(nextChunk);
        } else {
          setVisibleChunks(prev => [...prev, nextChunk]);
        }
      }

      setHasMore(currentPage + 1 < data.totalChunks);
      setCurrentPage(data.currentPage);
    } catch (err) {
      console.error('Error fetching chunks:', err);
      setError('Failed to load text chunks');
    } finally {
      setLoading(false);
    }
  };

  const analyzeAndAddChunk = async (chunk) => {
    setPracticeLoading(true);
    try {
      const selectedCasesList = Object.entries(selectedCases)
        .filter(([_, isSelected]) => isSelected)
        .map(([caseName]) => caseName);

      const response = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: chunk.content,
          cases: selectedCasesList
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze chunk');
      }

      const data = await response.json();
      
      // Adjust word positions based on previous chunks
      const offset = visibleChunks.reduce((acc, c) => acc + c.content.length, 0);
      const adjustedWords = data.words.map(word => ({
        ...word,
        position: word.position + offset
      }));

      setPracticeWords(prev => [...prev, ...adjustedWords]);
      setVisibleChunks(prev => [...prev, chunk]);
    } catch (err) {
      console.error('Error analyzing chunk:', err);
      setError('Failed to analyze text chunk');
    } finally {
      setPracticeLoading(false);
    }
  };

  useEffect(() => {
    fetchChunks(0);
  }, [textId]);

  const handleLoadMore = async () => {
    if (!hasMore || loading) return;
    const nextPage = currentPage + 1;
    await fetchChunks(nextPage);
    
    if (practiceMode) {
      // Analyze new chunks
      try {
        setPracticeLoading(true);
        const newChunks = chunks.slice(nextPage * CHUNKS_PER_PAGE, (nextPage + 1) * CHUNKS_PER_PAGE);
        const newText = newChunks.map(chunk => chunk.content).join('');
        
        // Skip if this text was already analyzed
        if (analyzedText.includes(newText)) {
          return;
        }
        
        const selectedCasesList = Object.entries(selectedCases)
          .filter(([_, isSelected]) => isSelected)
          .map(([caseName]) => caseName);

        const response = await fetch('http://localhost:5001/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: newText,
            cases: selectedCasesList
          })
        });

        if (!response.ok) {
          throw new Error('Failed to analyze new chunks');
        }

        const data = await response.json();
        
        // Adjust positions for new words
        const offset = analyzedText.length;
        const newWords = data.words.map(word => ({
          ...word,
          position: word.position + offset
        }));

        setPracticeWords(prev => [...prev, ...newWords]);
        setAnalyzedText(prev => prev + newText);
      } catch (err) {
        console.error('Error analyzing new chunks:', err);
        setError('Failed to analyze new text chunks');
      } finally {
        setPracticeLoading(false);
      }
    }
  };


  const analyzeNewChunks = async () => {
    const selectedCasesList = Object.entries(selectedCases)
      .filter(([_, isSelected]) => isSelected)
      .map(([caseName]) => caseName);

    // Get only unanalyzed chunks
    const newChunks = chunks.filter((_, index) => !analyzedChunks.has(index));
    if (newChunks.length === 0) return;

    try {
      setPracticeLoading(true);
      const newText = newChunks.map(chunk => chunk.content).join('');

      const response = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newText,
          cases: selectedCasesList
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze text');
      }

      const data = await response.json();
      
      // Adjust word positions to account for previous chunks
      const offset = chunks
        .slice(0, chunks.length - newChunks.length)
        .reduce((acc, chunk) => acc + chunk.content.length, 0);

      const adjustedWords = data.words.map(word => ({
        ...word,
        position: word.position + offset
      }));

      // Merge new words with existing ones
      setPracticeWords(prev => [...prev, ...adjustedWords]);
      
      // Mark these chunks as analyzed
      setAnalyzedChunks(prev => {
        const newSet = new Set(prev);
        newChunks.forEach((_, index) => newSet.add(chunks.length - newChunks.length + index));
        return newSet;
      });

    } catch (err) {
      console.error('Error analyzing new chunks:', err);
      setError('Failed to analyze new text chunks');
    } finally {
      setPracticeLoading(false);
    }
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
      setPracticeLoading(true);
      // Reset visible chunks and practice words
      setVisibleChunks([chunks[0]]);
      
      const response = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: chunks[0].content,
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
      setPracticeLoading(false);
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
        <div className="text-content">
          {practiceMode ? (
            <>
              {renderPracticeText()}
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading || practiceLoading}
                    className="primary-button"
                  >
                    {loading || practiceLoading ? 'Analyzing...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {visibleChunks.map((chunk, index) => (
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