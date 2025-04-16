import React from 'react';

export const SplashScreen = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#B6D8F2] to-[#F7F6CF]">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8">
                <span className="text-5xl font-bold text-[#5784BA]">L</span>
            </div>
            <h1 className="text-3xl font-bold text-[#5784BA] mb-2">Loyalty</h1>
            <p className="text-gray-600">Vos cartes de fidélité en un seul endroit</p>
            <div className="mt-8">
                <div className="w-8 h-8 border-4 border-[#5784BA] border-t-transparent rounded-full animate-spin"></div>
            </div>
        </div>
    );
}; 