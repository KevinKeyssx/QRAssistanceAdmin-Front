import { writable } from 'svelte/store';


const DARK_MODE_KEY = 'qr_attendance_dark_mode';


const getInitialTheme = (): boolean => {
    if ( typeof localStorage === 'undefined' ) return false;

    const saved = localStorage.getItem( DARK_MODE_KEY );

    if ( saved !== null ) return saved === 'true';

    return window.matchMedia( '(prefers-color-scheme: dark)' ).matches;
};


export const isDark = writable( getInitialTheme() );


isDark.subscribe( value => {
    if ( typeof localStorage !== 'undefined' ) {
        localStorage.setItem( DARK_MODE_KEY, String( value ));

        document.documentElement.classList.toggle( 'dark', value );
    }
});


export function toggleDarkMode() {
    isDark.update( n => !n );
}
