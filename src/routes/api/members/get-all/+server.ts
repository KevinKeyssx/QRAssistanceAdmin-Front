import { json } from '@sveltejs/kit';

import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';


export const GET: RequestHandler = async ({ url }) => {
    const page  = url.searchParams.get( 'page' ) || '1';
    const size  = url.searchParams.get( 'size' ) || '50';
    const query = url.searchParams.get( 'query' ) || '';

    // El backend ahora maneja query_text como parámetro de consulta opcional
    const endpoint = `v1/members/search?page=${ page }&size=${ size }${ query ? `&query_text=${ encodeURIComponent( query ) }` : '' }`;

    const data = await connectRequest({
        endpoint,
        method      : METHOD.GET,
        isInternal  : false
    });

    return json( data );
};
