import React from 'react';

const LanguageSelection = () => {
  const languages = [
    { id: 'russian', name: 'Russian', icon: '🇷🇺' },
    { id: 'spanish', name: 'Spanish', icon: '🇪🇸' },
    { id: 'french', name: 'French', icon: '🇫🇷' },
    { id: 'hebrew', name: 'Hebrew', icon: '🇮🇱' },
    { id: 'german', name: 'German', icon: '🇩🇪' }
  ];

  const handleLanguageSelect = (languageId) => {
    // Since we can't use react-router directly, we'll use window.location
    window.location.href = `/home/${languageId}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-gradient-to-r from-indigo-600 to-pink-500 rounded-xl p-8 mb-8 text-center text-white">
        <h1 className="text-4xl font-bold mb-4">Choose Your Language</h1>
        <p className="text-xl opacity-90">Select the language you want to practice</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {languages.map((language) => (
          <button
            key={language.id}
            onClick={() => handleLanguageSelect(language.id)}
            className="flex items-center justify-center gap-3 p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
          >
            <span className="text-4xl">{language.icon}</span>
            <span className="text-xl font-semibold">{language.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelection;