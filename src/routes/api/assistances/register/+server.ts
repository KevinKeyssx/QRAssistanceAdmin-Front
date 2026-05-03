import { json }         from '@sveltejs/kit';

import type { 
    RequestHandler 
}                       from './$types';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';
import { ENV }          from '$lib/utils/env.server';


export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	try {
		const result = await connectRequest<any>({
            endpoint    : 'v1/assistances/',
            method      : METHOD.POST,
            body,
            isInternal  : false,
            headers     : {
                'X-Internal-Key': ENV.INTERNAL_SECRET_KEY
            }
        });

		// Retornamos el result envuelto con el status para facilidad del frontend
		return json( { data: result, status: 201 }, { status: 201 } );
	} catch ( error: any ) {
		return json( 
			{ 
                message : error.message || 'Error de conexión con el servidor de asistencia', 
                code    : error.code || 'ERR_CONNECTION',
                data    : error.data
            }, 
			{ status: error.status || 500 } 
		);
	}
};
