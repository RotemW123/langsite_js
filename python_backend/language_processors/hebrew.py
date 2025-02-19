import trankit
import logging
import numpy as np
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class HebrewProcessor:
    def __init__(self):
        self.nlp = None
        try:
            self.initialize_models()
        except Exception as e:
            logger.error(f"Failed to initialize HebrewProcessor: {e}")
            raise

    def initialize_models(self):
        """Initialize Trankit model for Hebrew."""
        try:
            # Initialize the pipeline for Hebrew with specific configurations
            self.nlp = trankit.Pipeline('hebrew', cache_dir='./cache', gpu=False)
            self._test_pipeline()  # Test if pipeline works
        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            raise

    def _test_pipeline(self):
        """Test if pipeline works with a simple sentence."""
        try:
            test_text = "שלום"
            self.nlp(test_text)
        except Exception as e:
            logger.error(f"Pipeline test failed: {e}")
            raise

    def _safe_get_word_info(self, word: Dict) -> Dict:
        """Safely extract word information."""
        try:
            return {
                'text': word.get('text', ''),
                'lemma': word.get('lemma', word.get('text', '')),
                'upos': word.get('upos', ''),
                'feats': word.get('feats', ''),
                'dspan': word.get('dspan', (0, 0))
            }
        except Exception as e:
            logger.error(f"Error extracting word info: {e}")
            return {
                'text': word.get('text', ''),
                'lemma': word.get('text', ''),
                'upos': '',
                'feats': '',
                'dspan': (0, 0)
            }

    def is_plural(self, word_info: Dict) -> bool:
        """Check if a noun is plural based on morphological features."""
        try:
            if word_info['upos'] == 'NOUN':
                feats = word_info['feats']
                return 'Number=Plur' in feats
            return False
        except Exception as e:
            logger.error(f"Error checking plural for word {word_info.get('text', '')}: {e}")
            return False

    def get_verb_tense(self, word_info: Dict) -> Optional[str]:
        """Extract tense information from a verb token."""
        try:
            if word_info['upos'] != 'VERB':
                return None
                
            feats = word_info['feats']
            
            if 'Tense=Past' in feats:
                return 'past'
            elif 'Tense=Pres' in feats or 'VerbForm=Part' in feats:
                return 'present'
            elif 'Tense=Fut' in feats:
                return 'future'
            return None
        except Exception as e:
            logger.error(f"Error getting verb tense for word {word_info.get('text', '')}: {e}")
            return None

    def analyze_text(self, text: str, features: List[str]) -> Dict[str, Any]:
        """Analyze Hebrew text for specific grammatical features."""
        
        try:
            # Process the text with Trankit
            doc = self.nlp(text)
            words_to_practice = []
            
            for sent in doc['sentences']:
                for word in sent['tokens']:
                    word_info = self._safe_get_word_info(word)
                    
                    # Handle verb tenses
                    if any(feat in features for feat in ['past', 'present', 'future']):
                        tense = self.get_verb_tense(word_info)
                        if tense and tense in features:
                            words_to_practice.append({
                                'original': word_info['text'],
                                'display': word_info['lemma'],
                                'position': word_info['dspan'][0],
                                'length': word_info['dspan'][1] - word_info['dspan'][0],
                                'feature': tense
                            })
                            continue


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
            # Clean up the strings for comparison
            original_clean = original.strip()
            answer_clean = answer.strip()
            
            is_correct = original_clean == answer_clean
            
            message = 'נכון!' if is_correct else f'לא נכון. הצורה הנכונה היא "{original}"'
            
            # Add specific messages for different features
            if not is_correct:
                if feature in ['past', 'present', 'future']:
                    message += ' (צורת הפועל)'
                elif feature == 'plurals':
                    message += ' (צורת הרבים)'

            return {
                'correct': is_correct,
                'message': message
            }
        except Exception as e:
            logger.error(f"Error checking answer: {e}")
            raise

    def get_available_features(self) -> List[str]:
        """Return available grammatical features for Hebrew."""
        return [
            'past',      # עבר
            'present',   # הווה
            'future',    # עתיד
            'plurals'    # רבים
        ]