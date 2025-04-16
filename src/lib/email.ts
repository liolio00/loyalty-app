import nodemailer from 'nodemailer';

type EmailOptions = {
    to: string;
    subject: string;
    html: string;
};

// Créer un transporteur d'email
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    debug: true, // Activer le mode debug
    logger: true, // Activer les logs
});

export async function sendEmail({ to, subject, html }: EmailOptions) {
    try {
        console.log('Configuration SMTP:', {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            user: process.env.SMTP_USER,
        });

        // Vérifier que les variables d'environnement sont définies
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
            throw new Error('Configuration SMTP manquante');
        }

        // Vérifier la connexion SMTP
        console.log('Vérification de la connexion SMTP...');
        await transporter.verify();
        console.log('Connexion SMTP vérifiée avec succès');

        // Envoyer l'email
        console.log('Tentative d\'envoi d\'email à:', to);
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@loyaltyapp.com',
            to,
            subject,
            html,
        });

        console.log('Email envoyé avec succès:', info.messageId);
        return info;
    } catch (error) {
        console.error('Erreur détaillée lors de l\'envoi de l\'email:', error);
        throw new Error('Erreur lors de l\'envoi de l\'email');
    }
} 