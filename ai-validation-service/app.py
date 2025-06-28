from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import json
import time
import logging
from datetime import datetime
import threading
from typing import Dict, List, Any, Optional
import re
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
CORS(app, origins=["http://localhost:3000"])  # Allow Data Alchemist frontend
socketio = SocketIO(app, cors_allowed_origins="http://localhost:3000")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import our AI modules
from error_analyzer import ErrorAnalyzer
from suggestion_engine import SuggestionEngine
from pattern_matcher import PatternMatcher
from feedback_processor import FeedbackProcessor

class ValidationErrorResolver:
    def __init__(self):
        self.error_analyzer = ErrorAnalyzer()
        self.suggestion_engine = SuggestionEngine()
        self.pattern_matcher = PatternMatcher()
        self.feedback_processor = FeedbackProcessor()
        self.load_models()
    
    def load_models(self):
        """Load pre-trained models and patterns"""
        try:
            # Load error classification model
            if os.path.exists('models/error_classifier.pkl'):
                with open('models/error_classifier.pkl', 'rb') as f:
                    self.error_classifier = pickle.load(f)
            else:
                self.error_classifier = self._train_default_classifier()
            
            # Load suggestion patterns
            if os.path.exists('models/suggestion_patterns.json'):
                with open('models/suggestion_patterns.json', 'r') as f:
                    self.suggestion_patterns = json.load(f)
            else:
                self.suggestion_patterns = self._create_default_patterns()
                
            logger.info("Models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            self._initialize_fallback_models()
    
    def _train_default_classifier(self):
        """Train a basic error classifier with common patterns"""
        # This would be replaced with actual training data
        return None
    
    def _create_default_patterns(self):
        """Create default suggestion patterns"""
        return {
            "out_of_range": {
                "PriorityLevel": ["1", "2", "3", "4", "5"],
                "Duration": ["1", "2", "3", "4", "5", "6"],
                "QualificationLevel": ["1", "2", "3", "4", "5"]
            },
            "malformed_list": {
                "AvailableSlots": ["[1,2,3]", "[1,3,5]", "[2,4]"],
                "PreferredPhases": ["[1,2]", "[2,3,4]", "1-3", "2-5"],
                "RequestedTaskIDs": ["T001,T002", "T001,T003,T004"]
            },
            "broken_json": [
                '{"status": "active"}',
                '{"priority": "high", "category": "urgent"}',
                '{"department": "IT", "location": "office"}'
            ],
            "duplicate_ids": {
                "pattern": "{prefix}{timestamp}",
                "prefixes": {"ClientID": "C", "WorkerID": "W", "TaskID": "T"}
            }
        }
    
    def _initialize_fallback_models(self):
        """Initialize basic fallback models"""
        self.error_classifier = None
        self.suggestion_patterns = self._create_default_patterns()

# Initialize the resolver
resolver = ValidationErrorResolver()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "AI Validation Error Resolver",
        "version": "1.0.0"
    })

@app.route('/api/resolve-error', methods=['POST'])
def resolve_error():
    """Main endpoint for resolving validation errors"""
    start_time = time.time()
    
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['error_type', 'affected_columns', 'current_value']
        if not all(field in data for field in required_fields):
            return jsonify({
                "error": "Missing required fields",
                "required": required_fields
            }), 400
        
        # Process the error
        result = resolver.error_analyzer.analyze_error(data)
        suggestions = resolver.suggestion_engine.generate_suggestions(result)
        guidance = resolver.suggestion_engine.create_guidance(result, suggestions)
        
        response = {
            "error_id": result.get('error_id'),
            "analysis": result.get('analysis'),
            "suggestions": suggestions,
            "guidance": guidance,
            "confidence": result.get('confidence', 0.8),
            "processing_time": round(time.time() - start_time, 3)
        }
        
        # Log the request for learning
        resolver.feedback_processor.log_request(data, response)
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing request: {e}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/api/resolve-batch', methods=['POST'])
def resolve_batch():
    """Batch processing endpoint for multiple errors"""
    start_time = time.time()
    
    try:
        data = request.get_json()
        errors = data.get('errors', [])
        
        if not errors:
            return jsonify({"error": "No errors provided"}), 400
        
        results = []
        for error in errors:
            try:
                result = resolver.error_analyzer.analyze_error(error)
                suggestions = resolver.suggestion_engine.generate_suggestions(result)
                guidance = resolver.suggestion_engine.create_guidance(result, suggestions)
                
                results.append({
                    "error_id": result.get('error_id'),
                    "original_error": error,
                    "analysis": result.get('analysis'),
                    "suggestions": suggestions,
                    "guidance": guidance,
                    "confidence": result.get('confidence', 0.8)
                })
            except Exception as e:
                results.append({
                    "error_id": f"error_{len(results)}",
                    "original_error": error,
                    "error": str(e),
                    "suggestions": [],
                    "guidance": "Unable to process this error"
                })
        
        response = {
            "results": results,
            "total_processed": len(results),
            "processing_time": round(time.time() - start_time, 3)
        }
        
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error processing batch request: {e}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """Endpoint for submitting feedback on suggestions"""
    try:
        data = request.get_json()
        
        required_fields = ['error_id', 'suggestion_used', 'was_helpful']
        if not all(field in data for field in required_fields):
            return jsonify({
                "error": "Missing required fields",
                "required": required_fields
            }), 400
        
        # Process feedback
        resolver.feedback_processor.process_feedback(data)
        
        return jsonify({
            "status": "success",
            "message": "Feedback recorded successfully"
        })
        
    except Exception as e:
        logger.error(f"Error processing feedback: {e}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/api/patterns', methods=['GET'])
def get_patterns():
    """Get current error patterns and statistics"""
    try:
        patterns = resolver.pattern_matcher.get_pattern_statistics()
        return jsonify(patterns)
    except Exception as e:
        logger.error(f"Error getting patterns: {e}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

@app.route('/api/update-patterns', methods=['POST'])
def update_patterns():
    """Update error resolution patterns"""
    try:
        data = request.get_json()
        resolver.pattern_matcher.update_patterns(data)
        return jsonify({
            "status": "success",
            "message": "Patterns updated successfully"
        })
    except Exception as e:
        logger.error(f"Error updating patterns: {e}")
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500

# WebSocket events for real-time suggestions
@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info(f"Client connected: {request.sid}")
    emit('connected', {'status': 'Connected to AI Validation Service'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    logger.info(f"Client disconnected: {request.sid}")

@socketio.on('analyze_error')
def handle_analyze_error(data):
    """Handle real-time error analysis"""
    try:
        result = resolver.error_analyzer.analyze_error(data)
        suggestions = resolver.suggestion_engine.generate_suggestions(result)
        
        emit('error_analysis', {
            "error_id": result.get('error_id'),
            "analysis": result.get('analysis'),
            "suggestions": suggestions,
            "confidence": result.get('confidence', 0.8)
        })
        
    except Exception as e:
        emit('error', {"message": str(e)})

@socketio.on('request_suggestions')
def handle_request_suggestions(data):
    """Handle real-time suggestion requests"""
    try:
        # Simulate progressive suggestion generation
        suggestions = resolver.suggestion_engine.generate_progressive_suggestions(data)
        
        for i, suggestion in enumerate(suggestions):
            emit('suggestion_update', {
                "index": i,
                "suggestion": suggestion,
                "total": len(suggestions)
            })
            time.sleep(0.1)  # Small delay for progressive updates
            
    except Exception as e:
        emit('error', {"message": str(e)})

if __name__ == '__main__':
    # Ensure models directory exists
    os.makedirs('models', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    
    # Start the Flask-SocketIO server
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)