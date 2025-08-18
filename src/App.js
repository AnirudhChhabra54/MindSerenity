import HomePage3D from './HomePage3D';
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    addDoc,
    collection,
    query,
    onSnapshot,
    Timestamp,
    orderBy
} from 'firebase/firestore';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import BiometricAnalysis from './BiometricAnalysis'; // Import the new component
import { motion, AnimatePresence } from 'framer-motion';

// --- Icon Imports (using lucide-react for a clean look) ---
// const CheckCircle = (props) => (
//   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
// );
// const User = (props) => (
//   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
// );
// const Shield = (props) => (
//   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
// );
const LogOut = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
const AlertTriangle = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);

// --- Firebase Configuration & Initialization ---

const firebaseConfig = {
  apiKey: "AIzaSyD70Jkpo9M4xjkbcgD0R1jvnDcI2nMIdig",
  authDomain: "mindwell-app-ani.firebaseapp.com",
  projectId: "mindwell-app-ani",
  storageBucket: "mindwell-app-ani.firebasestorage.app",
  messagingSenderId: "1016038846568",
  appId: "1:1016038846568:web:838563936201ad31f90bdd"
};
// This is a fixed value for your local setup.
const appId = 'default-mental-health-app';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Survey Content ---
const surveyQuestions = {
    demographics: [
        { id: 'age', label: 'Age', type: 'number', required: true },
        { id: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'], required: true },
        { id: 'yearOfStudy', label: 'Year of Study', type: 'select', options: ['First Year', 'Second Year', 'Third Year', 'Fourth Year', 'Postgraduate', 'Other'], required: true },
        { id: 'institution', label: 'Institution / University', type: 'text', required: true },
    ],
    phq9: [
        { id: 'phq9_1', text: 'Little interest or pleasure in doing things' },
        { id: 'phq9_2', text: 'Feeling down, depressed, or hopeless' },
        { id: 'phq9_3', text: 'Trouble falling or staying asleep, or sleeping too much' },
        { id: 'phq9_4', text: 'Feeling tired or having little energy' },
        { id: 'phq9_5', text: 'Poor appetite or overeating' },
        { id: 'phq9_6', text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down' },
        { id: 'phq9_7', text: 'Trouble concentrating on things, such as reading the newspaper or watching television' },
        { id: 'phq9_8', text: 'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual' },
        { id: 'phq9_9', text: 'Thoughts that you would be better off dead or of hurting yourself in some way' },
    ],
    gad7: [
        { id: 'gad7_1', text: 'Feeling nervous, anxious, or on edge' },
        { id: 'gad7_2', text: 'Not being able to stop or control worrying' },
        { id: 'gad7_3', text: 'Worrying too much about different things' },
        { id: 'gad7_4', text: 'Trouble relaxing' },
        { id: 'gad7_5', text: 'Being so restless that it is hard to sit still' },
        { id: 'gad7_6', text: 'Becoming easily annoyed or irritable' },
        { id: 'gad7_7', text: 'Feeling afraid as if something awful might happen' },
    ],
    lifestyle: [
        { id: 'sleepDuration', label: 'On average, how many hours of sleep do you get per night?', type: 'number', required: true },
        { id: 'mealFrequency', label: 'How many regular meals do you eat per day?', type: 'number', required: true },
        { id: 'studyEngagement', label: 'How engaged do you feel with your studies?', type: 'radio', options: ['Not at all', 'Slightly', 'Moderately', 'Very'], required: true },
    ],
    social: [
        { id: 'belonging', label: 'I feel a sense of belonging at my institution.', type: 'radio', options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], required: true },
        { id: 'supportSystem', label: 'I have a reliable support system (friends, family).', type: 'radio', options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], required: true },
    ],
};
const screeningOptions = ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'];


// --- Helper Functions ---
const calculateScores = (answers) => {
    const phq9_score = surveyQuestions.phq9.reduce((acc, q) => acc + (answers[q.id] || 0), 0);
    const gad7_score = surveyQuestions.gad7.reduce((acc, q) => acc + (answers[q.id] || 0), 0);
    return { phq9_score, gad7_score };
};

const getRiskLevel = (score) => {
    if (score >= 15) return { text: 'High Risk', color: 'text-red-500', bgColor: 'bg-red-100' };
    if (score >= 10) return { text: 'Moderate Risk', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    if (score >= 5) return { text: 'Mild Risk', color: 'text-blue-500', bgColor: 'bg-blue-100' };
    return { text: 'Low Risk', color: 'text-green-500', bgColor: 'bg-green-100' };
};

// --- Reusable Components ---
const LoadingSpinner = () => (
    <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
    </div>
);

const CustomModal = ({ title, message, onClose, type = 'info' }) => {
    const colors = {
        info: 'bg-blue-100 border-blue-500 text-blue-700',
        error: 'bg-red-100 border-red-500 text-red-700',
        success: 'bg-green-100 border-green-500 text-green-700',
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className={`p-4 rounded-t-lg border-b-4 ${colors[type]}`}>
                    <h3 className="text-xl font-bold">{title}</h3>
                </div>
                <div className="p-6">
                    <p>{message}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-b-lg flex justify-end">
                    <button onClick={onClose} className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Main Application Components ---

const AuthPage = ({ setNotification }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
                setNotification({ type: 'success', title: 'Login Successful', message: 'Welcome back!' });
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const userRolePath = doc(db, "roles", userCredential.user.uid);
                await setDoc(userRolePath, { role: 'student' });
                setNotification({ type: 'success', title: 'Account Created', message: 'You can now log in.' });
                setIsLogin(true);
            }
        } catch (error) {
            console.error("Authentication error:", error);
            setNotification({ type: 'error', title: 'Authentication Failed', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleAuth}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <input id="email-address" name="email" type="email" autoComplete="email" required 
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                        <div>
                            <input id="password" name="password" type="password" autoComplete="current-password" required 
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <button type="submit" disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300">
                            {isLoading ? <LoadingSpinner /> : (isLogin ? 'Sign In' : 'Create Account')}
                        </button>
                    </div>
                </form>
                <div className="text-sm text-center">
                    <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-blue-600 hover:text-blue-500">
                        {isLogin ? 'Don\'t have an account? Sign up' : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SurveyPage = ({ user, setPage, setLastResult, setNotification }) => {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const sections = ['Demographics', 'Depression (PHQ-9)', 'Anxiety (GAD-7)', 'Lifestyle & Social', 'Review'];
    const totalSteps = sections.length;

    const handleAnswerChange = (id, value) => {
        setAnswers(prev => ({ ...prev, [id]: value }));
    };

    const nextStep = () => {
        if (step < totalSteps - 1) {
            setStep(s => s + 1);
        }
    };
    const prevStep = () => {
        if (step > 0) {
            setStep(s => s - 1);
        }
    };
    
    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const { phq9_score, gad7_score } = calculateScores(answers);
            const submissionData = {
                userId: user.uid,
                createdAt: Timestamp.now(),
                answers,
                phq9_score,
                gad7_score,
            };
            
            const userSurveyPath = collection(db, `artifacts/${appId}/users/${user.uid}/surveys`);
            const docRef = await addDoc(userSurveyPath, submissionData);

            const anonymizedData = { ...submissionData };
            delete anonymizedData.userId;
            anonymizedData.originalDocId = docRef.id;
            const publicSurveyPath = collection(db, `artifacts/${appId}/public/data/anonymousSurveys`);
            await addDoc(publicSurveyPath, anonymizedData);

            setLastResult(submissionData);
            setPage('results');
            setNotification({type: 'success', title: 'Survey Submitted', message: 'Thank you for completing the assessment.'});

        } catch (error) {
            console.error("Error submitting survey:", error);
            setNotification({type: 'error', title: 'Submission Failed', message: 'Could not save your results. Please try again.'});
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div>
                        {surveyQuestions.demographics.map(q => (
                            <div key={q.id} className="mb-4">
                                <label className="block text-gray-700 font-medium mb-1">{q.label}</label>
                                {q.type === 'select' ? (
                                    <select value={answers[q.id] || ''} onChange={e => handleAnswerChange(q.id, e.target.value)} className="w-full p-2 border rounded-md">
                                        <option value="" disabled>Select an option</option>
                                        {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <input type={q.type} value={answers[q.id] || ''} onChange={e => handleAnswerChange(q.id, e.target.value)} className="w-full p-2 border rounded-md" />
                                )}
                            </div>
                        ))}
                    </div>
                );
            case 1:
            case 2:
                const questions = step === 1 ? surveyQuestions.phq9 : surveyQuestions.gad7;
                return (
                    <div>
                        <p className="mb-4 text-gray-600">Over the last 2 weeks, how often have you been bothered by any of the following problems?</p>
                        {questions.map(q => (
                            <div key={q.id} className="mb-6 p-4 border rounded-lg bg-gray-50">
                                <p className="font-medium mb-2">{q.text}</p>
                                <div className="flex flex-wrap gap-2">
                                    {screeningOptions.map((opt, index) => (
                                        <button key={index} onClick={() => handleAnswerChange(q.id, index)}
                                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${answers[q.id] === index ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 3:
                return (
                    <div>
                        {surveyQuestions.lifestyle.map(q => (
                            <div key={q.id} className="mb-6 p-4 border rounded-lg bg-gray-50">
                                <label className="block text-gray-700 font-medium mb-2">{q.label}</label>
                                {q.type === 'radio' ? (
                                    <div className="flex flex-wrap gap-2">
                                        {q.options.map(opt => (
                                            <button key={opt} onClick={() => handleAnswerChange(q.id, opt)}
                                                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${answers[q.id] === opt ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <input type={q.type} value={answers[q.id] || ''} onChange={e => handleAnswerChange(q.id, e.target.value)} className="w-full p-2 border rounded-md" />
                                )}
                            </div>
                        ))}
                        {surveyQuestions.social.map(q => (
                            <div key={q.id} className="mb-6 p-4 border rounded-lg bg-gray-50">
                                <label className="block text-gray-700 font-medium mb-2">{q.label}</label>
                                <div className="flex flex-wrap gap-2">
                                    {q.options.map(opt => (
                                        <button key={opt} onClick={() => handleAnswerChange(q.id, opt)}
                                            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${answers[q.id] === opt ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 4:
                const { phq9_score, gad7_score } = calculateScores(answers);
                return (
                    <div>
                        <h3 className="text-xl font-bold mb-4">Review Your Answers</h3>
                        <p className="mb-6">Please review your information before submitting. You can go back to change any answers.</p>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-100 rounded-lg">
                                <h4 className="font-semibold">Demographics</h4>
                                {surveyQuestions.demographics.map(q => <p key={q.id}>{q.label}: <span className="font-normal">{answers[q.id] || 'Not answered'}</span></p>)}
                            </div>
                            <div className="p-4 bg-gray-100 rounded-lg">
                                <h4 className="font-semibold">Calculated Scores</h4>
                                <p>PHQ-9 Score: {phq9_score}</p>
                                <p>GAD-7 Score: {gad7_score}</p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold mb-2">{sections[step]}</h2>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${((step + 1) / totalSteps) * 100}%` }}></div>
                </div>

                <div className="min-h-[400px]">
                    {renderStep()}
                </div>
                
                <div className="flex justify-between mt-8">
                    <button onClick={prevStep} disabled={step === 0 || isLoading} 
                        className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50">
                        Previous
                    </button>
                    {step < totalSteps - 1 ? (
                        <button onClick={nextStep} disabled={isLoading}
                            className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                            Next
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={isLoading}
                            className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-green-300">
                            {isLoading ? 'Submitting...' : 'Submit Assessment'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const ResultsPage = ({ result, setPage }) => {
    if (!result) {
        return (
            <div className="p-8 text-center">
                <p>No result to display. Please complete a survey first.</p>
                <button onClick={() => setPage('survey')} className="mt-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
                    Take Survey
                </button>
            </div>
        );
    }
    
    const { phq9_score, gad7_score, answers } = result;
    const depressionRisk = getRiskLevel(phq9_score);
    const anxietyRisk = getRiskLevel(gad7_score);
    const isHighRisk = phq9_score >= 15 || gad7_score >= 15 || answers.phq9_9 > 0;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-3xl font-bold mb-4 text-gray-800">Your Assessment Results</h2>
                <p className="text-gray-600 mb-8">This is a screening tool, not a diagnosis. The results can help you understand your well-being and decide on next steps.</p>

                {isHighRisk && (
                    <div className="p-4 mb-6 bg-red-100 border-l-4 border-red-500 text-red-700">
                        <div className="flex">
                            <div className="py-1"><AlertTriangle className="h-6 w-6 text-red-500 mr-4"/></div>
                            <div>
                                <p className="font-bold">Important: Immediate Support Recommended</p>
                                <p>Your responses indicate a high level of distress. It is strongly recommended that you speak with a mental health professional or contact a crisis line immediately.</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="p-6 rounded-lg border">
                        <h3 className="text-xl font-semibold mb-2">Depression (PHQ-9)</h3>
                        <p className="text-5xl font-bold mb-2">{phq9_score} <span className="text-2xl text-gray-500">/ 27</span></p>
                        <p className={`font-semibold px-3 py-1 inline-block rounded-full ${depressionRisk.bgColor} ${depressionRisk.color}`}>{depressionRisk.text}</p>
                    </div>
                    <div className="p-6 rounded-lg border">
                        <h3 className="text-xl font-semibold mb-2">Anxiety (GAD-7)</h3>
                        <p className="text-5xl font-bold mb-2">{gad7_score} <span className="text-2xl text-gray-500">/ 21</span></p>
                        <p className={`font-semibold px-3 py-1 inline-block rounded-full ${anxietyRisk.bgColor} ${anxietyRisk.color}`}>{anxietyRisk.text}</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Recommended Next Steps & Resources</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                        <li><span className="font-semibold">Track your mood over time:</span> Consider taking this assessment again in a few weeks to see how you're doing.</li>
                        <li><span className="font-semibold">Explore self-help resources:</span> Visit our Resources page for tools and strategies.</li>
                        <li><span className="font-semibold">Talk to someone you trust:</span> Sharing how you feel with a friend, family member, or counselor can help.</li>
                        { (phq9_score >= 10 || gad7_score >= 10) && <li><span className="font-semibold">Consider professional help:</span> Your scores suggest you may benefit from talking to a therapist or counselor.</li>}
                    </ul>
                    <div className="mt-6 flex flex-wrap gap-4">
                        <button onClick={() => setPage('resources')} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
                            View Resources
                        </button>
                        <button onClick={() => setPage('dashboard')} className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700">
                            Go to My Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ResourcesPage = () => (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Mental Health Resources </h2>
            <div className="space-y-8">
                <div>
                    <h3 className="text-2xl font-semibold mb-3 border-b-2 border-blue-200 pb-2">24/7 Crisis Intervention Hotlines</h3>
                    <p className="mb-2 text-gray-600">If you are in crisis or need immediate support, please contact one of these services. They are free and confidential.</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li><span className="font-semibold">KIRAN Mental Health Helpline:</span> 1800-599-0019 (Government of India)</li>
                        <li><span className="font-semibold">Vandrevala Foundation:</span> 9999666555</li>
                        <li><span className="font-semibold">AASRA:</span> 9820466726 (For emotional distress and suicide prevention)</li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-2xl font-semibold mb-3 border-b-2 border-blue-200 pb-2">Self-Help Tools & Coping Strategies</h3>
                    <ul className="list-disc list-inside space-y-2">
                        <li><span className="font-semibold">Mindfulness and Meditation:</span> Apps like Headspace, Calm, or free resources on YouTube can help reduce stress.</li>
                        <li><span className="font-semibold">Yoga & Pranayama:</span> Traditional Indian practices proven to reduce stress and improve mental clarity.</li>
                        <li><span className="font-semibold">Journaling:</span> Writing down your thoughts and feelings can provide clarity and relief.</li>
                        <li><span className="font-semibold">Physical Activity:</span> Regular exercise, even a short walk, is proven to boost mood.</li>
                        <li><span className="font-semibold">Breathing Exercises:</span> Try the 4-7-8 technique: inhale for 4 seconds, hold for 7, and exhale for 8.</li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-2xl font-semibold mb-3 border-b-2 border-blue-200 pb-2">Finding Professional Help</h3>
                    <p className="mb-2 text-gray-600">Check with your university's counseling center for free or low-cost services. You can also use online directories to find verified therapists.</p>
                    <ul className="list-disc list-inside space-y-2">
                        <li><span className="font-semibold">Online Platforms:</span> Websites like Practo, YourDOST, and Manastha have directories to find therapists in your area.</li>
                        <li><span className="font-semibold">Professional Bodies:</span> The Indian Association of Clinical Psychologists (IACP) website can also be a resource.</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

const StudentDashboard = ({ user, isAuthReady }) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user || !isAuthReady) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        const userSurveyPath = `artifacts/${appId}/users/${user.uid}/surveys`;
        const q = query(collection(db, userSurveyPath), orderBy('createdAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const results = [];
            querySnapshot.forEach((doc) => {
                results.push({ id: doc.id, ...doc.data() });
            });
            setHistory(results);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching survey history:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, isAuthReady]);

    if (isLoading) return <LoadingSpinner />;
    if (history.length === 0) return <p className="p-4 text-center text-gray-600">You have not completed any assessments yet.</p>;

    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold">Your Assessment History</h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {history.map(item => {
                        const depressionRisk = getRiskLevel(item.phq9_score);
                        const anxietyRisk = getRiskLevel(item.gad7_score);
                        return (
                            <li key={item.id} className="p-4 hover:bg-gray-50">
                                <div className="flex flex-wrap items-center justify-between">
                                    <p className="font-semibold text-gray-800">{item.createdAt.toDate().toLocaleDateString()}</p>
                                    <div className="flex gap-4 mt-2 sm:mt-0">
                                        <div className="text-sm">
                                            <span className="font-medium">PHQ-9:</span> {item.phq9_score} <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${depressionRisk.bgColor} ${depressionRisk.color}`}>{depressionRisk.text}</span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="font-medium">GAD-7:</span> {item.gad7_score} <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${anxietyRisk.bgColor} ${anxietyRisk.color}`}>{anxietyRisk.text}</span>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

const AdminDashboard = ({ isAuthReady }) => {
    const [allSubmissions, setAllSubmissions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthReady) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const publicSurveyPath = `artifacts/${appId}/public/data/anonymousSurveys`;
        const q = query(collection(db, publicSurveyPath), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const results = [];
            querySnapshot.forEach((doc) => {
                results.push({ id: doc.id, ...doc.data() });
            });
            setAllSubmissions(results);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching all submissions:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthReady]);
    
    const chartData = useMemo(() => {
        const riskCounts = {
            depression: { 'Low Risk': 0, 'Mild Risk': 0, 'Moderate Risk': 0, 'High Risk': 0 },
            anxiety: { 'Low Risk': 0, 'Mild Risk': 0, 'Moderate Risk': 0, 'High Risk': 0 },
        };
        allSubmissions.forEach(sub => {
            const depRisk = getRiskLevel(sub.phq9_score).text;
            const anxRisk = getRiskLevel(sub.gad7_score).text;
            if (riskCounts.depression[depRisk] !== undefined) riskCounts.depression[depRisk]++;
            if (riskCounts.anxiety[anxRisk] !== undefined) riskCounts.anxiety[anxRisk]++;
        });
        
        return {
            depression: {
                labels: Object.keys(riskCounts.depression),
                datasets: [{
                    label: 'Depression Risk Levels',
                    data: Object.values(riskCounts.depression),
                    backgroundColor: ['#4ade80', '#60a5fa', '#facc15', '#f87171'],
                }]
            },
            anxiety: {
                labels: Object.keys(riskCounts.anxiety),
                datasets: [{
                    label: 'Anxiety Risk Levels',
                    data: Object.values(riskCounts.anxiety),
                    backgroundColor: ['#4ade80', '#60a5fa', '#facc15', '#f87171'],
                }]
            }
        };
    }, [allSubmissions]);


    if (isLoading) return <LoadingSpinner />;
    if (allSubmissions.length === 0) return <p className="p-4 text-center text-gray-600">No anonymized data available yet.</p>;

    return (
        <div className="space-y-8">
            <h3 className="text-2xl font-bold">Administrator Dashboard (Aggregate Data)</h3>
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h4 className="text-xl font-semibold mb-4">Depression Risk Distribution</h4>
                    <Bar data={chartData.depression} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <h4 className="text-xl font-semibold mb-4">Anxiety Risk Distribution</h4>
                    <Bar data={chartData.anxiety} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                </div>
            </div>
            
            <div>
                <h4 className="text-xl font-semibold mb-4">Recent Submissions (Anonymized)</h4>
                <div className="bg-white rounded-lg shadow overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PHQ-9</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GAD-7</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year of Study</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {allSubmissions.slice(0, 10).map(sub => (
                                <tr key={sub.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{sub.createdAt.toDate().toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{sub.phq9_score}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{sub.gad7_score}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{sub.answers.yearOfStudy || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{sub.answers.gender || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const DashboardPage = ({ user, userRole, isAuthReady }) => {
    return (
        <div className="p-4 md:p-8">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h2>
            {userRole === 'student' && <StudentDashboard user={user} isAuthReady={isAuthReady} />}
            {userRole === 'admin' && <AdminDashboard isAuthReady={isAuthReady} />}
            {userRole === 'counselor' && <AdminDashboard isAuthReady={isAuthReady} />}
            {!isAuthReady && <LoadingSpinner />}
        </div>
    );
};


export default function App() {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [page, setPage] = useState('home');
    const [lastResult, setLastResult] = useState(null);
    const [notification, setNotification] = useState(null);

    useEffect(() => {
        let unsubRole = () => {};

        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            unsubRole();

            if (currentUser) {
                setUser(currentUser);
                const roleDocRef = doc(db, "roles", currentUser.uid);
                unsubRole = onSnapshot(roleDocRef, (docSnap) => {
                    setUserRole(docSnap.exists() ? docSnap.data().role : 'student');
                    setIsAuthReady(true);
                }, (error) => {
                    console.error("Error fetching role:", error);
                    setUserRole('student');
                    setIsAuthReady(true);
                });
            } else {
                setUser(null);
                setUserRole(null);
                setIsAuthReady(true);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubRole();
        };
    }, []);


    const handleSignOut = async () => {
        await signOut(auth);
        setPage('home');
        setNotification({ type: 'info', title: 'Signed Out', message: 'You have been successfully signed out.' });
    };
    
    const renderPage = () => {
        const pageVariants = {
            initial: {
                opacity: 0,
                x: "-100vw",
                scale: 0.8
            },
            in: {
                opacity: 1,
                x: 0,
                scale: 1
            },
            out: {
                opacity: 0,
                x: "100vw",
                scale: 1.2
            }
        };

        const pageTransition = {
            type: "tween",
            ease: "anticipate",
            duration: 0.5
        };

        return (
            <AnimatePresence mode="wait">
                <motion.div
                    key={page}
                    initial="initial"
                    animate="in"
                    exit="out"
                    variants={pageVariants}
                    transition={pageTransition}
                >
                    {(() => {
                        switch (page) {
                            case 'survey':
                                return <SurveyPage user={user} setPage={setPage} setLastResult={setLastResult} setNotification={setNotification} />;
                            case 'results':
                                return <ResultsPage result={lastResult} setPage={setPage} />;
                            case 'dashboard':
                                return <DashboardPage user={user} userRole={userRole} isAuthReady={isAuthReady} />;
                            case 'resources':
                                return <ResourcesPage />;
                            case 'biometric':
                                return <BiometricAnalysis />;
                            case 'home':
                            default:
                                return <HomePage3D setPage={setPage} />;
                        }
                    })()}
                </motion.div>
            </AnimatePresence>
        );
    };
    
    if (!isAuthReady) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user) {
        return (
            <>
                {notification && <CustomModal {...notification} onClose={() => setNotification(null)} />}
                <AuthPage setNotification={setNotification} />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            {notification && <CustomModal {...notification} onClose={() => setNotification(null)} />}
            <nav className="bg-white shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <button onClick={() => setPage('home')} className="flex-shrink-0 text-blue-600 font-bold text-xl">
                                MindSerenity
                            </button>
                            <div className="hidden md:block">
                                <div className="ml-10 flex items-baseline space-x-4">
                                    <button onClick={() => setPage('home')} className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">Home</button>
                                    <button onClick={() => setPage('dashboard')} className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">Dashboard</button>
                                    <button onClick={() => setPage('resources')} className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">Resources</button>
                                    <button onClick={() => setPage('biometric')} className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-md text-sm font-medium">Biometric Analysis</button>
                                    {userRole === 'admin' && <span className="text-blue-500 bg-blue-100 px-3 py-2 rounded-md text-sm font-medium">Admin View</span>}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <span className="text-sm text-gray-600 mr-4 hidden sm:block">{user.email || 'Anonymous User'}</span>
                            <button onClick={handleSignOut} className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                <LogOut className="h-5 w-5"/>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
            <main>
                {renderPage()}
            </main>
            <footer className="text-center p-4 text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} MindSerenity Platform. For research and educational purposes only.
            </footer>
        </div>
    );
}
