import { json }          from '@sveltejs/kit';
import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';


export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();

    const data = await connectRequest({
        endpoint    : 'v1/members/',
        method      : METHOD.POST,
        isInternal  : false,
        body
    });

    return json( data );
};
