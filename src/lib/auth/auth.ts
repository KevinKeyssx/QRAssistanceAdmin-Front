import { betterAuth } from 'better-auth';

import { ENV } from '$lib/utils/env.server';


/**
 * @description Configuración del servidor de Better Auth.
 * Utilizamos SQLite para la gestión local de sesiones y usuarios.
 */
export const auth = betterAuth({
    socialProviders: {
        google: {
            clientId        : ENV.GOOGLE.CLIENT_ID,
            clientSecret    : ENV.GOOGLE.CLIENT_SECRET,
            mapUser: async (user: any, _account: any) => {
                return user;
            }
        }
    },
    user: {
        additionalFields: {
            role: {
                type        : 'string',
                defaultValue: 'ADMIN',
                required    : false
            }
        }
    },
    // Configuración de cookies segura
    advanced: {
        cookiePrefix: 'qr-assistance'
    }
});
