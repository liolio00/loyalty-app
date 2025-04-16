"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { Navigation } from '@/components/layout/Navigation';
import { useAuth } from '@/lib/auth/AuthProvider';

type ProfileFormData = {
    firstName: string;
    lastName: string;
    email: string;
};

export default function Profile() {
    const router = useRouter();
    const { user, logout, updateProfile, deleteAccount } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
        defaultValues: {
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
        }
    });

    const onSubmit = async (data: ProfileFormData) => {
        setIsSubmitting(true);

        try {
            await updateProfile(data);
            alert('Profil mis à jour avec succès');
        } catch (error: any) {
            alert(`Erreur: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await deleteAccount();
            // La redirection se fait dans le fournisseur d'authentification
        } catch (error: any) {
            alert(`Erreur: ${error.message}`);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <div className="min-h-screen pb-20">
            <header className="bg-blue text-white p-4 flex items-center">
                <button onClick={() => router.back()} className="mr-4">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold">Mon Profil</h1>
            </header>

            <div className="p-4">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 bg-light-blue rounded-full flex items-center justify-center mb-3">
                        <UserCircleIcon className="w-16 h-16 text-blue" />
                    </div>
                    <h2 className="text-xl font-semibold">
                        {user?.firstName || ''} {user?.lastName || ''}
                    </h2>
                    <p className="text-gray-500">{user?.email}</p>
                </div>

                <div className="card mb-6">
                    <h3 className="text-lg font-semibold mb-4">Informations personnelles</h3>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                Prénom
                            </label>
                            <input
                                id="firstName"
                                type="text"
                                className={`input ${errors.firstName ? 'border-red-500' : ''}`}
                                {...register('firstName')}
                            />
                        </div>

                        <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                Nom
                            </label>
                            <input
                                id="lastName"
                                type="text"
                                className={`input ${errors.lastName ? 'border-red-500' : ''}`}
                                {...register('lastName')}
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className={`input ${errors.email ? 'border-red-500' : ''}`}
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
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Mise à jour...
                                    </div>
                                ) : 'Mettre à jour le profil'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => logout()}
                        className="btn-secondary w-full"
                    >
                        Déconnexion
                    </button>

                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full py-2 px-4 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-all"
                        >
                            Supprimer mon compte
                        </button>
                    ) : (
                        <div className="card bg-red-50 border border-red-200">
                            <p className="text-red-600 font-medium mb-3">
                                Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2 px-4 bg-gray-200 rounded-md"
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md"
                                >
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Navigation />
        </div>
    );
} 