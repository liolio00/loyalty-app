import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
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
        ) as { userId: number; email: string };

        // Récupérer les données de la requête
        const body = await request.json();
        const { firstName, lastName, email } = body;

        // Valider les données
        if (!email) {
            return new NextResponse(
                JSON.stringify({ message: 'L\'email est requis' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Vérifier si l'email est déjà utilisé par un autre utilisateur
        if (email !== decoded.email) {
            const existingUser = await prisma.user.findUnique({
                where: { email }
            });

            if (existingUser) {
                return new NextResponse(
                    JSON.stringify({ message: 'Cette adresse email est déjà utilisée' }),
                    {
                        status: 409,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }
        }

        // Mettre à jour l'utilisateur
        const updatedUser = await prisma.user.update({
            where: { email: decoded.email },
            data: {
                firstName: firstName || null,
                lastName: lastName || null,
                email: email,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
            }
        });

        return new NextResponse(
            JSON.stringify(updatedUser),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
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
            JSON.stringify({ message: 'Une erreur est survenue lors de la mise à jour du profil' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
} 