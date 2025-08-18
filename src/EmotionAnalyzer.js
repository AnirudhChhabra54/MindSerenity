import React, { useState, useEffect, useRef } from 'react';
import * as faceapi from 'face-api.js';

// --- Helper Components & Data ---

const LoadingSpinner = ({ text }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gray-900 bg-opacity-80 text-white z-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
        <p>{text}</p>
    </div>
);

const remedies = {
    happy: {
        title: "That's Great to See!",
        message: "A genuine smile is a powerful thing. Keep embracing activities and people that bring you this joy. Consider sharing this positive energy with someone else today.",
        color: "green"
    },
    sad: {
        title: "It's Okay to Feel Sad",
        message: "Seeing sadness is a sign to be gentle with yourself. Consider taking a short break, listening to some calming music, or reaching out to a friend. Your feelings are valid.",
        color: "blue"
    },
    neutral: {
        title: "Feeling Calm and Centered",
        message: "A neutral expression can mean you're focused, relaxed, or just observing. This is a great state for mindfulness. Try a simple 1-minute breathing exercise to check in with yourself.",
        color: "gray"
    },
    angry: {
        title: "Acknowledging Frustration",
        message: "Feeling angry is a normal human emotion. It can be a signal that a boundary has been crossed. Try to identify the source of this feeling. A short walk can help clear your head.",
        color: "red"
    },
    surprised: {
        title: "A Moment of Surprise!",
        message: "Surprise can be a reaction to something new or unexpected. It's a sign that you're engaged and paying attention to the world around you.",
        color: "purple"
    },
    default: {
        title: "Real-Time Emotion Analysis",
        message: "Position your face in the center of the video frame. The AI will analyze your expression to offer feedback. This is not a diagnosis, but a tool for self-awareness.",
        color: "gray"
    }
};

// --- Main Component ---

export default function EmotionAnalyzer() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Initializing...');
    const [detectedEmotion, setDetectedEmotion] = useState('default');
    const [isAnalysisRunning, setIsAnalysisRunning] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        const loadModelsAndStartWebcam = async () => {
            const MODEL_URL = '/models'; 
            try {
                console.log('Step 1: Setting up AI engine...');
                setLoadingMessage('Setting up AI engine...');
                await faceapi.tf.setBackend('webgl');
                await faceapi.tf.ready();
                console.log('Step 1 SUCCESS: AI engine is ready.');

                console.log('Step 2: Loading models...');
                setLoadingMessage('Loading face detection models...');
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                    faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
                ]);
                console.log('Step 2 SUCCESS: All models loaded.');

                console.log('Step 3: Accessing webcam...');
                setLoadingMessage('Accessing webcam...');
                const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
                console.log('Step 3 SUCCESS: Webcam stream acquired.');

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Wait for the video to start playing to remove the loading spinner
                    videoRef.current.onloadedmetadata = () => {
                        setIsLoading(false);
                        console.log('Step 4 SUCCESS: Webcam stream attached and playing.');
                    };
                } else {
                     throw new Error("Video element is not available.");
                }
            } catch (error) {
                console.error("ERROR DURING SETUP:", error);
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    setLoadingMessage('Webcam access denied. Please grant camera permission in your browser settings and refresh the page.');
                } else if (error.message.includes('404') || error.message.includes('failed to fetch')) {
                     setLoadingMessage('Failed to load AI models. Please ensure the `models` folder is inside your `public` directory.');
                }
                else {
                    setLoadingMessage('An error occurred during setup. Please check the browser console for a detailed error message.');
                }
            }
        };

        loadModelsAndStartWebcam();
        
        const videoEl = videoRef.current;
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (videoEl && videoEl.srcObject) {
                videoEl.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startAnalysis = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(async () => {
            if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 3) {
                const displaySize = { width: videoRef.current.clientWidth, height: videoRef.current.clientHeight };
                faceapi.matchDimensions(canvasRef.current, displaySize);

                const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks()
                    .withFaceExpressions();
                
                if (detections && detections.length > 0) {
                    const expressions = detections[0].expressions;
                    const dominantEmotion = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
                    setDetectedEmotion(dominantEmotion);
                } else {
                    setDetectedEmotion('default');
                }

                const resizedDetections = faceapi.resizeResults(detections, displaySize);
                canvasRef.current.getContext('2d').clearRect(0, 0, displaySize.width, displaySize.height);
                faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
                faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections);
            }
        }, 300);
    };

    const toggleAnalysis = () => {
        if (isAnalysisRunning) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (canvasRef.current) {
                const context = canvasRef.current.getContext('2d');
                context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
            setDetectedEmotion('default');
        } else {
            startAnalysis();
        }
        setIsAnalysisRunning(!isAnalysisRunning);
    };

    const remedy = remedies[detectedEmotion] || remedies.default;
    const remedyColorClass = `border-${remedy.color}-500`;
    const remedyBgColorClass = `bg-${remedy.color}-50`;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto bg-white rounded-xl shadow-lg">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Biometric Analysis (Beta)</h2>
            <p className="text-gray-600 mb-6">This tool uses your camera to analyze facial expressions for self-awareness. All processing happens on your device; no video is recorded or sent anywhere.</p>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden shadow-inner bg-gray-900 flex items-center justify-center">
                    {isLoading && <LoadingSpinner text={loadingMessage} />}
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        muted 
                        playsInline 
                        className={`w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                    ></video>
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
                </div>

                <div className="flex flex-col justify-between h-full">
                    <div className={`p-6 rounded-lg border-l-4 transition-all duration-300 ${remedyColorClass} ${remedyBgColorClass}`}>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{remedy.title}</h3>
                        <p className="text-gray-700">{remedy.message}</p>
                    </div>
                    <button 
                        onClick={toggleAnalysis}
                        disabled={isLoading}
                        className={`w-full mt-4 py-3 px-6 font-bold text-white rounded-lg transition-colors disabled:bg-gray-400 ${isAnalysisRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isAnalysisRunning ? 'Stop Analysis' : 'Start Analysis'}
                    </button>
                </div>
            </div>
        </div>
    );
}
