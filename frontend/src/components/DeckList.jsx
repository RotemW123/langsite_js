// src/components/DeckList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URL } from '../utils/api';


const DeckList = () => {
  const [decks, setDecks] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { languageId } = useParams();

  useEffect(() => {
    fetchDecks();
  }, [languageId]);

  const fetchDecks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/decks/${languageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch decks');

      const data = await response.json();
      setDecks(data);
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeck = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/decks/${languageId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newDeckTitle })
      });

      if (!response.ok) throw new Error('Failed to create deck');

      setShowCreateModal(false);
      setNewDeckTitle('');
      fetchDecks();
    } catch (error) {
      console.error('Error creating deck:', error);
    }
  };

  const handleDeleteDeck = async (deckId) => {
    if (!confirm('Are you sure you want to delete this deck and all its cards?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/decks/${deckId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete deck');

      fetchDecks();
    } catch (error) {
      console.error('Error deleting deck:', error);
    }
  };

  if (loading) {
    return <div className="text-center mt-8">Loading decks...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-4">
        <button
          onClick={() => navigate(`/home/${languageId}`)}
          className="text-indigo-600 hover:text-indigo-800 mb-4"
        >
          ← Back to Language Home
        </button>
      </div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-indigo-600">Your Flashcard Decks</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg"
        >
          Create New Deck
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {decks.map((deck) => (
          <div key={deck._id} className="bg-white rounded-lg p-6 shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold mb-2 text-indigo-600">{deck.title}</h3>
            <p className="text-gray-600 mb-4">{deck.cardCount} cards</p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/deck/${languageId}/${deck._id}`)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg flex-1"
              >
                View Deck
              </button>
              <button
                onClick={() => handleDeleteDeck(deck._id)}
                className="bg-red-600 text-white px-3 py-2 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Create New Deck</h3>
            <input
              type="text"
              value={newDeckTitle}
              onChange={(e) => setNewDeckTitle(e.target.value)}
              placeholder="Enter deck title"
              className="w-full p-2 border rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDeck}
                disabled={!newDeckTitle.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckList;