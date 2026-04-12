import { json }          from '@sveltejs/kit';
import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';


// Crear un QR
export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();

    const data = await connectRequest({
        endpoint    : 'v1/qrs',
        method      : METHOD.POST,
        isInternal  : false,
        body        : body
    });

    return json( data );
};

// Actualizar un QR existente
export const PUT: RequestHandler = async ({ request }) => {
    const { id, ...updateData } = await request.json();

    if ( !id ) {
        return json( { error: 'ID is required' }, { status: 400 } );
    }

    const data = await connectRequest({
        endpoint    : `v1/qrs/${ id }`,
        method      : METHOD.PUT,
        isInternal  : false,
        body        : updateData
    });

    return json( data );
};
