import { auth } from '$lib/auth/auth';

import { 
    toSvelteKitHandler 
}                     from 'better-auth/svelte-kit';


/**
 * @description Handler de SvelteKit para peticiones de Better Auth.
 */
export const GET  = toSvelteKitHandler( auth );
export const POST = toSvelteKitHandler( auth );
