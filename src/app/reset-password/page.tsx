"use client";

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth/AuthProvider';

type ResetPasswordFormData = {
    password: string;
    confirmPassword: string;
};

export default function ResetPassword() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { resetPassword } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors }, watch } = useForm<ResetPasswordFormData>();

    const password = watch('password', '');

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            setError('Token de réinitialisation manquant ou invalide');
            return;
        }

        if (data.password !== data.confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await resetPassword(token, data.password);
            // La redirection se fait dans le fournisseur d'authentification
        } catch (error: any) {
            setError(error.message || 'Erreur lors de la réinitialisation du mot de passe');
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-b from-light-blue to-cream p-4">
                <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-8">
                    <div className="card text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Lien invalide</h2>
                        <p className="text-gray-600 mb-6">
                            Ce lien de réinitialisation de mot de passe est invalide ou a expiré.
                        </p>
                        <Link href="/forgot-password" className="btn-primary block w-full">
                            Demander un nouveau lien
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-light-blue to-cream p-4">
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-8">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-blue">Réinitialiser le mot de passe</h1>
                    <p className="text-gray-600 mt-1">
                        Créez un nouveau mot de passe pour votre compte
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                <div className="card">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Nouveau mot de passe
                            </label>
                            <input
                                id="password"
                                type="password"
                                className={`input ${errors.password ? 'border-red-500' : ''}`}
                                {...register('password', {
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
                                {...register('confirmPassword', {
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
                                        Réinitialisation...
                                    </div>
                                ) : 'Réinitialiser le mot de passe'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        <Link href="/login" className="text-blue hover:underline font-semibold">
                            Retour à la connexion
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
} 