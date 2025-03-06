// src/components/FlashcardComponents.jsx
import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';



export const AddToFlashcardsButton = ({ word, onAdd }) => (
  <button
    onClick={onAdd}
    className="ml-2 px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
  >
    Add as Card
  </button>
);

export const FlashcardCreationDialog = ({ word, isOpen, onClose, onSave }) => {
  const [translation, setTranslation] = useState('');
  const [selectedDeckId, setSelectedDeckId] = useState('');
  const [decks, setDecks] = useState([]);
  const languageId = window.location.pathname.split('/')[2];

  useEffect(() => {
    if (isOpen) {
      setTranslation('');
      fetchDecks();
    }
  }, [isOpen]);

  const fetchDecks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/decks/${languageId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch decks');

      const data = await response.json();
      setDecks(data);
      // Set default deck if exists
      if (data.length > 0) {
        setSelectedDeckId(data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
    }
  };

  const handleSave = () => {
    onSave({ 
      word, 
      translation,
      deckId: selectedDeckId
    });
    onClose();
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-lg font-bold mb-4">Add New Flashcard</div>
        
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-center shadow-lg mb-4">
          <h3 className="text-2xl font-bold text-white mb-4">{word}</h3>
          <input
            type="text"
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            placeholder="Enter translation"
            className="w-full p-3 border rounded-lg text-center text-xl bg-white/90 mb-4"
            autoFocus
          />
          
          <select
            value={selectedDeckId}
            onChange={(e) => setSelectedDeckId(e.target.value)}
            className="w-full p-3 border rounded-lg text-center bg-white/90"
          >
            {decks.map(deck => (
              <option key={deck._id} value={deck._id}>
                {deck.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!translation.trim() || !selectedDeckId}
            className="px-4 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50"
          >
            Save Card
          </button>
        </div>
      </div>
    </div>
  );
};
