from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from language_processors.russian import RussianProcessor
from language_processors.spanish import SpanishProcessor
from language_processors.french import FrenchProcessor

# Import other language processors as they're implemented

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Initialize language processors
language_processors = {
    'russian': RussianProcessor(),
    'spanish': SpanishProcessor(),
    'french': FrenchProcessor(),
    # etc.
}

@app.route('/analyze/<language>', methods=['POST'])
def analyze_text(language):
    """Analyze text for specific language features."""
    try:
        if language not in language_processors:
            return jsonify({'error': f'Language {language} is not supported'}), 400

        processor = language_processors[language]
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        text = data.get('text', '')
        features = data.get('features', [])
        
        if not text or not features:
            return jsonify({'error': 'Text and features are required'}), 400

        result = processor.analyze_text(text, features)
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error analyzing text: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/check/<language>', methods=['POST'])
def check_answer(language):
    """Check answer for specific language."""
    try:
        if language not in language_processors:
            return jsonify({'error': f'Language {language} is not supported'}), 400

        processor = language_processors[language]
        data = request.json
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        original = data.get('original', '')
        answer = data.get('answer', '')
        feature = data.get('feature', '')

        if not all([original, answer, feature]):
            return jsonify({'error': 'Original text, answer, and feature are required'}), 400

        result = processor.check_answer(original, answer, feature)
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error checking answer: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/features/<language>', methods=['GET'])
def get_features(language):
    """Get available features for a specific language."""
    try:
        if language not in language_processors:
            return jsonify({'error': f'Language {language} is not supported'}), 400

        processor = language_processors[language]
        features = processor.get_available_features()
        return jsonify({'features': features})

    except Exception as e:
        logger.error(f"Error getting features: {e}")
        return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)