import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
];

// Routes API protégées (qui nécessitent une authentification)
const apiRoutes = [
    '/api/cards',
    '/api/auth/me',
    '/api/auth/logout',
    '/api/auth/update-profile',
    '/api/auth/delete-account',
];

export async function middleware(request: NextRequest) {
    // Récupérer le chemin de la requête
    const path = request.nextUrl.pathname;

    // Vérifier si c'est une route publique
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

    // Vérifier si c'est une route API qui nécessite une authentification
    const isProtectedApiRoute = apiRoutes.some(route => path.startsWith(route));

    // Si c'est une route publique, laisser passer
    if (isPublicRoute) {
        return NextResponse.next();
    }

    // Récupérer le token d'authentification du cookie
    const token = request.cookies.get('auth-token')?.value;

    // Si aucun token n'est trouvé
    if (!token) {
        // Pour les routes API protégées, renvoyer une erreur 401
        if (isProtectedApiRoute) {
            return NextResponse.json(
                { message: 'Non authentifié' },
                { status: 401 }
            );
        }

        // Pour les autres routes, rediriger vers la page de connexion
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // Vérifier le token
        await jwtVerify(
            token,
            new TextEncoder().encode(process.env.JWT_SECRET || 'default_secret')
        );

        // Si token valide, autoriser l'accès
        return NextResponse.next();
    } catch (error) {
        // Si le token est invalide ou expiré
        console.error('Erreur de vérification du token:', error);

        // Pour les routes API protégées, renvoyer une erreur 401
        if (isProtectedApiRoute) {
            return NextResponse.json(
                { message: 'Session expirée, veuillez vous reconnecter' },
                { status: 401 }
            );
        }

        // Pour les autres routes, rediriger vers la page de connexion
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

// Configurer les chemins sur lesquels ce middleware doit s'exécuter
export const config = {
    matcher: [
        /*
         * Faire correspondre tous les chemins sauf :
         * 1. Les fichiers statiques (images, polices, etc.)
         * 2. Les fichiers de manifest
         */
        '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons).*)',
    ],
}; 