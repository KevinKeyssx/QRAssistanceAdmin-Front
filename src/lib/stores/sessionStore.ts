import { writable }    from 'svelte/store';
import { browser }    from '$app/environment';


const KEY = 'qr_has_session';

const initial = browser ? localStorage.getItem( KEY ) === 'true' : false;

export const hasSession = writable<boolean>( initial );


// ── Sync store -> localStorage ────────────────────────────────────────────────
hasSession.subscribe( ( value ) => {
    if ( !browser ) return;

    if ( value ) {
        localStorage.setItem( KEY, 'true' );
    } else {
        localStorage.removeItem( KEY );
    }
} );


// ── Helpers ───────────────────────────────────────────────────────────────────
export function activateSession( ) {
    hasSession.set( true );
}

export function clearSession( ) {
    hasSession.set( false );
}
