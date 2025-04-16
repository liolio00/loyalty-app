import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function DELETE(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return new NextResponse(
                JSON.stringify({ message: 'Non autorisé' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'default_secret'
        ) as { userId: string; email: string };

        // Supprimer toutes les cartes de l'utilisateur
        await prisma.loyaltyCard.deleteMany({
            where: { userId: decoded.userId }
        });

        // Supprimer l'utilisateur
        await prisma.user.delete({
            where: { id: decoded.userId }
        });

        // Supprimer le cookie d'authentification
        const response = new NextResponse(
            JSON.stringify({ message: 'Compte supprimé avec succès' }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );

        response.cookies.delete('auth_token');

        return response;
    } catch (error) {
        console.error('Erreur lors de la suppression du compte:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return new NextResponse(
                JSON.stringify({ message: 'Session expirée, veuillez vous reconnecter' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        return new NextResponse(
            JSON.stringify({ message: 'Une erreur est survenue lors de la suppression du compte' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
} 