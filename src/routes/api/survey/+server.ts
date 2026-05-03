import { json } from '@sveltejs/kit';

import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';
import { ENV }          from '$lib/utils/env.server';


export async function GET( { url }: any ) {
	const year		= url.searchParams.get( 'year' );
	const month		= url.searchParams.get( 'month' );
	const classType	= url.searchParams.get( 'class_type' );

	if ( !year ) {
		return json({ message: 'Year is required' }, { status: 400 });
	}

	const params = new URLSearchParams();
	params.set( 'year', year );

	if ( month ) params.set( 'month', month );
	if ( classType ) params.set( 'class_type', classType );

	try {
		const response = await connectRequest({
            endpoint    : `v1/surveys/stats?${params.toString()}`,
            method		: METHOD.GET,
            isInternal  : false,
            headers     : {
                'X-Internal-Key': ENV.INTERNAL_SECRET_KEY
            }
        });

		return json( response );
	} catch ( error: any ) {
		console.error( 'Error fetching survey stats:', error );
		
		return json(
			{ message: error?.message || 'Server Error' },
			{ status: error?.status || 500 }
		);
	}
}
