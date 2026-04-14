import { json } from '@sveltejs/kit';

import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';


export const GET: RequestHandler = async ({ url }) => {
    const year = url.searchParams.get( 'year' );

    const data = await connectRequest({
        endpoint    : `v1/analytics/growth?year=${ year }`,
        method      : METHOD.GET,
        isInternal  : false
    });

    return json( data );
};
