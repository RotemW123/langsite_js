import React, { useState } from 'react';
import axios from 'axios';
import '../styles/modal.css';

function EditTextModal({ text, closeModal }) {
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
      await axios.put(
        `http://localhost:5000/api/text/${text._id}`,
        { title, content },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      closeModal(true);
    } catch (err) {
      console.error('Error updating text:', err);
      setError(err.response?.data?.message || 'Failed to update text');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2 style={{ marginBottom: '1.5rem' }}>Edit Text</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Enter title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <textarea
              placeholder="Write your text here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ height: '200px', resize: 'vertical' }}
              disabled={isSubmitting}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div className="modal-buttons">
            <button
              type="button"
              onClick={() => closeModal(false)}
              className="secondary-button"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTextModal;