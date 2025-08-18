
import React from 'react';
import EmotionAnalyzer from './EmotionAnalyzer';
import ToneAnalyzer from './ToneAnalyzer';

const BiometricAnalysis = () => {
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-gray-800">Comprehensive Biometric Analysis</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <EmotionAnalyzer />
                </div>
                <div>
                    <ToneAnalyzer />
                </div>
            </div>
        </div>
    );
};

export default BiometricAnalysis;
