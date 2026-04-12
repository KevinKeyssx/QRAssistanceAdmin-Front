import { json } from '@sveltejs/kit';

import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';


export const DELETE: RequestHandler = async ({ url }) => {
    const id = url.searchParams.get( 'id' );

    if ( !id ) {
        return json( { error: 'ID is required' }, { status: 400 } );
    }

    const data = await connectRequest({
        endpoint    : `v1/qrs/${ id }`,
        method      : METHOD.DELETE,
        isInternal  : false
    });

    return json( data );
};
