import { SetMetadata } from '@nestjs/common';

export const IS_ADMIN_KEY = 'isAdmin';

/**
 * Marque une route comme réservée aux administrateurs.
 * Doit être utilisé conjointement avec le ApiKeyGuard (déjà global).
 */
export const AdminOnly = () => SetMetadata(IS_ADMIN_KEY, true);
