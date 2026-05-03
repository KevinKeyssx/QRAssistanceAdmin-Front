import { json } from '@sveltejs/kit';

import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';
import { ENV }          from '$lib/utils/env.server';


export const GET: RequestHandler = async ({ url }) => {
    const year    = url.searchParams.get( 'year' );
    const month   = url.searchParams.get( 'month' );
    const qr_type = url.searchParams.get( 'qr_type' );

    let endpoint = `v1/analytics/main-chart?year=${ year }`;

    if ( month ) {
        endpoint += `&month=${ month }`;
    }
    
    if ( qr_type ) {
        endpoint += `&qr_type=${ qr_type }`;
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
