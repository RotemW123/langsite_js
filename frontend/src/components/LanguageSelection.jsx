import React from 'react';

const LanguageSelection = () => {
  const languages = [
    { id: 'russian', name: 'Russian', icon: '🇷🇺', gradient: 'from-blue-500 to-red-500' },
    { id: 'spanish', name: 'Spanish', icon: '🇪🇸', gradient: 'from-yellow-500 to-red-500' },
    { id: 'french', name: 'French', icon: '🇫🇷', gradient: 'from-blue-500 to-red-500' },
    { id: 'hebrew', name: 'Hebrew', icon: '🇮🇱', gradient: 'from-blue-500 to-white' },
    { id: 'german', name: 'German', icon: '🇩🇪', gradient: 'from-black to-red-500' },
    { id: 'arabic', name: 'Arabic', icon: '🇸🇦', gradient: 'from-green-500 to-white' }
  ];

  const handleLanguageSelect = (languageId) => {
    window.location.href = `/home/${languageId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Language Journey
          </h1>
          <p className="text-xl text-gray-600">
            Select a language and start your learning adventure
          </p>
        </div>

        {/* Language Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {languages.map((language) => (
            <button
              key={language.id}
              onClick={() => handleLanguageSelect(language.id)}
              className="group relative w-full"
            >
              <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                {/* Background Gradient Overlay */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${language.gradient}`} />
                
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-6xl mb-4 transition-transform duration-300 transform group-hover:scale-110">
                    {language.icon}
                  </span>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    {language.name}
                  </h3>
                  <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full mt-2 transition-all duration-300 transform origin-left group-hover:w-24" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-600">
            Ready to start learning? Choose your preferred language above
          </p>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelection;