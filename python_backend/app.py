from flask import Flask, request, jsonify
from flask_cors import CORS
import spacy
import pymorphy3
import logging
from typing import Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize spaCy and pymorphy
try:
    nlp = spacy.load('ru_core_news_lg')
    morph = pymorphy3.MorphAnalyzer()
    logger.info("Successfully loaded Russian language models")
except Exception as e:
    logger.error(f"Error loading language models: {e}")
    raise

def get_case(token) -> Optional[str]:
    """Extract grammatical case from a token using both spaCy and pymorphy3."""
    try:
        # Try spaCy first
        spacy_case = token.morph.get('Case')
        if spacy_case:
            return spacy_case[0].lower()

        # If spaCy doesn't find a case, try pymorphy3
        parsed = morph.parse(token.text)[0]
        if 'case' in parsed.tag:
            cases = {
                'nomn': 'nominative',
                'gent': 'genitive',
                'datv': 'dative',
                'accs': 'accusative',
                'ablt': 'instrumental',
                'loct': 'prepositional'
            }
            return cases.get(parsed.tag.case)
        
        return None
    except Exception as e:
        logger.error(f"Error getting case for token '{token.text}': {e}")
        return None

def get_nominative(token) -> str:
    """Get nominative form of a word using pymorphy3."""
    try:
        parsed = morph.parse(token.text)[0]
        return parsed.normal_form
    except Exception as e:
        logger.error(f"Error getting nominative form for '{token.text}': {e}")
        return token.text
    
@app.route('/')
def home():
    return "Hello, World!"

@app.route('/test', methods=['GET'])
def test():
    """Test endpoint to verify server is running."""
    return jsonify({
        "status": "ok",
        "message": "Russian language analysis server is running"
    })

@app.route('/analyze', methods=['POST'])
def analyze_text():
    """Analyze Russian text and find words in specified cases."""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        text = data.get('text', '')
        selected_cases = [case.lower() for case in data.get('cases', [])]
        
        if not text or not selected_cases:
            return jsonify({'error': 'Text and cases are required'}), 400

        logger.info(f"Analyzing text for cases: {selected_cases}")
        doc = nlp(text)
        words_to_practice = []
        
        for token in doc:
            case = get_case(token)
            if case and case.lower() in selected_cases:
                words_to_practice.append({
                    'original': token.text,
                    'nominative': get_nominative(token),
                    'position': token.idx,
                    'length': len(token.text),
                    'case': case.lower(),
                    'sentence': token.sent.text
                })
        
        logger.info(f"Found {len(words_to_practice)} words to practice")
        return jsonify({
            'words': words_to_practice
        })

    except Exception as e:
        logger.error(f"Error analyzing text: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/check', methods=['POST'])
def check_answer():
    """Check if a word is in the expected grammatical case."""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        original = data.get('original', '')
        user_answer = data.get('answer', '')
        expected_case = data.get('case', '').lower()
        
        if not all([original, user_answer, expected_case]):
            return jsonify({'error': 'Original text, answer, and expected case are required'}), 400

        # Check if it's a single word
        doc = nlp(user_answer)
        if len(doc) != 1:
            return jsonify({
                'correct': False,
                'message': 'Please enter a single word'
            })
        
        # Get the case of the answer using both spaCy and pymorphy
        answer_case = get_case(doc[0])
        if not answer_case:
            return jsonify({
                'correct': False,
                'message': 'Could not determine case of your answer'
            })
        
        is_correct = answer_case.lower() == expected_case
        message = 'Correct!' if is_correct else f'Incorrect. The word should be in {expected_case} case.'
        
        return jsonify({
            'correct': is_correct,
            'message': message,
            'expected_case': expected_case,
            'received_case': answer_case
        })

    except Exception as e:
        logger.error(f"Error checking answer: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)