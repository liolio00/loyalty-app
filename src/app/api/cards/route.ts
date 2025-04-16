import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getLogoUrl } from '@/lib/utils/logoMapping';
import prisma from '@/lib/prisma';

const prismaClient = new PrismaClient();

export async function GET(request: Request) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'default_secret'
        ) as { userId: string; email: string };

        // Récupérer les cartes de l'utilisateur
        const userCards = await prismaClient.loyaltyCard.findMany({
            where: {
                userId: parseInt(decoded.userId),
            },
            include: {
                shares: {
                    include: {
                        sharedWithUser: {
                            select: {
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        // Récupérer les cartes partagées avec l'utilisateur
        const sharedCards = await prismaClient.$queryRaw`
            SELECT 
                l.*,
                u.email as sharedByEmail,
                'shared' as cardSource
            FROM LoyaltyCard l
            JOIN LoyaltyCardShare s ON l.id = s.cardId
            JOIN User u ON s.sharedBy = u.id
            WHERE s.sharedWith = ${parseInt(decoded.userId)}
        `;

        // Marquer les cartes de l'utilisateur
        const markedUserCards = userCards.map(card => ({
            ...card,
            cardSource: 'owned'
        }));

        // Combiner et trier toutes les cartes par nom de magasin
        const allCards = [...markedUserCards, ...sharedCards].sort((a, b) =>
            a.shopName.localeCompare(b.shopName)
        );

        return NextResponse.json(allCards);
    } catch (error) {
        console.error('Erreur lors de la récupération des cartes:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log('Début de la création de carte');
        // Vérifier l'authentification
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            console.log('Token non trouvé');
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
        console.log('Token décodé:', decoded);

        // Récupérer les données de la requête
        const body = await request.json();
        console.log('Données reçues:', body);
        const { shopName, cardType, cardCode, notes } = body;

        // Valider les données requises
        if (!shopName || !cardType || !cardCode) {
            console.log('Données manquantes');
            return new NextResponse(
                JSON.stringify({ message: 'Tous les champs obligatoires doivent être remplis' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Créer la carte
        console.log('Création de la carte avec les données:', {
            name: shopName,
            shopName,
            logoUrl: getLogoUrl(shopName),
            notes: notes || null,
            cardType,
            cardCode,
            userId: decoded.userId
        });
        const card = await prismaClient.loyaltyCard.create({
            data: {
                name: shopName,
                shopName,
                logoUrl: getLogoUrl(shopName),
                notes: notes || null,
                cardType,
                cardCode,
                userId: decoded.userId,
                updatedAt: new Date()
            },
            include: {
                User: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });
        console.log('Carte créée:', card);

        return new NextResponse(
            JSON.stringify(card),
            {
                status: 201,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Erreur lors de la création de la carte:', error);
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
            JSON.stringify({ message: 'Une erreur est survenue lors de la création de la carte' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
} 