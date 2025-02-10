import React from 'react';

const grammarConfig = {
  russian: {
    title: 'Russian Grammar Cases',
    features: [
      { id: 'genitive', name: 'Genitive Case' },
      { id: 'dative', name: 'Dative Case' },
      { id: 'accusative', name: 'Accusative Case' },
      { id: 'instrumental', name: 'Instrumental Case' },
      { id: 'prepositional', name: 'Prepositional Case' }
    ]
  },
  spanish: {
    title: 'Spanish Grammar',
    features: [
      { id: 'present', name: 'Present Tense' },
      { id: 'preterite', name: 'Preterite Tense' },
      { id: 'imperfect', name: 'Imperfect Tense' },
      { id: 'subjunctive', name: 'Subjunctive Mood' }
    ]
  },
  french: {
    title: 'French Grammar',
    features: [
      { id: 'present', name: 'Present Tense' },
      { id: 'passe_compose', name: 'Passé Composé' },
      { id: 'imparfait', name: 'Imparfait' },
      { id: 'subjonctif', name: 'Subjonctif' }
    ]
  },
  german: {
    title: 'German Grammar',
    features: [
      { id: 'nominativ', name: 'Nominativ' },
      { id: 'akkusativ', name: 'Akkusativ' },
      { id: 'dativ', name: 'Dativ' },
      { id: 'genitiv', name: 'Genitiv' }
    ]
  },
  hebrew: {
    title: 'Hebrew Grammar',
    features: [
      { id: 'present', name: 'Present Tense' },
      { id: 'past', name: 'Past Tense' },
      { id: 'future', name: 'Future Tense' },
      { id: 'binyanim', name: 'Binyanim' }
    ]
  }
};

const GrammarPanel = ({ 
  languageId, 
  selectedFeatures, 
  onFeatureToggle, 
  onPracticeClick, 
  isPracticing,
  isLoading 
}) => {
  const config = grammarConfig[languageId] || { title: 'Grammar Features', features: [] };

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-6">{config.title}</h3>
      
      <div className="space-y-3 mb-6">
        {config.features.map(feature => (
          <label 
            key={feature.id} 
            className="flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/10 bg-white/5"
          >
            <input
              type="checkbox"
              checked={selectedFeatures[feature.id] || false}
              onChange={() => onFeatureToggle(feature.id)}
              disabled={isPracticing}
              className="w-4 h-4 text-indigo-600 border-white/30 rounded focus:ring-offset-2 focus:ring-offset-indigo-600 focus:ring-white bg-white/20"
            />
            <span className="ml-3 text-white font-medium">{feature.name}</span>
          </label>
        ))}
      </div>

      <button 
          onClick={onPracticeClick}
          disabled={!Object.values(selectedFeatures).some(Boolean) || isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
            ${isPracticing 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow`}
        >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </div>
        ) : isPracticing ? (
          'Exit Practice Mode'
        ) : (
          'Practice Selected Features'
        )}
      </button>
    </div>
  );
};

export default GrammarPanel;