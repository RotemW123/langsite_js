from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import pymorphy3
import stanza
import logging
from typing import Optional, Dict, List
from collections import Counter

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, 
     resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:3000"]}},
     supports_credentials=True)

@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ['http://localhost:5173', 'http://localhost:3000']:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Initialize all three models
try:
    nlp_spacy = spacy.load('ru_core_news_lg')
    morph = pymorphy3.MorphAnalyzer()
    nlp_stanza = stanza.Pipeline('ru', processors='tokenize,pos,lemma,depparse')
    logger.info("Successfully loaded all language models")
except Exception as e:
    logger.error(f"Error loading language models: {e}")
    raise

class CaseAnalyzer:
    def __init__(self):
        self.case_mapping = {
            # Stanza cases
            'Nom': 'nominative',
            'Gen': 'genitive',
            'Dat': 'dative',
            'Acc': 'accusative',
            'Ins': 'instrumental',
            'Loc': 'prepositional',
            # Pymorphy forms
            'nomn': 'nominative',
            'gent': 'genitive',
            'datv': 'dative',
            'accs': 'accusative',
            'ablt': 'instrumental',
            'loct': 'prepositional'
        }
        
        self.preposition_cases = {
            'в': ['accusative', 'prepositional'],
            'на': ['accusative', 'prepositional'],
            'с': ['genitive', 'instrumental'],
            'к': ['dative'],
            'о': ['prepositional'],
            'по': ['dative'],
            'из': ['genitive'],
            'у': ['genitive'],
            'для': ['genitive'],
            'от': ['genitive'],
            'над': ['instrumental'],
            'под': ['instrumental', 'accusative'],
            'при': ['prepositional']
        }

    def validate_stanza_case(self, word, sent) -> Optional[str]:
        """Validate case using Stanza's syntactic analysis."""
        if not word.feats or 'Case=' not in word.feats:
            return None
            
        if word.upos not in {'NOUN', 'PRON', 'ADJ', 'DET', 'PROPN'}:
            return None
            
        case = word.feats.split('Case=')[1].split('|')[0]
        mapped_case = self.case_mapping.get(case, '').lower()
        
        # Validate based on dependency relation
        valid_deps = {
            'nsubj': ['nominative'],
            'obj': ['accusative', 'genitive'],
            'iobj': ['dative'],
            'obl': ['genitive', 'dative', 'instrumental', 'prepositional']
        }
        
        if word.deprel in valid_deps and mapped_case not in valid_deps[word.deprel]:
            return None
            
        return mapped_case

    def get_spacy_case(self, token) -> Optional[str]:
        """Get case from SpaCy with validation."""
        if token.pos_ not in {'NOUN', 'PRON', 'ADJ', 'DET', 'PROPN'}:
            return None
            
        spacy_case = token.morph.get('Case')
        if spacy_case:
            return self.case_mapping.get(spacy_case[0], '').lower()
        return None

    def get_pymorphy_case(self, word: str) -> Optional[str]:
        """Get case from Pymorphy with confidence check."""
        parsed = morph.parse(word)[0]
        if parsed.score < 0.7:  # Skip low confidence results
            return None
            
        if hasattr(parsed.tag, 'case'):
            return self.case_mapping.get(parsed.tag.case, '').lower()
        return None

    def get_combined_case(self, text: str, word: str, position: int) -> Optional[Dict]:
        """Combine and validate cases from all three models."""
        cases = []
        
        # Get Stanza analysis
        doc_stanza = nlp_stanza(text)
        for sent in doc_stanza.sentences:
            for w in sent.words:
                if w.text == word:
                    stanza_case = self.validate_stanza_case(w, sent)
                    if stanza_case:
                        cases.append(stanza_case)
        
        # Get SpaCy analysis
        doc_spacy = nlp_spacy(text)
        for token in doc_spacy:
            if token.text == word:
                spacy_case = self.get_spacy_case(token)
                if spacy_case:
                    cases.append(spacy_case)
        
        # Get Pymorphy analysis
        pymorphy_case = self.get_pymorphy_case(word)
        if pymorphy_case:
            cases.append(pymorphy_case)
        
        if not cases:
            return None
            
        # Use majority voting
        case_counter = Counter(cases)
        most_common_case = case_counter.most_common(1)[0]
        
        # Only accept if at least 2 models agree or if Stanza is confident
        if most_common_case[1] >= 2 or (cases and cases[0] == most_common_case[0]):
            return {
                'case': most_common_case[0],
                'confidence': most_common_case[1] / len(cases),
                'agreement': most_common_case[1]
            }
        
        return None

analyzer = CaseAnalyzer()

@app.route('/analyze', methods=['POST'])
def analyze_text():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        text = data.get('text', '')
        selected_cases = [case.lower() for case in data.get('cases', [])]
        
        if not text or not selected_cases:
            return jsonify({'error': 'Text and cases are required'}), 400

        doc = nlp_spacy(text)
        words_to_practice = []
        
        for token in doc:
            if token.pos_ not in {'NOUN', 'PRON', 'ADJ', 'DET', 'PROPN'}:
                continue
                
            case_info = analyzer.get_combined_case(text, token.text, token.idx)
            
            if case_info and case_info['case'] in selected_cases and case_info['confidence'] >= 0.6:
                words_to_practice.append({
                    'original': token.text,
                    'nominative': morph.parse(token.text)[0].normal_form,
                    'position': token.idx,
                    'length': len(token.text),
                    'case': case_info['case'],
                    'confidence': round(case_info['confidence'], 2),
                    'sentence': token.sent.text
                })

        return jsonify({
            'text': text,
            'words': words_to_practice
        })

    except Exception as e:
        logger.error(f"Error analyzing text: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/check', methods=['POST'])
def check_answer():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        original = data.get('original', '')
        user_answer = data.get('answer', '')
        expected_case = data.get('case', '').lower()

        if not all([original, user_answer, expected_case]):
            return jsonify({'error': 'Missing required data'}), 400

        # Get case analysis from all models
        case_info = analyzer.get_combined_case(user_answer, user_answer, 0)
        
        is_correct = user_answer.lower() == original.lower()
        
        message = 'Correct!' if is_correct else f'Incorrect. The word should be "{original}"'
        if not is_correct and case_info:
            if case_info['case'] != expected_case:
                message += f' (you used {case_info["case"]} case instead of {expected_case})'

        return jsonify({
            'correct': is_correct,
            'message': message,
            'expected_word': original,
            'your_answer': user_answer
        })

    except Exception as e:
        logger.error(f"Error checking answer: {e}", exc_info=True)
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)