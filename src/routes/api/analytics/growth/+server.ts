import { json } from '@sveltejs/kit';

import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';
import { ENV }          from '$lib/utils/env.server';


export const GET: RequestHandler = async ({ url }) => {
    const year = url.searchParams.get( 'year' );

    const data = await connectRequest({
        endpoint    : `v1/analytics/growth?year=${ year }`,
        method      : METHOD.GET,
        isInternal  : false,
        headers     : {
            'X-Internal-Key': ENV.INTERNAL_SECRET_KEY
        }
    });

    return json( data );
};
