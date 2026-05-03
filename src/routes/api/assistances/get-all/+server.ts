import { json } from '@sveltejs/kit';

import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';
import { ENV }          from '$lib/utils/env.server';


export const GET: RequestHandler = async ({ url }) => {
    const page          = url.searchParams.get( 'page' ) || '1';
    const size          = url.searchParams.get( 'size' ) || '10';
    const qrType        = url.searchParams.get( 'qr_type' ) || '';
    const memberQuery   = url.searchParams.get( 'member_query' ) || '';
    const date          = url.searchParams.get( 'date' ) || '';

    let endpoint = `v1/assistances/?page=${ page }&size=${ size }`;

    if ( qrType ) {
        endpoint += `&qr_type=${ encodeURIComponent( qrType ) }`;
    }

    if ( memberQuery ) {
        endpoint += `&member_query=${ encodeURIComponent( memberQuery ) }`;
    }

    if ( date ) {
        endpoint += `&date=${ encodeURIComponent( date ) }`;
    }

    const data = await connectRequest({
        endpoint,
        method      : METHOD.GET,
        isInternal  : false,
        headers     : {
            'X-Internal-Key': ENV.INTERNAL_SECRET_KEY
        }
    });

    return json( data );
};
