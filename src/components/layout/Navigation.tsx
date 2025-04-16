"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, CreditCardIcon, UserIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthProvider';

export const Navigation = () => {
    const pathname = usePathname();
    const { user } = useAuth();

    // Ne pas afficher la navigation sur les pages d'authentification
    if (!user || pathname.startsWith('/login') || pathname.startsWith('/register') ||
        pathname.startsWith('/forgot-password') || pathname.startsWith('/reset-password')) {
        return null;
    }

    const navItems = [
        { name: 'Accueil', href: '/', icon: HomeIcon },
        { name: 'Ajouter', href: '/add-card', icon: PlusCircleIcon },
        { name: 'Profil', href: '/profile', icon: UserIcon },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-10">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full ${isActive ? 'text-blue' : 'text-gray-500'
                                }`}
                        >
                            <item.icon className="w-6 h-6" />
                            <span className="text-xs mt-1">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}; 