import { json } from '@sveltejs/kit';

import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';


export const PUT: RequestHandler = async ({ request, url }) => {
    const id    = url.searchParams.get( 'id' );
    const body  = await request.json();

    const data = await connectRequest({
        endpoint    : `v1/members/${ id }`,
        method      : METHOD.PUT,
        isInternal  : false,
        body
    });

    return json( data );
};
