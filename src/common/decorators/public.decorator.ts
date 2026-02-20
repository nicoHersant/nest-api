import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marque une route comme publique : le guard API key ne s'applique pas.
 * Utilisation : @Public() sur un controller ou une méthode.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
