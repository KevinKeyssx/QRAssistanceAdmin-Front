import { json }          from '@sveltejs/kit';

import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';
import { ENV }          from '$lib/utils/env.server';


export const DELETE: RequestHandler = async ({ url }) => {
    const id = url.searchParams.get( 'id' );

    if ( !id ) {
        return json({ error: 'ID is required' }, { status: 400 });
    }

    const data = await connectRequest({
        endpoint    : `v1/assistances/${ id }`,
        method      : METHOD.DELETE,
        isInternal  : false,
        headers     : {
            'X-Internal-Key': ENV.INTERNAL_SECRET_KEY
        }
    });

    return json( data );
};
