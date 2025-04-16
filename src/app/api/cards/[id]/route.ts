import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { getLogoUrl } from '@/lib/utils/logoMapping';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const cardId = parseInt(params.id);
        if (isNaN(cardId)) {
            return NextResponse.json(
                { error: 'ID de carte invalide' },
                { status: 400 }
            );
        }

        const card = await prisma.loyaltyCard.findFirst({
            where: {
                id: cardId,
                OR: [
                    { userId: decoded.userId },
                    {
                        shares: {
                            some: {
                                sharedWith: decoded.userId
                            }
                        }
                    }
                ]
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

        if (!card) {
            return NextResponse.json(
                { error: 'Carte non trouvée' },
                { status: 404 }
            );
        }

        return NextResponse.json({ card });
    } catch (error) {
        console.error('Erreur lors de la récupération de la carte:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération de la carte' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const cardId = parseInt(params.id);
        if (isNaN(cardId)) {
            return NextResponse.json(
                { error: 'ID de carte invalide' },
                { status: 400 }
            );
        }

        const { name, shopName, logoUrl, notes, cardType, cardCode } = await request.json();

        const card = await prisma.loyaltyCard.update({
            where: {
                id: cardId,
                userId: decoded.userId
            },
            data: {
                name,
                shopName,
                logoUrl,
                notes,
                cardType,
                cardCode,
                updatedAt: new Date()
            }
        });

        return NextResponse.json({ card });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la carte:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour de la carte' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const cardId = parseInt(params.id);
        if (isNaN(cardId)) {
            return NextResponse.json(
                { error: 'ID de carte invalide' },
                { status: 400 }
            );
        }

        const card = await prisma.loyaltyCard.findFirst({
            where: {
                id: cardId,
                userId: decoded.userId
            }
        });

        if (!card) {
            return NextResponse.json(
                { error: 'Carte non trouvée ou non autorisé' },
                { status: 404 }
            );
        }

        await prisma.loyaltyCard.delete({
            where: {
                id: cardId
            }
        });

        return NextResponse.json({ message: 'Carte supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la carte:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la suppression de la carte' },
            { status: 500 }
        );
    }
} 