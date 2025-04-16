import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Fonction pour créer la table si elle n'existe pas
async function ensureTableExists() {
    try {
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS LoyaltyCardShare (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cardId INT NOT NULL,
                sharedWith INT NOT NULL,
                sharedBy INT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_share (cardId, sharedWith),
                FOREIGN KEY (cardId) REFERENCES LoyaltyCard(id) ON DELETE CASCADE,
                FOREIGN KEY (sharedWith) REFERENCES User(id) ON DELETE CASCADE,
                FOREIGN KEY (sharedBy) REFERENCES User(id) ON DELETE CASCADE,
                INDEX idx_cardId (cardId),
                INDEX idx_sharedWith (sharedWith),
                INDEX idx_sharedBy (sharedBy)
            )
        `;
    } catch (error) {
        console.error('Erreur lors de la création de la table:', error);
        throw error;
    }
}

// Partager une carte avec un utilisateur
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

        const { cardId, email } = await request.json();

        // Vérifier si l'utilisateur existe
        const targetUser = await prisma.user.findUnique({
            where: { email }
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        // Vérifier si la carte appartient à l'utilisateur
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

        // Vérifier si le partage existe déjà
        const existingShare = await prisma.loyaltyCardShare.findUnique({
            where: {
                cardId_sharedWith: {
                    cardId: cardId,
                    sharedWith: targetUser.id
                }
            }
        });

        if (existingShare) {
            return NextResponse.json(
                { error: 'La carte est déjà partagée avec cet utilisateur' },
                { status: 400 }
            );
        }

        // Créer le partage
        const share = await prisma.loyaltyCardShare.create({
            data: {
                cardId: cardId,
                sharedWith: targetUser.id,
                sharedBy: decoded.userId
            },
            include: {
                sharedWithUser: {
                    select: {
                        email: true
                    }
                }
            }
        });

        return NextResponse.json({ share });
    } catch (error) {
        console.error('Erreur lors du partage de la carte:', error);
        return NextResponse.json(
            { error: 'Erreur lors du partage de la carte' },
            { status: 500 }
        );
    }
}

// Récupérer les partages d'une carte
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

        const { searchParams } = new URL(request.url);
        const cardId = searchParams.get('cardId');

        if (!cardId) {
            return NextResponse.json(
                { error: 'ID de carte manquant' },
                { status: 400 }
            );
        }

        const cardIdNumber = parseInt(cardId);
        if (isNaN(cardIdNumber)) {
            return NextResponse.json(
                { error: 'ID de carte invalide' },
                { status: 400 }
            );
        }

        const shares = await prisma.loyaltyCardShare.findMany({
            where: {
                cardId: cardIdNumber,
                card: {
                    userId: decoded.userId
                }
            },
            include: {
                sharedWithUser: {
                    select: {
                        email: true
                    }
                }
            }
        });

        return NextResponse.json({ shares });
    } catch (error) {
        console.error('Erreur lors de la récupération des partages:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des partages' },
            { status: 500 }
        );
    }
}

// Supprimer un partage
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

        const { cardIds, email } = await request.json();

        // Vérifier si l'utilisateur existe
        const targetUser = await prisma.user.findUnique({
            where: { email }
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        // Vérifier si les cartes appartiennent à l'utilisateur
        const cards = await prisma.loyaltyCard.findMany({
            where: {
                id: { in: cardIds },
                userId: decoded.userId
            }
        });

        if (cards.length !== cardIds.length) {
            return NextResponse.json(
                { error: 'Certaines cartes n\'ont pas été trouvées ou ne vous appartiennent pas' },
                { status: 404 }
            );
        }

        // Supprimer les partages
        await prisma.loyaltyCardShare.deleteMany({
            where: {
                cardId: { in: cardIds },
                sharedWith: targetUser.id
            }
        });

        return NextResponse.json({ message: 'Partages supprimés avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression des partages:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la suppression des partages' },
            { status: 500 }
        );
    }
} 