import stanza
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class ArabicProcessor:
    def __init__(self):
        self.nlp = None
        try:
            self.initialize_models()
        except Exception as e:
            logger.error(f"Failed to initialize ArabicProcessor: {e}")
            raise

    def initialize_models(self):
        """Initialize Stanza model."""
        try:
            stanza.download('ar')
            self.nlp = stanza.Pipeline('ar', processors='tokenize,pos,lemma', use_gpu=False)
            
            self._test_pipeline()
        except Exception as e:
            logger.error(f"Error initializing models: {e}")
            raise

    def _test_pipeline(self):
        """Test if pipeline works with a simple sentence."""
        try:
            test_text = "كتب"
            self.nlp(test_text)
        except Exception as e:
            logger.error(f"Pipeline test failed: {e}")
            raise

    def get_lemma(self, word) -> str:
        """Get the lemma form of a word."""
        return word.lemma if word.lemma else word.text

    def get_feature(self, word) -> Optional[str]:
        """Determine the grammatical feature of a word."""
        if word.upos == "VERB":
            # Check feats for aspect informaticon
            if word.feats:
                if "Aspect=Perf" in word.feats:
                    return "past"
                elif "Aspect=Imp" in word.feats:
                    return "present"
                # Future is typically marked by prefixes س or سوف
                elif any(marker in word.text for marker in ["س", "سوف"]):
                    return "future"
        
        # Check for participles and masdar
        elif word.upos == "NOUN":
            if "VerbForm=Part" in word.feats:
                if "Voice=Act" in word.feats:
                    return "active_participle"  # اسم الفاعل
                elif "Voice=Pass" in word.feats:
                    return "passive_participle"  # اسم المفعول
            # Check for masdar (verbal noun)
            elif "VerbForm=Vnoun" in word.feats:
                return "masdar"  # المصدر
                
        # Check for cases
        if word.feats:
            if "Case=Nom" in word.feats:
                return "nominal"
            elif "Case=Acc" in word.feats:
                return "accusative"
            elif "Case=Gen" in word.feats:
                return "genitive"
            
            # Check for number
            if "Number=Dual" in word.feats:
                return "dual"
            elif "Number=Plur" in word.feats:
                return "plural"
        
        return None

    def analyze_text(self, text: str, features: List[str]) -> Dict[str, Any]:
        """Analyze Arabic text for specific grammatical features."""
        
        try:
            doc = self.nlp(text)
            words_to_practice = []
            current_position = 0
            
            for sent in doc.sentences:
                for word in sent.words:
                    # Skip punctuation
                    if word.upos == "PUNCT":
                        current_position += len(word.text)
                        continue
                        
                    feature = self.get_feature(word)
                    
                    if feature and feature in features:
                        words_to_practice.append({
                            'original': word.text,
                            'display': self.get_lemma(word),
                            'position': current_position,
                            'length': len(word.text),
                            'feature': feature
                        })
                    
                    current_position += len(word.text)
            
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

            # Clean up and normalize the strings for comparison
            original_clean = original.strip()
            answer_clean = answer.strip()
            
            is_correct = original_clean == answer_clean
            
            message = 'صحيح!' if is_correct else f'غير صحيح. الشكل الصحيح هو "{original}"'
            
            # Add specific messages for different features
            if not is_correct:
                if feature in ['past', 'present', 'future']:
                    message += ' (زمن الفعل)'
                elif feature in ['nominal', 'accusative', 'genitive']:
                    message += ' (حالة الإعراب)'
                elif feature in ['dual', 'plural']:
                    message += ' (العدد)'

            return {
                'correct': is_correct,
                'message': message
            }
        except Exception as e:
            logger.error(f"Error checking answer: {e}")
            raise

    def get_available_features(self) -> List[str]:
        """Return available grammatical features for Arabic."""
        return [
            'past',      # الماضي
            'present',   # المضارع
            'future',    # المستقبل
            'dual',      # المثنى
            'plural',    # الجمع
            'nominal',   # الرفع
            'accusative', # النصب
            'genitive'   # الجر
        ]