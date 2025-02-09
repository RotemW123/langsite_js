import React, { useState } from 'react';

const EditTextModal = ({ text, languageId, closeModal }) => {
  const [title, setTitle] = useState(text.title);
  const [content, setContent] = useState(text.content);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication token not found. Please sign in again.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/text/${languageId}/${text._id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title, content })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update text');
      }
      
      closeModal(true);
    } catch (err) {
      console.error('Error updating text:', err);
      setError(err.response?.data?.message || 'Failed to update text');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Edit Text</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <textarea
              placeholder="Write your text here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-64 p-2 border rounded-lg resize-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSubmitting}
              required
            />
          </div>
          
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => closeModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTextModal;