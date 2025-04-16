"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth/AuthProvider';

type LoginFormData = {
    email: string;
    password: string;
};

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Vérifier si l'utilisateur vient de s'inscrire, de réinitialiser son mot de passe ou de supprimer son compte
    const registered = searchParams.get('registered');
    const reset = searchParams.get('reset');
    const deleted = searchParams.get('deleted');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login(email, password);
            // La redirection est gérée par l'AuthProvider
        } catch (err) {
            setError('Email ou mot de passe incorrect');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-light-blue to-cream px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg transform transition-all animate-fade-in">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-blue mb-2">Connexion</h2>
                    <p className="text-gray-600">Bienvenue sur Loyalty App</p>
                </div>

                {/* Messages de notification */}
                {registered && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                        Inscription réussie ! Vous pouvez maintenant vous connecter.
                    </div>
                )}

                {reset && (
                    <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                        Votre mot de passe a été réinitialisé avec succès.
                    </div>
                )}

                {deleted && (
                    <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md">
                        Votre compte a été désactivé avec succès.
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm animate-shake">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Adresse email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input w-full bg-gray-50 border border-gray-300 focus:border-blue focus:ring-2 focus:ring-blue-200 transition-all"
                                placeholder="exemple@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input w-full bg-gray-50 border border-gray-300 focus:border-blue focus:ring-2 focus:ring-blue-200 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Link
                            href="/forgot-password"
                            className="text-sm text-blue hover:text-light-blue-alt transition-colors"
                        >
                            Mot de passe oublié ?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full bg-blue hover:bg-light-blue-alt transform transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Connexion en cours...
                            </div>
                        ) : (
                            'Se connecter'
                        )}
                    </button>

                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            Pas encore de compte ?{' '}
                            <Link
                                href="/register"
                                className="text-blue hover:text-light-blue-alt font-medium transition-colors"
                            >
                                S'inscrire
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Login() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-light-blue to-cream">
                <div className="w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}