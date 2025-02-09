import spacy
import pymorphy3
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class RussianProcessor:
    def __init__(self):
        logger.info("Initializing RussianProcessor")
        self.nlp = None
        self.morph = None
        try:
            self.initialize_models()
            logger.info("Successfully initialized RussianProcessor")
        except Exception as e:
            logger.error(f"Failed to initialize RussianProcessor: {e}")
            raise
        
    def initialize_models(self):
        """Initialize spaCy and pymorphy models."""
        logger.info("Loading spaCy model...")
        self.nlp = spacy.load('ru_core_news_lg')
        logger.info("Loading pymorphy...")
        self.morph = pymorphy3.MorphAnalyzer()
        logger.info("Models loaded successfully")
        
    def get_case(self, token) -> Optional[str]:
        """Extract grammatical case from a token."""
        try:
            # Skip non-word characters
            if not any(char.isalpha() for char in token.text):
                return None

            case_mapping = {
                'nom': 'nominative',
                'gen': 'genitive',
                'dat': 'dative',
                'acc': 'accusative',
                'abl': 'instrumental',
                'loc': 'prepositional',
                'nomn': 'nominative',
                'gent': 'genitive',
                'datv': 'dative',
                'accs': 'accusative',
                'ablt': 'instrumental',
                'loct': 'prepositional'
            }

            # Try spaCy first
            spacy_case = token.morph.get('Case')
            if spacy_case:
                abbreviated_case = spacy_case[0].lower()
                full_case = case_mapping.get(abbreviated_case)
                if full_case:
                    logger.debug(f"SpaCy case for {token.text}: {full_case}")
                    return full_case

            # Try pymorphy3 as backup
            parsed = self.morph.parse(token.text)[0]
            if parsed and parsed.tag and hasattr(parsed.tag, 'case'):
                full_case = case_mapping.get(parsed.tag.case)
                if full_case:
                    logger.debug(f"Pymorphy case for {token.text}: {full_case}")
                    return full_case

            return None
        except Exception as e:
            logger.error(f"Error getting case for token {token.text}: {e}")
            return None
        
    def analyze_text(self, text: str, features: List[str]) -> Dict[str, Any]:
        """Analyze Russian text for specific cases."""
        logger.info(f"Analyzing text with features: {features}")
        logger.debug(f"Text to analyze: {text[:100]}...")  # Log first 100 chars
        
        try:
            doc = self.nlp(text)
            words_to_practice = []
            
            for token in doc:
                case = self.get_case(token)
                if case and case in features:
                    words_to_practice.append({
                        'original': token.text,
                        'position': token.idx,
                        'length': len(token.text),
                        'feature': case
                    })
            
            logger.info(f"Found {len(words_to_practice)} words to practice")
            return {
                'text': text,
                'words': words_to_practice
            }
        except Exception as e:
            logger.error(f"Error analyzing text: {e}")
            raise
        
    def check_answer(self, original: str, answer: str, feature: str) -> Dict[str, Any]:
        """Check if the answer matches the original form."""
        try:
            is_correct = answer.lower() == original.lower()
            logger.debug(f"Checking answer - Original: {original}, Answer: {answer}, Feature: {feature}")
            return {
                'correct': is_correct,
                'message': 'Correct!' if is_correct else f'Incorrect. The word should be "{original}"'
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