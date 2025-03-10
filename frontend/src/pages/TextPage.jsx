import React, { useState, useEffect } from 'react';
import EditTextModal from '../components/EditTextModal';
import GrammarPanel from '../components/GrammarPanel';
import { AddToFlashcardsButton, FlashcardCreationDialog } from '../components/FlashcardComponents';
import TextContainer from '../components/TextContainer';
import { API_URL } from '../utils/api';

// Define PYTHON_API_URL if it doesn't exist elsewhere
const PYTHON_API_URL = process.env.REACT_APP_PYTHON_API_URL || 'http://localhost:5000';

const TextPage = () => {
  // Get IDs from URL
  const pathParts = window.location.pathname.split('/');
  const languageId = pathParts[2];
  const textId = pathParts[3];

  // State for text content
  const [title, setTitle] = useState('');
  const [chunks, setChunks] = useState([]);
  const [visibleChunks, setVisibleChunks] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);

  // Practice state
  const [selectedFeatures, setSelectedFeatures] = useState({});
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceWords, setPracticeWords] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [practiceLoading, setPracticeLoading] = useState(false);

  const [selectedWord, setSelectedWord] = useState(null);
  const [showCardDialog, setShowCardDialog] = useState(false);

  const rtlLanguages = ['arabic', 'hebrew'];
  const isRTL = (languageId) => rtlLanguages.includes(languageId);

  // Language names mapping
  const languageNames = {
    russian: 'Russian',
    spanish: 'Spanish',
    french: 'French',
    hebrew: 'Hebrew',
    german: 'German',
    arabic: 'Arabic'
  };


  const analyzeChunk = async (chunk, prevChunksLength = 0) => {
    const selectedFeaturesList = Object.entries(selectedFeatures)
      .filter(([_, isSelected]) => isSelected)
      .map(([featureId]) => featureId);

    const response = await fetch(`${PYTHON_API_URL}/analyze/${languageId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: chunk.content,
        features: selectedFeaturesList
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze text');
    }

    const data = await response.json();
    // Calculate offset based on the provided previous chunks length
    return data.words.map(word => ({
      ...word,
      position: word.position + prevChunksLength
    }));
  };

  const fetchChunks = async (page) => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/signin';
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/text/${languageId}/${textId}/chunks?page=${page}`,
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
      const nextChunk = data.chunks[0];

      if (practiceMode) {
        setPracticeLoading(true);
        try {
          // Calculate the total length of previous chunks for offset
          const prevChunksLength = chunks.reduce((acc, chunk) => acc + chunk.content.length, 0);
          const analyzedWords = await analyzeChunk(nextChunk, prevChunksLength);

          if (page === 0) {
            setChunks([nextChunk]);
            setPracticeWords(analyzedWords);
            setVisibleChunks([nextChunk]);
            setTitle(data.title);
          } else {
            setChunks(prev => [...prev, nextChunk]);
            setPracticeWords(prev => [...prev, ...analyzedWords]);
            setVisibleChunks(prev => [...prev, nextChunk]);
          }
        } catch (err) {
          console.error('Error analyzing chunk:', err);
          setError('Failed to analyze chunk');
          return;
        } finally {
          setPracticeLoading(false);
        }
      } else {
        if (page === 0) {
          setChunks([nextChunk]);
          setVisibleChunks([nextChunk]);
          setTitle(data.title);
        } else {
          setChunks(prev => [...prev, nextChunk]);
          setVisibleChunks(prev => [...prev, nextChunk]);
        }
      }

      setHasMore(data.hasMore);
      setCurrentPage(data.currentPage);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to load text');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePracticeClick = async () => {
    if (practiceMode) {
      setPracticeMode(false);
      setPracticeWords([]);
      setUserAnswers({});
      setFeedback({});
      setVisibleChunks(chunks);
      return;
    }

    const selectedFeaturesList = Object.entries(selectedFeatures)
      .filter(([_, isSelected]) => isSelected)
      .map(([featureId]) => featureId);

    if (selectedFeaturesList.length === 0) {
      alert('Please select at least one grammar feature to practice');
      return;
    }

    try {
      setPracticeLoading(true);
      const analyzedWords = await analyzeChunk(chunks[0], 0);
      setPracticeMode(true);
      setPracticeWords(analyzedWords);
      setVisibleChunks([chunks[0]]);
    } catch (err) {
      console.error('Error starting practice:', err);
      setError('Failed to analyze text for practice');
    } finally {
      setPracticeLoading(false);
    }
  };


  useEffect(() => {
    fetchChunks(0);
  }, [languageId, textId]);

  const handleFeatureToggle = (featureId) => {
    setSelectedFeatures(prev => ({
      ...prev,
      [featureId]: !prev[featureId]
    }));
  };

  

  const handleLoadMore = async () => {
    if (!hasMore || loading || practiceLoading) return;
    await fetchChunks(currentPage + 1);
  };
  
  const handleAnswerCheck = async (wordId) => {
    try {
      const word = practiceWords[wordId];
      const response = await fetch(`${PYTHON_API_URL}/check/${languageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original: word.original,
          answer: userAnswers[wordId],
          feature: word.feature
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
    if (!visibleChunks.length || !Array.isArray(practiceWords)) return null;

    const fullText = visibleChunks.map(chunk => chunk.content).join('');
    const elements = [];
    let lastIndex = 0;

    practiceWords.forEach((word, index) => {
      // Add text before the practice word
      elements.push(
        <span key={`text-${index}`}>
          {fullText.slice(lastIndex, word.position)}
        </span>
      );

      // Add practice word with input (note: we're using position + original.length for lastIndex)
      elements.push(
        <span key={`practice-${index}`} className="inline-flex items-center gap-2">
          <input
            type="text"
            value={userAnswers[index] || ''}
            onChange={(e) => setUserAnswers(prev => ({
              ...prev,
              [index]: e.target.value
            }))}
            className={`w-32 px-2 py-1 border rounded focus:ring-2 focus:ring-indigo-500 
              ${feedback[index]?.correct ? 'border-green-500 bg-green-50' : 
                feedback[index]?.correct === false ? 'border-red-500 bg-red-50' : 
                'border-gray-300'}`}
            placeholder={word.display}
          />
          <button
            onClick={() => handleAnswerCheck(index)}
            className="px-2 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Check
          </button>
          {feedback[index] && (
            <span className={`text-sm ${feedback[index].correct ? 'text-green-600' : 'text-red-600'}`}>
              {feedback[index].message}
            </span>
          )}
        </span>
      );

      lastIndex = word.position + word.original.length;
    });

    // Add remaining text
    elements.push(
      <span key="text-end">
        {fullText.slice(lastIndex)}
      </span>
    );

    return (
      <div className={`space-y-4 ${isRTL(languageId) ? 'rtl' : 'ltr'}`} dir={isRTL(languageId) ? 'rtl' : 'ltr'}>
        {elements}
      </div>
    );
  };

  if (loading && chunks.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-indigo-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
       <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => window.location.href = `/home/${languageId}`}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
          >
            ← Back to {languageNames[languageId]} Texts
          </button>
          <div className="space-x-4">
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200"
            >
              Edit
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this text?')) {
                  // Handle delete
                }
              }}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
            >
              Delete
            </button>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-indigo-600">{title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {practiceMode ? renderPracticeText() : (
            <TextContainer isRTL={isRTL(languageId)}>
              <div className="w-full" dir={isRTL(languageId) ? 'rtl' : 'ltr'}>
                {visibleChunks.map((chunk, index) => (
                  <p key={index} className="w-full">
                    {chunk.content.split(/(\s+)/).map((word, wordIndex) => {
                      // Skip rendering buttons for spaces/punctuation
                      if (/^\s+$/.test(word)) return word;
                      
                      return (
                        <span key={wordIndex} className="relative inline-flex items-center whitespace-normal">
                          <span
                            className="cursor-pointer hover:bg-blue-100 px-0.5 rounded"
                            onClick={() => setSelectedWord(word)}
                          >
                            {word}
                          </span>
                          {selectedWord === word && (
                            <AddToFlashcardsButton
                              word={word}
                              onAdd={() => setShowCardDialog(true)}
                            />
                          )}
                        </span>
                      );
                    })}
                  </p>
                ))}
              </div>
            </TextContainer>
          )}

          <FlashcardCreationDialog
            word={selectedWord}
            isOpen={showCardDialog}
            onClose={() => {
              setShowCardDialog(false);
              setSelectedWord(null);
            }}
            onSave={async (cardData) => {
              try {
                const response = await fetch(`${API_URL}/api/flashcards/${languageId}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify(cardData)
                });
                
                if (response.ok) {
                } else {
                  console.error('Failed to create card');
                }
              } catch (error) {
                console.error('Error creating flashcard:', error);
              } finally {
                setShowCardDialog(false);
                setSelectedWord(null);
              }
            }}
          />

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loading || practiceLoading}
                className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading || practiceLoading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <GrammarPanel
            languageId={languageId}
            selectedFeatures={selectedFeatures}
            onFeatureToggle={handleFeatureToggle}
            onPracticeClick={handlePracticeClick}
            isPracticing={practiceMode}
            isLoading={practiceLoading}
          />
        </div>
      </div>

      {showEditModal && (
        <EditTextModal
          text={{ _id: textId, title, content: chunks.map(c => c.content).join('') }}
          languageId={languageId}
          closeModal={(success) => {
            setShowEditModal(false);
            if (success) fetchChunks(0);
          }}
        />
      )}
    </div>
  );
};

export default TextPage;