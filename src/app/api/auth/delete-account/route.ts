import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
    try {
        const token = cookies().get('auth-token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as {
            userId: number;
            email: string;
        };

        if (!decoded.userId) {
            return NextResponse.json(
                { error: 'Token invalide' },
                { status: 401 }
            );
        }

        // Supprimer toutes les cartes de l'utilisateur
        await prisma.loyaltyCard.deleteMany({
            where: { userId: decoded.userId }
        });

        // Supprimer l'utilisateur
        await prisma.user.delete({
            where: { id: decoded.userId }
        });

        // Supprimer le cookie d'authentification
        cookies().delete('auth-token');

        return NextResponse.json({ message: 'Compte supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du compte:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la suppression du compte' },
            { status: 500 }
        );
    }
} 