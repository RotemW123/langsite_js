// src/components/DeckDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../utils/api';

const DeckDetail = () => {
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { languageId, deckId } = useParams();

  useEffect(() => {
    fetchDeckDetails();
  }, [deckId]);

  const fetchDeckDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/decks/${languageId}/${deckId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch deck details');

      const data = await response.json();
      setDeck(data.deck);
      setCards(data.cards);
    } catch (error) {
      console.error('Error fetching deck details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!confirm('Are you sure you want to delete this card?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/flashcards/${cardId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to delete card');

      fetchDeckDetails();
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading deck...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <button
            onClick={() => navigate(`/practice/${languageId}`)}
            className="text-indigo-600 hover:text-indigo-800 mb-2"
          >
            ← Back to Decks
          </button>
          <h2 className="text-2xl font-bold text-indigo-600">{deck?.title}</h2>
        </div>
        <button
          onClick={() => navigate(`/practice/${languageId}/${deckId}`)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-indigo-700 hover:to-purple-700"
        >
          Start Practice
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card._id} className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg p-4 shadow-lg text-white">
            <div className="mb-3">
              <h4 className="font-semibold text-white/80 text-sm mb-1">Front:</h4>
              <p className="text-lg font-medium">{card.word}</p>
            </div>
            <div className="mb-3">
              <h4 className="font-semibold text-white/80 text-sm mb-1">Back:</h4>
              <p className="text-lg font-medium">{card.translation}</p>
            </div>
            <button
              onClick={() => handleDeleteCard(card._id)}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No cards in this deck yet.</p>
          <p className="text-gray-500 text-sm mt-2">
            Add cards while reading texts to build your deck!
          </p>
        </div>
      )}
    </div>
  );
};

export default DeckDetail;