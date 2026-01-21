import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Mail, Lock, User, ArrowRight, Loader2, HeartPulse, Brain, Sparkles } from 'lucide-react';

const AuthPage = ({ setNotification, auth, db }) => {
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
                setNotification({ type: 'success', title: 'Login Successful', message: 'Welcome back to MindWell!' });
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const userRolePath = doc(db, "roles", userCredential.user.uid);
                await setDoc(userRolePath, { role: 'student' });
                setNotification({ type: 'success', title: 'Account Created', message: 'Your personal space is ready.' });
                setIsLogin(true);
            }
        } catch (error) {
            console.error("Authentication error:", error);
            let msg = "Something went wrong.";
            if (error.code === 'auth/wrong-password') msg = "Incorrect password.";
            if (error.code === 'auth/user-not-found') msg = "No account found with this email.";
            if (error.code === 'auth/email-already-in-use') msg = "Email already in use.";
            setNotification({ type: 'error', title: 'Authentication Failed', message: msg });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setNotification(null);
    };

    return (
        <div className="flex min-h-screen bg-gray-50 overflow-hidden relative">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="flex flex-col md:flex-row w-full max-w-6xl mx-auto z-10 my-auto shadow-2xl rounded-2xl overflow-hidden bg-white min-h-[600px]">
                
                {/* Visual Side (Left on Desktop) */}
                <motion.div 
                    className={`hidden md:flex flex-col justify-center items-center w-full md:w-1/2 p-12 text-white transition-colors duration-500 ease-in-out ${isLogin ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-indigo-600 to-purple-700'}`}
                    initial={false}
                    animate={{ x: 0 }}
                    transition={{ type: "spring", stiffness: 100 }}
                >
                    <motion.div
                        key={isLogin ? "login-visual" : "signup-visual"}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="text-center"
                    >
                         {isLogin ? (
                            <>
                                <div className="mb-6 bg-white/20 p-6 rounded-full inline-block backdrop-blur-sm">
                                    <Brain size={64} className="text-white" />
                                </div>
                                <h2 className="text-4xl font-bold mb-4">Welcome Back</h2>
                                <p className="text-lg text-blue-100 max-w-sm">
                                    Continue your journey towards peace, balance, and mindfulness. We missed you!
                                </p>
                            </>
                        ) : (
                            <>
                                <div className="mb-6 bg-white/20 p-6 rounded-full inline-block backdrop-blur-sm">
                                    <Sparkles size={64} className="text-white" />
                                </div>
                                <h2 className="text-4xl font-bold mb-4">Join MindWell</h2>
                                <p className="text-lg text-indigo-100 max-w-sm">
                                    Start your assessment, track your growth, and find the resources you need today.
                                </p>
                            </>
                        )}
                    </motion.div>
                </motion.div>

                {/* Form Side (Right on Desktop) */}
                <div className="w-full md:w-1/2 p-8 md:p-12 bg-white flex flex-col justify-center relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                         <h3 className="text-3xl font-bold text-gray-800 mb-2">
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </h3>
                         <p className="text-gray-500 mb-8">
                            {isLogin ? 'Enter your details to access your account' : 'Fill in the form below to get started'}
                        </p>

                        <form onSubmit={handleAuth} className="space-y-6">
                            <div className="space-y-4">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                        placeholder="Email Address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none bg-gray-50 focus:bg-white"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Forgot Password for Login only - Placeholder link */}
                            {isLogin && (
                                <div className="flex justify-end">
                                    <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Forgot password?</a>
                                </div>
                            )}

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3 rounded-xl text-white font-bold shadow-lg flex justify-center items-center gap-2 transition-all ${
                                    isLogin 
                                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                }`}
                            >
                                {isLoading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        {isLogin ? 'Sign In' : 'Get Started'}
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div className="mt-8 text-center text-sm text-gray-600">
                             {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button 
                                onClick={toggleMode} 
                                className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                {isLogin ? 'Sign up for free' : 'Sign in here'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
