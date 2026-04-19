import { redirect, type Handle } from '@sveltejs/kit';

import { auth }         from '$lib/auth/auth';
import connectRequest   from '$lib/services/fetch.service';
import { METHOD }       from '$lib/services/http-codes';


export const handle: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	if ( pathname.startsWith( '/api/auth' )) return resolve( event );

	const authSession = await auth.api.getSession({ headers: event.request.headers });

	const user          = authSession?.user;
	const isDashboard	= pathname.startsWith( '/dashboard' );

	event.locals.user		= user ?? null;
	event.locals.session	= authSession?.session ?? null;

	if ( isDashboard && !authSession ) throw redirect( 302, '/' );

	if ( isDashboard && user ) {
		try {
			await connectRequest( {
				endpoint	: `validate-user?email=${ encodeURIComponent( user.email )}`,
				method      : METHOD.GET,
				isInternal	: true,
			});
		} catch ( error ) {
			await auth.api.signOut({ headers: event.request.headers });

			throw redirect( 302, '/?error=unauthorized' );
		}
	}

	return resolve( event );
};
