import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
    try {
        // Supprimer le cookie d'authentification
        const cookieStore = cookies();
        cookieStore.delete('auth_token');

        return NextResponse.json({ message: 'Déconnexion réussie' });
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        return NextResponse.json(
            { message: 'Erreur serveur lors de la déconnexion' },
            { status: 500 }
        );
    }
} 