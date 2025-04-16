"use client";

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export const SplashScreen = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue via-sky-blue to-light-blue flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                    <span className="text-5xl font-bold text-blue">L</span>
                </div>
                <h1 className="text-3xl font-bold text-white">Loyalty</h1>
                <div className="mt-8">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    );
}; 