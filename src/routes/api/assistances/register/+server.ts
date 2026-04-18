import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';


const BASE_URL = import.meta.env.VITE_API_URL as string;


export const POST: RequestHandler = async ( { request } ) => {
	const body = await request.json();

	try {
		const response = await fetch( `${ BASE_URL }/v1/assistances/`, {
			method  : 'POST',
			headers : {
				'Content-Type' : 'application/json',
				'Accept'       : 'application/json'
			},
			body    : JSON.stringify( body )
		} );

		const data = await response.json().catch( ( ) => ( {} ) );

		// Retornamos el data envuelto con el status para facilidad del frontend
		return json( { data, status: response.status }, { status: response.status } );
	} catch ( error ) {
		return json( 
			{ message: 'Error de conexión con el servidor de asistencia', code: 'ERR_CONNECTION' }, 
			{ status: 500 } 
		);
	}
};
