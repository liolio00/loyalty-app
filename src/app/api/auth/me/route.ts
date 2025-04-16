import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Indiquer à Next.js que cette route est dynamique
export const dynamic = 'force-dynamic';

// Créer une instance singleton de PrismaClient
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export async function GET(request: NextRequest) {
    try {
        console.log('Début de la requête de vérification d\'authentification');

        // Récupérer le token d'authentification du cookie
        const cookieStore = cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            console.log('Aucun token trouvé');
            return new NextResponse(
                JSON.stringify({ message: 'Non authentifié' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Vérifier et décoder le token
        console.log('Vérification du token');
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'default_secret'
        ) as { userId: string; email: string };

        // Récupérer les informations de l'utilisateur
        console.log('Récupération des informations utilisateur:', decoded.userId);
        const user = await prisma.user.findUnique({
            where: { id: parseInt(decoded.userId, 10) },
        });

        if (!user || !user.isActive) {
            console.log('Utilisateur non trouvé ou inactif');
            return new NextResponse(
                JSON.stringify({ message: 'Utilisateur non trouvé ou inactif' }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Renvoyer les informations utilisateur sans le mot de passe
        console.log('Utilisateur authentifié:', user.id);
        return new NextResponse(
            JSON.stringify({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        // Si le token est invalide ou expiré
        if (error instanceof jwt.JsonWebTokenError) {
            console.error('Token invalide ou expiré:', error);
            return new NextResponse(
                JSON.stringify({ message: 'Session expirée, veuillez vous reconnecter' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        console.error('Erreur lors de la récupération des informations utilisateur:', error);
        return new NextResponse(
            JSON.stringify({ message: 'Erreur serveur' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
} 