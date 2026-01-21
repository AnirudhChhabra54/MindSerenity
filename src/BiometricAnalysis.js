
// import React from 'react';
// import EmotionAnalyzer from './EmotionAnalyzer';
// import ToneAnalyzer from './ToneAnalyzer';

// const BiometricAnalysis = () => {
//     return (
//         <div className="p-4 md:p-8 max-w-7xl mx-auto">
//             <h1 className="text-4xl font-bold mb-8 text-gray-800">Comprehensive Biometric Analysis</h1>
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                 <div>
//                     <EmotionAnalyzer />
//                 </div>
//                 <div>
//                     <ToneAnalyzer />
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default BiometricAnalysis;

import React from 'react';
import EmotionAnalyzer from './EmotionAnalyzer'; // Make sure this path is correct

const BiometricAnalysis = () => {
    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-gray-800">Biometric Analysis</h1>
            
            {/* We are now only showing the Emotion Analyzer, centered on the page */}
            <div className="bg-white rounded-xl shadow-lg">
                <EmotionAnalyzer />
            </div>
        </div>
    );
};

export default BiometricAnalysis;