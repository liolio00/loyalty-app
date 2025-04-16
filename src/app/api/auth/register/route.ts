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

// Expression régulière pour valider l'email
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

export async function POST(request: NextRequest) {
    try {
        console.log('Début de la requête d\'inscription');

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

        const { email, password, firstName, lastName } = body;

        // Vérifier que tous les champs requis sont présents
        if (!email || !password || !firstName || !lastName) {
            console.error('Champs requis manquants:', {
                email: !!email,
                password: !!password,
                firstName: !!firstName,
                lastName: !!lastName
            });
            return new NextResponse(
                JSON.stringify({ message: 'Veuillez fournir tous les champs requis : email, mot de passe, prénom et nom' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Valider le format de l'email
        if (!EMAIL_REGEX.test(email)) {
            console.error('Format d\'email invalide:', email);
            return new NextResponse(
                JSON.stringify({ message: 'Format d\'email invalide' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Vérifier si l'email est déjà utilisé
        console.log('Vérification de l\'email existant:', email);
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            console.log('Email déjà utilisé');
            return new NextResponse(
                JSON.stringify({ message: 'Cette adresse email est déjà utilisée' }),
                {
                    status: 409,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Hasher le mot de passe
        console.log('Hachage du mot de passe');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer un nouvel utilisateur
        console.log('Création du nouvel utilisateur');
        try {
            const newUser = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    firstName: firstName || null,
                    lastName: lastName || null,
                    updatedAt: new Date(),
                },
            });
            console.log('Utilisateur créé avec succès:', newUser.id);
            return new NextResponse(
                JSON.stringify({ message: 'Inscription réussie' }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        } catch (error: any) {
            console.error('Erreur lors de la création de l\'utilisateur:', error);
            if (error.code === 'P2002') {
                return new NextResponse(
                    JSON.stringify({ message: 'Cette adresse email est déjà utilisée' }),
                    {
                        status: 409,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }
            throw error;
        }
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        return new NextResponse(
            JSON.stringify({ message: 'Une erreur est survenue lors de l\'inscription' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}