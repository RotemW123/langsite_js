import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const FlashcardPractice = () => {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userTranslation, setUserTranslation] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
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

        const response = await fetch(
          `http://localhost:5000/api/flashcards/${languageId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch cards');

        const fetchedCards = await response.json();
        setCards(shuffleArray(fetchedCards));
      } catch (error) {
        console.error('Error fetching flashcards:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [languageId, navigate]);

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleCheck = () => {
    const currentCard = cards[currentCardIndex];
    const isCorrect = userTranslation.toLowerCase().trim() === 
                     currentCard.translation.toLowerCase().trim();
    
    setFeedback({
      isCorrect,
      message: isCorrect ? 'Correct!' : `Incorrect. The answer is: ${currentCard.translation}`
    });
    setIsFlipped(true); // Make sure this line is present
    console.log('Check clicked, setting isFlipped to true'); // Debug log
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
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
      setUserTranslation('');
      setFeedback(null);
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


  console.log('Current states:', {
    isFlipped,
    feedback,
    hasUserTranslation: !!userTranslation.trim()
  });


  return (
    <div className="max-w-2xl mx-auto p-6">
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
  
      {/* Card Container */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-center shadow-lg mb-6">
        <h3 className="text-3xl font-bold text-white mb-6">{currentCard.word}</h3>
        {!isFlipped && (
          <div className="bg-white/90 rounded-lg p-2">
            <input
              type="text"
              value={userTranslation}
              onChange={(e) => setUserTranslation(e.target.value)}
              placeholder="Enter translation"
              className="w-full p-3 border rounded-lg text-center text-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>
        )}
        {isFlipped && (
          <div className="text-white">
            <h3 className="text-3xl font-bold mb-4">{currentCard.translation}</h3>
            <p className="text-xl">
              Your answer: {userTranslation}
            </p>
            {feedback && (
              <p className={`mt-4 text-xl font-semibold ${
                feedback.isCorrect ? 'text-green-200' : 'text-red-200'
              }`}>
                {feedback.isCorrect ? 'Correct!' : 'Incorrect'}
              </p>
            )}
          </div>
        )}
      </div>
  
      {/* Buttons */}
      <div className="flex justify-center gap-4">
        {!isFlipped && (
          <button
            onClick={handleCheck}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700"
            disabled={!userTranslation.trim()}
          >
            Check Answer
          </button>
        )}
        {isFlipped && currentCardIndex < cards.length - 1 && (
          <button
            onClick={handleNext}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-green-800"
          >
            Next Card
          </button>
        )}
        {isFlipped && currentCardIndex === cards.length - 1 && (
          <button
            onClick={() => navigate(`/home/${languageId}`)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700"
          >
            Finish Practice
          </button>
        )}
      </div>
    </div>
  );
};

export default FlashcardPractice;