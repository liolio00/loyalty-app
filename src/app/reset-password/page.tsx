"use client";

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth/AuthProvider';

type ResetPasswordFormData = {
    password: string;
    confirmPassword: string;
};

function ResetPasswordContent() {
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-light-blue to-cream px-4">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-blue mb-2">Token invalide</h2>
                        <p className="text-gray-600 mb-4">Le lien de réinitialisation de mot de passe est invalide ou a expiré.</p>
                        <Link href="/forgot-password" className="text-blue hover:underline">
                            Demander un nouveau lien
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-light-blue to-cream px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-blue mb-2">Réinitialiser le mot de passe</h2>
                    <p className="text-gray-600">Entrez votre nouveau mot de passe</p>
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

export default function ResetPassword() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-light-blue to-cream">
                <div className="w-8 h-8 border-4 border-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
} 