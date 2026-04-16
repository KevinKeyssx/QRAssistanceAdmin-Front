import { createAuthClient } from 'better-auth/svelte';

const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL as string;

/**
 * @description Cliente de Better Auth para el frontend.
 */
export const authClient = createAuthClient({
    baseURL: FRONTEND_URL
});
