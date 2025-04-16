"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type User = {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (userData: { email: string; password: string; firstName?: string; lastName?: string }) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (token: string, newPassword: string) => Promise<void>;
    updateProfile: (data: { firstName?: string; lastName?: string; email?: string }) => Promise<void>;
    deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Vérifier si l'utilisateur est connecté au chargement
        const checkAuth = async () => {
            try {
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const userData = await res.json();
                    setUser(userData);
                }
            } catch (error) {
                console.error('Erreur lors de la vérification de l\'authentification:', error);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Rediriger l'utilisateur selon son état de connexion
    useEffect(() => {
        if (loading) return;

        console.log('État de l\'utilisateur:', { user, pathname, loading });
        const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
        const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

        if (!user && !isPublicRoute) {
            console.log('Redirection vers /login car utilisateur non connecté');
            router.push('/login');
        } else if (user && isPublicRoute) {
            console.log('Redirection vers / car utilisateur connecté sur une route publique');
            router.push('/');
        }
    }, [user, loading, pathname, router]);

    const login = async (email: string, password: string) => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Erreur lors de la connexion');
            }

            const userData = await res.json();
            setUser(userData.user);
            // Redirection directe vers la page d'accueil
            router.push('/');
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    };

    const register = async (userData: { email: string; password: string; firstName?: string; lastName?: string }) => {
        setLoading(true);
        try {
            console.log('Envoi de la requête d\'inscription:', userData);
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });

            console.log('Statut de la réponse:', res.status);
            console.log('Type de contenu:', res.headers.get('content-type'));

            // Vérifier le type de contenu de la réponse
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('La réponse du serveur n\'est pas au format JSON');
            }

            // Lire le corps de la réponse
            const responseText = await res.text();
            console.log('Réponse brute:', responseText);

            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (error) {
                console.error('Erreur lors du parsing de la réponse:', error);
                throw new Error('Erreur lors de la lecture de la réponse du serveur');
            }

            if (!res.ok) {
                throw new Error(responseData.message || 'Erreur lors de l\'inscription');
            }

            console.log('Réponse d\'inscription:', responseData);

            // Connecter automatiquement l'utilisateur après l'inscription
            const loginRes = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userData.email,
                    password: userData.password,
                }),
            });

            if (!loginRes.ok) {
                throw new Error('Erreur lors de la connexion automatique');
            }

            const loginData = await loginRes.json();
            setUser(loginData.user);

            // Attendre un court instant avant la redirection
            await new Promise(resolve => setTimeout(resolve, 500));

            // Rediriger vers la page d'accueil
            router.push('/');
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const forgotPassword = async (email: string) => {
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Erreur lors de la demande de réinitialisation');
            }
        } catch (error) {
            console.error('Erreur lors de la demande de réinitialisation:', error);
            throw error;
        }
    };

    const resetPassword = async (token: string, newPassword: string) => {
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Erreur lors de la réinitialisation du mot de passe');
            }

            router.push('/login?reset=true');
        } catch (error) {
            console.error('Erreur lors de la réinitialisation du mot de passe:', error);
            throw error;
        }
    };

    const updateProfile = async (data: { firstName?: string; lastName?: string; email?: string }) => {
        try {
            const res = await fetch('/api/auth/update-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Erreur lors de la mise à jour du profil');
            }

            // Mettre à jour l'utilisateur dans le contexte
            const userData = await res.json();
            setUser(userData);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil:', error);
            throw error;
        }
    };

    const deleteAccount = async () => {
        try {
            const res = await fetch('/api/auth/delete-account', {
                method: 'DELETE',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || 'Erreur lors de la suppression du compte');
            }

            setUser(null);
            router.push('/login?deleted=true');
        } catch (error) {
            console.error('Erreur lors de la suppression du compte:', error);
            throw error;
        }
    };

    const value = {
        user,
        loading,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword,
        updateProfile,
        deleteAccount,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 