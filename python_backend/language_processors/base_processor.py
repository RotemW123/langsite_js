from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseLanguageProcessor(ABC):
    """Abstract base class for language processors."""
    
    @abstractmethod
    def initialize_models(self):
        """Initialize required NLP models."""
        pass
    
    @abstractmethod
    def analyze_text(self, text: str, features: List[str]) -> Dict[str, Any]:
        """Analyze text for specific grammatical features."""
        pass
    
    @abstractmethod
    def check_answer(self, original: str, answer: str, feature: str) -> Dict[str, Any]:
        """Check if the answer is correct for the given grammatical feature."""
        pass
    
    @abstractmethod
    def get_available_features(self) -> List[str]:
        """Return list of available grammatical features for this language."""
        pass