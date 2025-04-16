// Mapping des noms de magasins vers leurs logos
const logoMapping: { [key: string]: string } = {
    'Carrefour': '/logos/carrefour.png',
    'Auchan': '/logos/auchan.png',
    'Leclerc': '/logos/leclerc.png',
    'Monoprix': '/logos/monoprix.png',
    'Franprix': '/logos/franprix.png',
    'Lidl': '/logos/lidl.png',
    'Aldi': '/logos/aldi.png',
    'Casino': '/logos/casino.png',
    'Intermarché': '/logos/intermarche.png',
    'Picard': '/logos/picard.png',
    'Décathlon': '/logos/decathlon.png',
    'Fnac': '/logos/fnac.png',
    'Darty': '/logos/darty.png',
    'Boulanger': '/logos/boulanger.png',
    'La Poste': '/logos/la-poste.png',
    'SNCF': '/logos/sncf.png',
    'Total': '/logos/total.png',
    'Shell': '/logos/shell.png',
    'BP': '/logos/bp.png',
    'Autre': '/logos/default.png'
};

/**
 * Récupère l'URL du logo pour un magasin donné
 * @param shopName Le nom du magasin
 * @returns L'URL du logo ou l'URL du logo par défaut si le magasin n'est pas trouvé
 */
export function getLogoUrl(shopName: string): string {
    // Recherche insensible à la casse
    const normalizedShopName = shopName.toLowerCase().trim();

    // Recherche dans le mapping
    const entry = Object.entries(logoMapping).find(([key]) =>
        key.toLowerCase() === normalizedShopName
    );

    // Retourne le logo trouvé ou le logo par défaut
    return entry ? entry[1] : logoMapping['Autre'];
} 