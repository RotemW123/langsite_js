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

# Configure CORS
CORS(app, 
     resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:3000"]}},
     supports_credentials=True)

# Modified after_request handler to use the actual request origin
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin')
    if origin in ['http://localhost:5173', 'http://localhost:3000']:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

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
        # Skip non-word characters
        if not any(char.isalpha() for char in token.text):
            return None

        # Mapping for case abbreviations to full names
        case_mapping = {
            'nom': 'nominative',
            'gen': 'genitive',
            'dat': 'dative',
            'acc': 'accusative',
            'abl': 'instrumental',
            'loc': 'prepositional',
            # Pymorphy forms
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
        try:
            parsed = morph.parse(token.text)[0]
            if parsed and parsed.tag and hasattr(parsed.tag, 'case'):
                full_case = case_mapping.get(parsed.tag.case)
                if full_case:
                    logger.debug(f"Pymorphy case for {token.text}: {full_case}")
                return full_case
        except:
            pass
            
        return None
    except:
        return None

@app.route('/analyze', methods=['POST'])
def analyze_text():
    """Analyze Russian text and find words in specified cases."""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        text = data.get('text', '')
        selected_cases = [case.lower() for case in data.get('cases', [])]
        
        logger.info(f"Looking for cases: {selected_cases}")
        
        if not text or not selected_cases:
            return jsonify({'error': 'Text and cases are required'}), 400

        doc = nlp(text)
        words_to_practice = []
        
        # Set of Russian parts of speech that can have cases
        declinable_pos = {'NOUN', 'PRON', 'ADJ', 'DET', 'PROPN'}
        
        # Track word count for debugging
        total_words = 0
        processable_words = 0
        case_found = 0
        case_details = []
        
        for token in doc:
            total_words += 1
            
            # Skip non-declinable parts of speech
            if token.pos_ not in declinable_pos:
                continue
                
            processable_words += 1
            case = get_case(token)
            
            if case:
                case_found += 1
                case_details.append(f"{token.text}: {case}")
                
                if case.lower() in selected_cases:
                    words_to_practice.append({
                        'original': token.text,
                        'nominative': get_nominative(token),
                        'position': token.idx,
                        'length': len(token.text),
                        'case': case.lower(),
                        'sentence': token.sent.text
                    })
        
        # Detailed logging
        logger.info(f"Total words processed: {total_words}")
        logger.info(f"Words with declinable parts of speech: {processable_words}")
        logger.info(f"Words where case was found: {case_found}")
        logger.info(f"Selected cases: {selected_cases}")
        logger.info("First 10 words with their cases:")
        for detail in case_details[:10]:
            logger.info(detail)
        logger.info(f"Words matching selected cases: {len(words_to_practice)}")
        
        # Always return the text, even if no practice words found
        return jsonify({
            'text': text,  # Original text is always included
            'words': words_to_practice,
            'stats': {
                'total_words': total_words,
                'processable_words': processable_words,
                'case_found': case_found,
                'practice_words': len(words_to_practice),
                'case_details': case_details[:10]
            }
        })

    except Exception as e:
        logger.error(f"Error analyzing text: {e}")
        return jsonify({'error': 'Internal server error'}), 500


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



@app.route('/check', methods=['POST'])
def check_answer():
    """Check if user's answer matches the original declined form."""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        original = data.get('original', '')  # The word as it appears in text (declined form)
        user_answer = data.get('answer', '')  # User's attempt at declining the word
        expected_case = data.get('case', '').lower()  # For informational purposes
        
        logger.info(f"Checking answer - Original: {original}, User Answer: {user_answer}, Expected Case: {expected_case}")
        
        if not all([original, user_answer, expected_case]):
            logger.error("Missing required data")
            return jsonify({'error': 'Original text, answer, and expected case are required'}), 400

        # Simple direct comparison - the user's answer should match the original word
        is_correct = user_answer.lower() == original.lower()
        
        # Get case info just for feedback purposes
        doc = nlp(user_answer)
        answer_case = get_case(doc[0]) if len(doc) == 1 else None
        
        # Prepare feedback message
        if is_correct:
            message = 'Correct!'
        else:
            message = f'Incorrect. The word should be "{original}"'
            if answer_case and answer_case != expected_case:
                message += f' (you used {answer_case} case instead of {expected_case})'
        
        response_data = {
            'correct': is_correct,
            'message': message,
            'expected_word': original,
            'your_answer': user_answer,
            'debug_info': {
                'expected_case': expected_case,
                'received_case': answer_case if answer_case else 'unknown',
            }
        }
        
        logger.info(f"Check result: {response_data}")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Error checking answer: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)