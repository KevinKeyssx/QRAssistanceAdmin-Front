import { json } from '@sveltejs/kit';

import type {
    RequestHandler
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';


export const GET: RequestHandler = async ( { url } ) => {
    const year      = url.searchParams.get( 'year' ) ?? String( new Date().getFullYear() );
    const page      = url.searchParams.get( 'page' ) ?? '1';
    const size      = url.searchParams.get( 'size' ) ?? '10';
    const endpoint  = `v1/qrs?year=${ year }&page=${ page }&size=${ size }`;

    try {
        const data = await connectRequest({
            endpoint    : endpoint,
            method      : METHOD.GET,
            isInternal  : false
        });

        return json( data );
    } catch ( error: any ) {
        return json( 
            { 
                message : error.message || 'Error al obtener el historial',
                code    : error.code || 'UNKNOWN_ERROR',
                data    : error.data || {}
            }, 
            { status: error.status || 500 } 
        );
    }
};
