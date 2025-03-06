import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { API_URL } from '../utils/api';


const TrashIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);

const FlashcardPractice = () => {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userTranslation, setUserTranslation] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteMessage, setDeleteMessage] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { deckId } = useParams();
  const navigate = useNavigate();
  
  const languageId = window.location.pathname.split('/')[2];



  useEffect(() => {
    const fetchCards = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/signin');
          return;
        }

        // Update URL to include deckId if provided
        const url = deckId 
          ? `${API_URL}/api/decks/${languageId}/${deckId}`
          : `${API_URL}/api/flashcards/${languageId}`;

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch cards');

        const data = await response.json();
        // If practicing a specific deck, use cards from deck data
        const fetchedCards = deckId ? data.cards : data;
        setCards(shuffleArray(fetchedCards));
      } catch (error) {
        console.error('Error fetching flashcards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [languageId, deckId, navigate]);

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentCard = cards[currentCardIndex];
      
      const response = await fetch(
        `${API_URL}/api/flashcards/${currentCard._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to delete card');

      // Show delete message
      setDeleteMessage(true);
      
      // Hide message after 2 seconds
      setTimeout(() => {
        setDeleteMessage(false);
        
        // Remove the card from the state
        setCards(prevCards => prevCards.filter((_, index) => index !== currentCardIndex));
        
        // Adjust current index if needed
        if (currentCardIndex === cards.length - 1) {
          setCurrentCardIndex(Math.max(0, currentCardIndex - 1));
        }
      }, 2000);

    } catch (error) {
      console.error('Error deleting flashcard:', error);
    }
  };

  const handleCheck = () => {
    const currentCard = cards[currentCardIndex];
    const isCorrect = userTranslation.toLowerCase().trim() === 
                     currentCard.translation.toLowerCase().trim();
    
    setFeedback({
      isCorrect,
      message: isCorrect ? 'Correct!' : `Incorrect. The answer is: ${currentCard.translation}`
    });
    setIsFlipped(true);
  };

  const handleNext = async () => {
    try {
      const token = localStorage.getItem('token');
      const currentCard = cards[currentCardIndex];
      await fetch(`http://localhost:5000/api/flashcards/${currentCard._id}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confidenceLevel: feedback?.isCorrect ? 1 : 0
        })
      });
    } catch (error) {
      console.error('Error updating card review status:', error);
    }

    if (currentCardIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex(prev => prev + 1);
        setUserTranslation('');
        setFeedback(null);
      }, 500);
    } else {
      setFeedback({
        isCorrect: true,
        message: 'Practice session completed!'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-indigo-600">Loading flashcards...</div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">No Flashcards Yet</h2>
        <p className="text-gray-600 mb-6">
          You haven't created any flashcards for this language yet. 
          Add some while reading texts!
        </p>
        <button
          onClick={() => navigate(`/home/${languageId}`)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700"
        >
          Back to Texts
        </button>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <style>
        {`
          @keyframes flip-out {
            0% {
              transform: perspective(1000px) rotateY(0) translateX(0) translateY(0);
            }
            100% {
              transform: perspective(1000px) rotateY(-180deg) translateX(-100px) translateY(-20px);
            }
          }

          @keyframes flip-in {
            0% {
              transform: perspective(1000px) rotateY(180deg) translateX(100px) translateY(20px);
            }
            100% {
              transform: perspective(1000px) rotateY(0) translateX(0) translateY(0);
            }
          }

          .card-face {
            position: absolute;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            transform-origin: left top;
          }

          .card-front {
            transform: ${isFlipped ? 'rotateY(-180deg) translateX(-100px) translateY(-20px)' : 'rotateY(0) translateX(0) translateY(0)'};
            animation: ${isMounted ? (isFlipped ? 'flip-out' : 'flip-in') : 'none'} 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }

          .card-back {
            transform: ${!isFlipped ? 'rotateY(180deg) translateX(100px) translateY(20px)' : 'rotateY(0) translateX(0) translateY(0)'};
            animation: ${isMounted ? (isFlipped ? 'flip-in' : 'flip-out') : 'none'} 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          }
        `}
      </style>

      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => navigate(`/home/${languageId}`)}
          className="text-indigo-600 hover:text-indigo-800"
        >
          ← Back to Texts
        </button>
        <div className="text-gray-600">
          Card {currentCardIndex + 1} of {cards.length}
        </div>
      </div>

      {deleteMessage && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg">
          Card deleted!
        </div>
      )}
  
      {/* Card Container */}
      <div className="h-96 max-w-lg mx-auto mb-6 perspective-1000">
        <div className="relative w-full h-full">
          {/* Front of Card */}
          <div className={`card-face card-front ${isFlipped ? 'pointer-events-none' : ''}`}>
            <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-center shadow-lg flex flex-col">
              <div className="flex-1 flex items-center justify-center">
                <h3 className="text-4xl font-bold text-white">{currentCard.word}</h3>
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  value={userTranslation}
                  onChange={(e) => setUserTranslation(e.target.value)}
                  placeholder="Type the translation here..."
                  className="w-full p-3 bg-white border rounded-lg text-center text-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                />
              </div>
            </div>
          </div>
          
          {/* Back of Card */}
          <div className={`card-face card-back ${!isFlipped ? 'pointer-events-none' : ''}`}>
            <div className="w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-center shadow-lg flex flex-col justify-center">
              <h3 className="text-4xl font-bold text-white mb-8">{currentCard.translation}</h3>
              <p className="text-xl text-white mb-4">
                Your answer: {userTranslation}
              </p>
              {feedback && (
                <p className={`text-2xl font-semibold ${
                  feedback.isCorrect ? 'text-green-200' : 'text-red-200'
                }`}>
                  {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
  
      {/* Buttons */}
      <div className="flex justify-center gap-4">
        {!isFlipped ? (
          <>
            <button
              onClick={handleCheck}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700"
              disabled={!userTranslation.trim()}
            >
              Check Answer
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
              title="Delete this card"
            >
              <TrashIcon />
            </button>
          </>
        ) : (
          <>
            {currentCardIndex < cards.length - 1 ? (
              <button
                onClick={handleNext}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800"
              >
                Next Card
              </button>
            ) : (
              <button
                onClick={() => navigate(`/home/${languageId}`)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700"
              >
                Finish Practice
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};


export default FlashcardPractice;