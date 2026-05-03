import { json } from '@sveltejs/kit';

import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';
import { ENV }          from '$lib/utils/env.server';


export const PUT: RequestHandler = async ({ request, url }) => {
    const id    = url.searchParams.get( 'id' );
    const body  = await request.json();

    const data = await connectRequest({
        endpoint    : `v1/members/${ id }`,
        method      : METHOD.PUT,
        isInternal  : false,
        body,
        headers: {
            'X-Internal-Key': ENV.INTERNAL_SECRET_KEY
        }
    });

    return json( data );
};
