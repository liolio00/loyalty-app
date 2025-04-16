import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, LoyaltyCard } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getLogoUrl } from '@/lib/utils/logoMapping';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

        // Récupérer les cartes de l'utilisateur
        const userCards = await prisma.loyaltyCard.findMany({
            where: {
                userId: decoded.userId
            },
            include: {
                shares: {
                    include: {
                        sharedWithUser: {
                            select: {
                                email: true
                            }
                        }
                    }
                }
            }
        });

        // Marquer les cartes de l'utilisateur
        const markedUserCards = userCards.map(card => ({
            ...card,
            cardSource: 'owned' as const
        }));

        // Récupérer les cartes partagées avec l'utilisateur
        const sharedWithUser = await prisma.loyaltyCardShare.findMany({
            where: {
                sharedWith: decoded.userId
            },
            include: {
                card: true,
                sharedByUser: {
                    select: {
                        email: true
                    }
                }
            }
        });

        // Formater les cartes partagées
        const sharedCards = sharedWithUser.map(share => ({
            ...share.card,
            cardSource: 'shared' as const,
            sharedByEmail: share.sharedByUser.email
        }));

        // Combiner et trier toutes les cartes par nom de magasin
        const allCards = [...markedUserCards, ...sharedCards].sort((a, b) =>
            a.shopName.localeCompare(b.shopName)
        );

        return NextResponse.json({ cards: allCards });
    } catch (error) {
        console.error('Erreur lors de la récupération des cartes:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des cartes' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
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

        const { name, shopName, logoUrl, notes, cardType, cardCode } = await request.json();

        const card = await prisma.loyaltyCard.create({
            data: {
                name,
                shopName,
                logoUrl,
                notes,
                cardType,
                cardCode,
                userId: decoded.userId,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({ card });
    } catch (error) {
        console.error('Erreur lors de la création de la carte:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la création de la carte' },
            { status: 500 }
        );
    }
} 