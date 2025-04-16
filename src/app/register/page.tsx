"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthProvider';

type RegisterFormData = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export default function Register() {
    const router = useRouter();
    const { register } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register: registerField, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormData>();

    const password = watch('password', '');

    const onSubmit = async (data: RegisterFormData) => {
        if (data.password !== data.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await register({
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
            });
            // La redirection se fait dans le fournisseur d'authentification
        } catch (error: any) {
            setError(error.message || 'Erreur lors de l\'inscription');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-light-blue to-cream p-4">
            <div className="pt-4">
                <button onClick={() => router.back()} className="p-2">
                    <ArrowLeftIcon className="w-6 h-6 text-blue" />
                </button>
            </div>

            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-8">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-blue">Créer un compte</h1>
                    <p className="text-gray-600 mt-1">Rejoignez Loyalty et stockez toutes vos cartes de fidélité</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                <div className="card">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Prénom
                                </label>
                                <input
                                    id="firstName"
                                    type="text"
                                    className={`input ${errors.firstName ? 'border-red-500' : ''}`}
                                    {...registerField('firstName')}
                                />
                            </div>

                            <div className="flex-1">
                                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom
                                </label>
                                <input
                                    id="lastName"
                                    type="text"
                                    className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                                    {...registerField('lastName')}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className={`input ${errors.email ? 'border-red-500' : ''}`}
                                placeholder="votre@email.com"
                                {...registerField('email', {
                                    required: 'L\'email est requis',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Adresse email invalide'
                                    }
                                })}
                            />
                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Mot de passe
                            </label>
                            <input
                                id="password"
                                type="password"
                                className={`input ${errors.password ? 'border-red-500' : ''}`}
                                {...registerField('password', {
                                    required: 'Le mot de passe est requis',
                                    minLength: {
                                        value: 8,
                                        message: 'Le mot de passe doit contenir au moins 8 caractères'
                                    }
                                })}
                            />
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                Confirmer le mot de passe
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className={`input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                {...registerField('confirmPassword', {
                                    required: 'Veuillez confirmer votre mot de passe',
                                    validate: value => value === password || 'Les mots de passe ne correspondent pas'
                                })}
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="btn-primary w-full"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Inscription...
                                    </div>
                                ) : 'S\'inscrire'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Vous avez déjà un compte ?{' '}
                        <Link href="/login" className="text-blue hover:underline font-semibold">
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
} 