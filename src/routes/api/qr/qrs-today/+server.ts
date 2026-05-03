import { json } from '@sveltejs/kit';

import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';
import { ENV }          from '$lib/utils/env.server';


export const POST: RequestHandler = async () => {
    const data = await connectRequest({
        endpoint    : 'v1/qrs/sunday',
        method      : METHOD.POST,
        isInternal  : false,
        body        : {},
        headers     : {
            'X-Internal-Key': ENV.INTERNAL_SECRET_KEY
        }
    });

    return json( data );
};
