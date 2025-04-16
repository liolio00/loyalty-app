import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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
        console.log('Début de la requête de connexion');

        // Vérifier que la requête est bien au format JSON
        const contentType = request.headers.get('content-type');
        console.log('Content-Type:', contentType);

        if (!contentType || !contentType.includes('application/json')) {
            console.error('Type de contenu invalide:', contentType);
            return new NextResponse(
                JSON.stringify({ message: 'Type de contenu invalide. Utilisez application/json' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Lire le corps de la requête une seule fois
        let body;
        try {
            const rawBody = await request.text();
            console.log('Corps brut de la requête:', rawBody);
            body = JSON.parse(rawBody);
        } catch (error) {
            console.error('Erreur lors de la lecture du corps de la requête:', error);
            return new NextResponse(
                JSON.stringify({ message: 'Erreur lors de la lecture des données' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        console.log('Corps de la requête parsé:', { ...body, password: '[REDACTED]' });

        const { email, password } = body;

        // Vérifier que tous les champs requis sont présents
        if (!email || !password) {
            console.error('Champs requis manquants:', { email: !!email, password: !!password });
            return new NextResponse(
                JSON.stringify({ message: 'Veuillez fournir un email et un mot de passe' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Rechercher l'utilisateur dans la base de données
        console.log('Recherche de l\'utilisateur:', email);
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // Vérifier si l'utilisateur existe et est actif
        if (!user || !user.isActive) {
            console.log('Utilisateur non trouvé ou inactif');
            return new NextResponse(
                JSON.stringify({ message: 'Identifiants incorrects' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Vérifier le mot de passe
        console.log('Vérification du mot de passe');
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            console.log('Mot de passe incorrect');
            return new NextResponse(
                JSON.stringify({ message: 'Identifiants incorrects' }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Mettre à jour la date de dernière connexion
        console.log('Mise à jour de la date de dernière connexion');
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Créer un token JWT
        console.log('Création du token JWT');
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'default-secret-key',
            { expiresIn: '24h' }
        );

        // Définir le cookie avec le token
        console.log('Définition du cookie');
        const cookieStore = cookies();
        cookieStore.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 86400, // 24 heures
        });

        // Renvoyer les informations utilisateur sans le mot de passe
        console.log('Connexion réussie');
        return new NextResponse(
            JSON.stringify({
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                },
                message: 'Connexion réussie',
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        return new NextResponse(
            JSON.stringify({ message: 'Erreur serveur lors de la connexion' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
} 