"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/auth/AuthProvider';

type ForgotPasswordFormData = {
    email: string;
};

export default function ForgotPassword() {
    const router = useRouter();
    const { forgotPassword } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>();

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            await forgotPassword(data.email);
            setSuccess(true);
        } catch (error: any) {
            setError(error.message || 'Erreur lors de la demande de réinitialisation');
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
                    <h1 className="text-2xl font-bold text-blue">Mot de passe oublié</h1>
                    <p className="text-gray-600 mt-1">
                        Nous vous enverrons un lien pour réinitialiser votre mot de passe
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {success ? (
                    <div className="card text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-semibold mb-2">Email envoyé</h2>
                        <p className="text-gray-600 mb-6">
                            Si un compte existe avec cette adresse email, vous recevrez un lien pour réinitialiser votre mot de passe.
                        </p>
                        <Link href="/login" className="btn-primary block w-full">
                            Retour à la connexion
                        </Link>
                    </div>
                ) : (
                    <div className="card">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    className={`input ${errors.email ? 'border-red-500' : ''}`}
                                    placeholder="votre@email.com"
                                    {...register('email', {
                                        required: 'L\'email est requis',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Adresse email invalide'
                                        }
                                    })}
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
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
                                            Envoi...
                                        </div>
                                    ) : 'Envoyer le lien de réinitialisation'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

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