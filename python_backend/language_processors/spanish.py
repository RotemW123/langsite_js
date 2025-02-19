import spacy
import logging
from typing import List, Dict, Any, Optional, Tuple
import unicodedata

logger = logging.getLogger(__name__)

class SpanishProcessor:
    def __init__(self):
        self.nlp = None
        try:
            self.initialize_models()
        except Exception as e:
            logger.error(f"Failed to initialize SpanishProcessor: {e}")
            raise

    def initialize_models(self):
        """Initialize spaCy model."""
        self.nlp = spacy.load('es_core_news_lg')

    def get_infinitive(self, token) -> str:
        """Get the infinitive form of a verb."""
        return token.lemma_

    def remove_accents(self, text: str) -> str:
        """Remove diacritics from text while preserving base characters."""
        return ''.join(c for c in unicodedata.normalize('NFD', text)
                      if unicodedata.category(c) != 'Mn')

    def get_tense_aspect_mood(self, token) -> Dict[str, str]:
        """Extract tense, aspect, and mood information from a token."""
        morph = token.morph
        return {
            'Tense': morph.get('Tense', [''])[0],
            'Aspect': morph.get('Aspect', [''])[0],
            'Mood': morph.get('Mood', [''])[0],
            'VerbForm': morph.get('VerbForm', [''])[0]
        }

    def analyze_text(self, text: str, features: List[str]) -> Dict[str, Any]:
        """Analyze Spanish text for specific grammatical features."""
        
        try:
            doc = self.nlp(text)
            words_to_practice = []

            for i, token in enumerate(doc):
                properties = self.get_tense_aspect_mood(token)
                logger.debug(f"Token: {token.text}, Properties: {properties}")

                # Skip non-verbs unless checking for specific constructions
                if token.pos_ not in ['VERB', 'AUX']:
                    continue

                detected_feature = None

                # Simple Present
                if ('simple_present' in features and 
                    properties['Tense'] == 'Pres' and 
                    properties['Mood'] == 'Ind' and
                    properties['VerbForm'] == 'Fin'):
                    detected_feature = 'simple_present'
                
                # Present Continuous
                elif 'present_continuous' in features:
                    # Check for estar + gerund
                    if (token.lemma_ == 'estar' and 
                        i + 1 < len(doc) and 
                        doc[i + 1].morph.get('VerbForm', [''])[0] == 'Ger'):
                        # Only add the gerund part
                        words_to_practice.append({
                            'original': doc[i + 1].text,
                            'display': doc[i + 1].lemma_,
                            'position': doc[i + 1].idx,
                            'length': len(doc[i + 1].text),
                            'feature': 'present_continuous'
                        })
                        continue
                
                # Imperfect
                elif ('imperfect' in features and 
                      properties['Tense'] == 'Imp' and 
                      properties['Mood'] == 'Ind'):
                    detected_feature = 'imperfect'
                
                # Preterite
                elif ('preterite' in features and 
                      properties['Tense'] == 'Past' and 
                      properties['Aspect'] == 'Perf'):
                    detected_feature = 'preterite'
                
                # Present Perfect
                elif 'present_perfect' in features:
                    if (token.lemma_ == 'haber' and 
                        i + 1 < len(doc) and 
                        doc[i + 1].morph.get('VerbForm', [''])[0] == 'Part'):
                        words_to_practice.append({
                            'original': token.text,
                            'display': 'haber',
                            'position': token.idx,
                            'length': len(token.text),
                            'feature': 'present_perfect_aux'
                        })
                        words_to_practice.append({
                            'original': doc[i + 1].text,
                            'display': doc[i + 1].lemma_,
                            'position': doc[i + 1].idx,
                            'length': len(doc[i + 1].text),
                            'feature': 'present_perfect_main'
                        })
                        continue
                
                # Simple Future
                elif ('simple_future' in features and 
                      properties['Tense'] == 'Fut'):
                    detected_feature = 'simple_future'
                
                # Conditional
                elif ('conditional' in features and 
                      properties['Mood'] == 'Cnd'):
                    detected_feature = 'conditional'
                
                # Present Subjunctive
                elif ('present_subjunctive' in features and 
                      properties['Mood'] == 'Sub' and 
                      properties['Tense'] == 'Pres'):
                    detected_feature = 'present_subjunctive'

                if detected_feature:
                    words_to_practice.append({
                        'original': token.text,
                        'display': self.get_infinitive(token),
                        'position': token.idx,
                        'length': len(token.text),
                        'feature': detected_feature
                    })

            return {
                'text': text,
                'words': words_to_practice
            }

        except Exception as e:
            logger.error(f"Error analyzing text: {e}")
            raise

    def check_answer(self, original: str, answer: str, feature: str) -> Dict[str, Any]:
        """Check if the answer matches the original conjugated form."""
        try:
            # Remove accents from both original and answer for comparison
            original_clean = self.remove_accents(original.lower().strip())
            answer_clean = self.remove_accents(answer.lower().strip())
            
            is_correct = original_clean == answer_clean
            message = 'Correct!' if is_correct else f'Incorrect. The correct form is "{original}"'

            # Add specific messages for different features
            if not is_correct:
                if feature == 'present_perfect_aux':
                    message += ' (conjugated form of haber)'
                elif feature == 'present_perfect_main':
                    message += ' (past participle)'
                elif feature == 'present_continuous':
                    message += ' (gerund form)'

            return {
                'correct': is_correct,
                'message': message
            }
        except Exception as e:
            logger.error(f"Error checking answer: {e}")
            raise

    def get_available_features(self) -> List[str]:
        """Return available grammatical features for Spanish."""
        return [
            'simple_present',
            'present_continuous',
            'imperfect',
            'preterite',
            'present_perfect',
            'simple_future',
            'conditional',
            'present_subjunctive'
        ]