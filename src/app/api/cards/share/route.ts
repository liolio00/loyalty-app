import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { sendEmail } from '@/lib/email';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

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
export async function POST(request: Request) {
    try {
        // S'assurer que la table existe
        await ensureTableExists();

        // Vérifier l'authentification
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'default_secret'
        ) as { userId: string; email: string };

        const { email, cardIds } = await request.json();

        if (!email || !cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
            return NextResponse.json(
                { error: 'Données manquantes ou invalides' },
                { status: 400 }
            );
        }

        // Vérifier si les cartes existent et appartiennent à l'utilisateur
        const cards = await prisma.loyaltyCard.findMany({
            where: {
                id: { in: cardIds },
                userId: decoded.userId,
            },
        });

        if (cards.length !== cardIds.length) {
            return NextResponse.json(
                { error: 'Une ou plusieurs cartes sont invalides ou ne vous appartiennent pas' },
                { status: 404 }
            );
        }

        // Vérifier si l'utilisateur avec qui on partage existe
        const sharedUser = await prisma.user.findUnique({
            where: { email },
        });

        const isNewUser = !sharedUser;

        if (!isNewUser) {
            // Vérifier si les cartes sont déjà partagées avec cet utilisateur
            const existingShare = await prisma.$queryRaw`
                SELECT * FROM LoyaltyCardShare 
                WHERE cardId IN (${cardIds.join(',')}) 
                AND sharedWith = ${sharedUser.id} 
                LIMIT 1
            `;

            if (existingShare && Array.isArray(existingShare) && existingShare.length > 0) {
                return NextResponse.json(
                    { error: 'Une ou plusieurs cartes sont déjà partagées avec cet utilisateur' },
                    { status: 400 }
                );
            }

            // Créer les partages pour l'utilisateur existant
            for (const cardId of cardIds) {
                try {
                    await prisma.$executeRaw`
                        INSERT INTO LoyaltyCardShare (cardId, sharedWith, sharedBy, createdAt)
                        VALUES (${cardId}, ${sharedUser.id}, ${decoded.userId}, NOW())
                    `;
                } catch (error) {
                    console.error(`Erreur lors du partage de la carte ${cardId}:`, error);
                    continue;
                }
            }
        } else {
            // Créer un nouvel utilisateur avec un mot de passe temporaire
            const tempPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(tempPassword, 10);

            const newUser = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    updatedAt: new Date(),
                },
            });

            // Créer les partages pour le nouvel utilisateur
            for (const cardId of cardIds) {
                try {
                    await prisma.$executeRaw`
                        INSERT INTO LoyaltyCardShare (cardId, sharedWith, sharedBy, createdAt)
                        VALUES (${cardId}, ${newUser.id}, ${decoded.userId}, NOW())
                    `;
                } catch (error) {
                    console.error(`Erreur lors du partage de la carte ${cardId}:`, error);
                    continue;
                }
            }

            // Envoyer un email d'invitation
            await sendEmail({
                to: email,
                subject: 'Invitation à rejoindre Loyalty App',
                html: `
                    <h1>Bienvenue sur Loyalty App !</h1>
                    <p>Quelqu'un a partagé des cartes de fidélité avec vous.</p>
                    <p>Pour accéder à vos cartes, connectez-vous avec :</p>
                    <p>Email : ${email}</p>
                    <p>Mot de passe temporaire : ${tempPassword}</p>
                    <p>Nous vous recommandons de changer votre mot de passe après votre première connexion.</p>
                `,
            });
        }

        return NextResponse.json({
            success: true,
            isNewUser,
        });
    } catch (error) {
        console.error('Erreur lors du partage des cartes:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}

// Récupérer les partages d'une carte
export async function GET(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return new NextResponse(
                JSON.stringify({ message: 'Non autorisé' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'default_secret'
        ) as { userId: number; email: string };

        // Récupérer l'ID de la carte depuis l'URL
        const url = new URL(request.url);
        const cardId = url.searchParams.get('cardId');

        if (!cardId) {
            return new NextResponse(
                JSON.stringify({ message: 'ID de carte requis' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Récupérer les partages
        const shares = await prisma.loyaltyCardShare.findMany({
            where: {
                cardId: cardId,
                sharedBy: decoded.userId
            },
            include: {
                sharedWithUser: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        return new NextResponse(
            JSON.stringify(shares),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Erreur lors de la récupération des partages:', error);
        return new NextResponse(
            JSON.stringify({ message: 'Une erreur est survenue lors de la récupération des partages' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// Supprimer un partage
export async function DELETE(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const cookieStore = cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return new NextResponse(
                JSON.stringify({ message: 'Non autorisé' }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'default_secret'
        ) as { userId: number; email: string };

        // Récupérer l'ID du partage depuis l'URL
        const url = new URL(request.url);
        const shareId = url.searchParams.get('shareId');

        if (!shareId) {
            return new NextResponse(
                JSON.stringify({ message: 'ID de partage requis' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Vérifier que le partage appartient à l'utilisateur
        const share = await prisma.loyaltyCardShare.findFirst({
            where: {
                id: shareId,
                sharedBy: decoded.userId
            }
        });

        if (!share) {
            return new NextResponse(
                JSON.stringify({ message: 'Partage non trouvé ou non autorisé' }),
                { status: 404, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Supprimer le partage
        await prisma.loyaltyCardShare.delete({
            where: { id: shareId }
        });

        return new NextResponse(
            JSON.stringify({ message: 'Partage supprimé avec succès' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Erreur lors de la suppression du partage:', error);
        return new NextResponse(
            JSON.stringify({ message: 'Une erreur est survenue lors de la suppression du partage' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
} 