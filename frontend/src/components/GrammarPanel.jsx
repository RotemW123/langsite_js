import React from 'react';

// Grammar features configuration for each language
const grammarConfig = {
  russian: {
    title: 'Russian Grammar Cases',
    features: [
      { id: 'nominative', name: 'Nominative Case' },
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
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-xl font-semibold mb-4">{config.title}</h3>
      
      <div className="space-y-2 mb-6">
        {config.features.map(feature => (
          <label 
            key={feature.id} 
            className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedFeatures[feature.id] || false}
              onChange={() => onFeatureToggle(feature.id)}
              disabled={isPracticing}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <span className="ml-2">{feature.name}</span>
          </label>
        ))}
      </div>

      <button 
        onClick={onPracticeClick}
        disabled={!Object.values(selectedFeatures).some(Boolean) || isLoading}
        className={`w-full py-2 px-4 rounded-lg text-white ${
          isPracticing 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-indigo-600 hover:bg-indigo-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isLoading ? 'Loading...' : 
         isPracticing ? 'Exit Practice Mode' : 
         'Practice Selected Features'}
      </button>
    </div>
  );
};

export default GrammarPanel;