import spacy
import pymorphy3
import stanza
from typing import List, Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class RussianProcessor:
    def __init__(self):
        self.nlp_spacy = None
        self.nlp_stanza = None
        self.morph = None
        try:
            self.initialize_models()
        except Exception as e:
            logger.error(f"Failed to initialize RussianProcessor: {e}")
            raise
        
    def initialize_models(self):
        """Initialize spaCy, stanza, and pymorphy models."""
        self.nlp_spacy = spacy.load('ru_core_news_lg')

    def get_nominative_form(self, word: str) -> str:
        """Get the nominative form of a word using pymorphy3."""
        try:
            parsed = self.morph.parse(word)[0]
            nom_form = parsed.inflect({'nomn'})
            return nom_form.word if nom_form else word
        except Exception as e:
            logger.error(f"Error getting nominative form for {word}: {e}")
            return word

    def get_case(self, word: str, position: int, doc_spacy) -> Dict[str, int]:
        """Get case votes from all three models."""
        case_mapping = {
            'nom': 'nominative', 'gen': 'genitive', 'dat': 'dative',
            'acc': 'accusative', 'abl': 'instrumental', 'loc': 'prepositional',
            'nomn': 'nominative', 'gent': 'genitive', 'datv': 'dative',
            'accs': 'accusative', 'ablt': 'instrumental', 'loct': 'prepositional',
            'ins': 'instrumental'
        }
        
        votes = {
            'nominative': 0, 'genitive': 0, 'dative': 0,
            'accusative': 0, 'instrumental': 0, 'prepositional': 0
        }

        token_spacy = [t for t in doc_spacy if t.idx == position][0]

        spacy_case = token_spacy.morph.get('Case')
        if spacy_case:
            case = case_mapping.get(spacy_case[0].lower())
            return case


    def analyze_text(self, text: str, features: List[str]) -> Dict[str, Any]:
        """Analyze Russian text for specific cases with multi-model voting."""
        try:
            # Process text with both models
            doc_spacy = self.nlp_spacy(text)
            
            words_to_practice = []
            
            for token in doc_spacy:
                if not any(char.isalpha() for char in token.text):
                    continue

                case = self.get_case(token.text, token.idx, doc_spacy)
                

                if case and case in features:
                    # Get nominative form for display
                    nominative_form = self.get_nominative_form(token.text)
                    
                    words_to_practice.append({
                        'original': token.text,  # Keep original declined form for checking
                        'display': nominative_form,  # Add nominative form for display
                        'position': token.idx,
                        'length': len(token.text),
                        'feature': case
                    })
            
            return {
                'text': text,
                'words': words_to_practice
            }
        except Exception as e:
            logger.error(f"Error analyzing text: {e}")
            raise
        
    def check_answer(self, original: str, answer: str, feature: str) -> Dict[str, Any]:
        """Check if the answer matches the original declined form."""
        try:
            # Compare with the original declined form
            is_correct = answer.lower() == original.lower()
            return {
                'correct': is_correct,
                'message': 'Correct!' if is_correct else f'Incorrect. The correct declined form is "{original}"'
            }
        except Exception as e:
            logger.error(f"Error checking answer: {e}")
            raise
        
    def get_available_features(self) -> List[str]:
        """Return available grammatical cases for Russian."""
        return [
            'nominative',
            'genitive',
            'dative',
            'accusative',
            'instrumental',
            'prepositional'
        ]