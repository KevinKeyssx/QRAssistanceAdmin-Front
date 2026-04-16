import type { LayoutServerLoad } from './$types';


/**
 * @description Asegura que el usuario y la sesión estén disponibles en todo el dashboard.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
    return {
        user    : locals.user,
        session : locals.session
    };
};
