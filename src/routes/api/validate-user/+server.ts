import { json } from '@sveltejs/kit';

import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';
import { ENV }          from '$lib/utils/env.server';


/**
 * @description Proxy para validar al usuario contra el backend de whitelist.
 */
// export const GET: RequestHandler = async ({ url, request }) => {
export const GET: RequestHandler = async ({ url }) => {
    console.log('🚀 ~ GET ~ url:', url)
    const email         = url.searchParams.get( 'email' );
    // const internalKey   = request.headers.get( 'X-Internal-Key' );

    // if ( !email || !internalKey ) {
    if ( !email ) {
        return json({ error: 'Email e Token son requeridos' }, { status: 400 });
    }

    try {
        const response = await connectRequest({
            endpoint    : `v1/whitelist/${ encodeURIComponent( email ) }`,
            method      : METHOD.GET,
            isInternal  : false,
            headers     : {
                'X-Internal-Key': ENV.INTERNAL_SECRET_KEY
            }
        });

        return json( response );
    } catch ( error: any ) {
        return json({ 
            error   : 'Error de validación en whitelist', 
            details : error.message 
        }, { status: error.status || 500 });
    }
};
