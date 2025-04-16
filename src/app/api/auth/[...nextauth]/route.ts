import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key');

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 401 }
            );
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Mot de passe incorrect' },
                { status: 401 }
            );
        }

        const token = await new SignJWT({ userId: user.id, email: user.email })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secretKey);

        cookies().set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 86400 // 24 heures
        });

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Erreur d\'authentification:', error);
        return NextResponse.json(
            { error: 'Erreur lors de l\'authentification' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const token = cookies().get('auth-token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Non authentifié' },
                { status: 401 }
            );
        }

        const verified = await jwtVerify(token, secretKey);

        return NextResponse.json({
            user: verified.payload
        });
    } catch (error) {
        console.error('Erreur de vérification du token:', error);
        return NextResponse.json(
            { error: 'Token invalide' },
            { status: 401 }
        );
    }
} 