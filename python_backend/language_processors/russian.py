import spacy
import pymorphy3
import stanza
from typing import List, Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class RussianProcessor:
    def __init__(self):
        logger.info("Initializing RussianProcessor")
        self.nlp_spacy = None
        self.nlp_stanza = None
        self.morph = None
        try:
            self.initialize_models()
            logger.info("Successfully initialized RussianProcessor")
        except Exception as e:
            logger.error(f"Failed to initialize RussianProcessor: {e}")
            raise
        
    def initialize_models(self):
        """Initialize spaCy, stanza, and pymorphy models."""
        logger.info("Loading models...")
        self.nlp_spacy = spacy.load('ru_core_news_lg')
        stanza.download('ru')  # Download Russian model if not already downloaded
        self.nlp_stanza = stanza.Pipeline('ru')
        self.morph = pymorphy3.MorphAnalyzer()
        logger.info("Models loaded successfully")

    def get_nominative_form(self, word: str) -> str:
        """Get the nominative form of a word using pymorphy3."""
        try:
            parsed = self.morph.parse(word)[0]
            nom_form = parsed.inflect({'nomn'})
            return nom_form.word if nom_form else word
        except Exception as e:
            logger.error(f"Error getting nominative form for {word}: {e}")
            return word

    def get_case_votes(self, word: str, position: int, doc_spacy, doc_stanza) -> Dict[str, int]:
        """Get case votes from all three models."""
        case_mapping = {
            'nom': 'nominative', 'gen': 'genitive', 'dat': 'dative',
            'acc': 'accusative', 'abl': 'instrumental', 'loc': 'prepositional',
            'nomn': 'nominative', 'gent': 'genitive', 'datv': 'dative',
            'accs': 'accusative', 'ablt': 'instrumental', 'loct': 'prepositional'
        }
        
        votes = {
            'nominative': 0, 'genitive': 0, 'dative': 0,
            'accusative': 0, 'instrumental': 0, 'prepositional': 0
        }

        try:
            # 1. SpaCy vote
            token_spacy = [t for t in doc_spacy if t.idx == position][0]
            spacy_case = token_spacy.morph.get('Case')
            if spacy_case:
                case = case_mapping.get(spacy_case[0].lower())
                if case:
                    votes[case] += 1

            # 2. Stanza vote
            # Find the corresponding token in stanza doc
            for sent in doc_stanza.sentences:
                for token in sent.tokens:
                    if token.start_char == position:
                        if token.words[0].feats:
                            feats = dict(item.split('=') for item in token.words[0].feats.split('|'))
                            if 'Case' in feats:
                                case = case_mapping.get(feats['Case'].lower())
                                if case:
                                    votes[case] += 1
                        break

            # 3. Pymorphy vote
            parsed = self.morph.parse(word)[0]
            if parsed and parsed.tag and hasattr(parsed.tag, 'case'):
                case = case_mapping.get(parsed.tag.case)
                if case:
                    votes[case] += 1

        except Exception as e:
            logger.error(f"Error getting case votes for {word}: {e}")
        # print(votes)
        return votes

    def analyze_text(self, text: str, features: List[str]) -> Dict[str, Any]:
        """Analyze Russian text for specific cases with multi-model voting."""
        logger.info(f"Analyzing text with features: {features}")
        
        try:
            # Process text with both models
            doc_spacy = self.nlp_spacy(text)
            doc_stanza = self.nlp_stanza(text)
            
            words_to_practice = []
            
            for token in doc_spacy:
                # Skip non-word characters
                if not any(char.isalpha() for char in token.text):
                    continue

                # Get votes from all models
                votes = self.get_case_votes(token.text, token.idx, doc_spacy, doc_stanza)
                
                # Find the case with the most votes
                max_votes = max(votes.values())
                detected_case = None
                
                # Only consider cases with at least 2 votes
                if max_votes >= 2:
                    for case, vote_count in votes.items():
                        if vote_count == max_votes:
                            detected_case = case
                            break

                if detected_case and detected_case in features:
                    # Get nominative form for display
                    nominative_form = self.get_nominative_form(token.text)
                    
                    words_to_practice.append({
                        'original': token.text,  # Keep original declined form for checking
                        'display': nominative_form,  # Add nominative form for display
                        'position': token.idx,
                        'length': len(token.text),
                        'feature': detected_case
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