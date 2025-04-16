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

        // Récupérer la carte
        const card = await prisma.loyaltyCard.findFirst({
            where: {
                id: params.id,
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
                    where: {
                        sharedWith: decoded.userId
                    },
                    include: {
                        sharedByUser: {
                            select: {
                                id: true,
                                email: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });

        if (!card) {
            return new NextResponse(
                JSON.stringify({ message: 'Carte non trouvée' }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        return new NextResponse(
            JSON.stringify(card),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Erreur lors de la récupération de la carte:', error);
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
            JSON.stringify({ message: 'Une erreur est survenue lors de la récupération de la carte' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        // Récupérer les données de la requête
        const body = await request.json();
        const { shopName, cardType, cardCode, notes } = body;

        // Valider les données requises
        if (!shopName || !cardType || !cardCode) {
            return new NextResponse(
                JSON.stringify({ message: 'Tous les champs obligatoires doivent être remplis' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Mettre à jour la carte
        const card = await prisma.loyaltyCard.update({
            where: {
                id: params.id,
                userId: decoded.userId
            },
            data: {
                name: shopName,
                shopName,
                cardType,
                cardCode,
                notes: notes || null,
                logoUrl: getLogoUrl(shopName),
            }
        });

        return new NextResponse(
            JSON.stringify(card),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la carte:', error);
        return new NextResponse(
            JSON.stringify({ message: 'Une erreur est survenue lors de la mise à jour de la carte' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { userId: string; email: string };
        const cardId = parseInt(params.id, 10);

        if (isNaN(cardId)) {
            return NextResponse.json(
                { error: 'ID de carte invalide' },
                { status: 400 }
            );
        }

        // Vérifier si la carte existe et appartient à l'utilisateur
        const card = await prisma.loyaltyCard.findFirst({
            where: {
                id: cardId,
                userId: decoded.userId
            }
        });

        if (!card) {
            return NextResponse.json(
                { error: 'Carte non trouvée' },
                { status: 404 }
            );
        }

        // Supprimer la carte
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