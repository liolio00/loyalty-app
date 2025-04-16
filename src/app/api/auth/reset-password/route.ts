import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Créer une instance singleton de PrismaClient
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export async function POST(request: NextRequest) {
    try {
        // Vérifier que la requête est bien au format JSON
        const contentType = request.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return new NextResponse(
                JSON.stringify({ message: 'Type de contenu invalide. Utilisez application/json' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Lire le corps de la requête
        const body = await request.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return new NextResponse(
                JSON.stringify({ message: 'Token et nouveau mot de passe requis' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Rechercher l'utilisateur avec le token de réinitialisation
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
            return new NextResponse(
                JSON.stringify({ message: 'Token de réinitialisation invalide ou expiré' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour le mot de passe et effacer le token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return new NextResponse(
            JSON.stringify({ message: 'Mot de passe réinitialisé avec succès' }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Erreur lors de la réinitialisation du mot de passe:', error);
        return new NextResponse(
            JSON.stringify({ message: 'Une erreur est survenue lors de la réinitialisation du mot de passe' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
} 