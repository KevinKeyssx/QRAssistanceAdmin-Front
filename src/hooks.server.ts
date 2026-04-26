import { redirect, type Handle } from '@sveltejs/kit';

import { auth }     from '$lib/auth/auth';
import { METHOD }   from '$lib/services/http-codes';
import { ENV }      from '$lib/utils/env.server';


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
            const response = await fetch( `${ENV.FRONTEND_URL}/api/validate-user?email=${ encodeURIComponent( user.email )}`, {
                    method: METHOD.GET,
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                }
            );

            if ( !response.ok ) {
                throw redirect( 302, '/?error=unauthorized' );
            }
		} catch ( error ) {
			await auth.api.signOut({ headers: event.request.headers });

			throw redirect( 302, '/?error=unauthorized' );
		}
	}

	return resolve( event );
};
