import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

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
        console.log('Début de la requête de mot de passe oublié');

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

        // Lire le corps de la requête
        const body = await request.json();
        const { email } = body;

        console.log('Email reçu:', email);

        if (!email) {
            console.error('Email manquant dans la requête');
            return new NextResponse(
                JSON.stringify({ message: 'Veuillez fournir une adresse email' }),
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

        // Si l'utilisateur existe, générer un token de réinitialisation
        if (user) {
            console.log('Utilisateur trouvé, génération du token');
            // Générer un token unique
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure

            // Sauvegarder le token dans la base de données
            console.log('Sauvegarde du token dans la base de données');
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    resetToken,
                    resetTokenExpiry,
                },
            });

            // Construire l'URL de réinitialisation
            const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
            console.log('URL de réinitialisation générée:', resetUrl);

            try {
                // Envoyer l'email
                console.log('Tentative d\'envoi de l\'email');
                await sendEmail({
                    to: user.email,
                    subject: 'Réinitialisation de votre mot de passe',
                    html: `
                        <h1>Réinitialisation de votre mot de passe</h1>
                        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
                        <p>Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
                        <a href="${resetUrl}">${resetUrl}</a>
                        <p>Ce lien expirera dans 1 heure.</p>
                        <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
                    `,
                });
                console.log('Email envoyé avec succès');
            } catch (emailError) {
                console.error('Erreur lors de l\'envoi de l\'email:', emailError);
                // Ne pas exposer l'erreur à l'utilisateur
            }
        } else {
            console.log('Aucun utilisateur trouvé avec cet email');
        }

        // Toujours renvoyer un succès pour éviter la divulgation d'informations
        return new NextResponse(
            JSON.stringify({ message: 'Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation.' }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Erreur lors de la demande de réinitialisation:', error);
        return new NextResponse(
            JSON.stringify({ message: 'Une erreur est survenue lors de la demande de réinitialisation' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
} 