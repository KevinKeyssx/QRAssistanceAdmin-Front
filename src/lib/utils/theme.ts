import { browser } from '$app/environment';


/**
 * Colores oficiales de la aplicación (LDS Theme)
 */
export const THEME_COLORS = {
    NAVY : '#007da5',
    GOLD : '#c9a227',
};


/**
 * Retorna el color correspondiente según el tema activo.
 * @param isDarkMode Opcional, si no se provee buscará en el DOM.
 */
export function getThemeColor( isDarkMode?: boolean ): string {
    if ( !browser ) return THEME_COLORS.NAVY;

    const dark = isDarkMode ?? document.documentElement.classList.contains( 'dark' );

    return dark ? THEME_COLORS.GOLD : THEME_COLORS.NAVY;
}


/**
 * Retorna el color correspondiente según el tema activo en formato RGBA.
 */
export function getThemeColorRGBA( opacity: number, isDarkMode?: boolean ): string {
    const hex = getThemeColor( isDarkMode );
    
    // Convertir HEX a RGB
    const r = parseInt( hex.slice( 1, 3 ), 16 );
    const g = parseInt( hex.slice( 3, 5 ), 16 );
    const b = parseInt( hex.slice( 5, 7 ), 16 );

    return `rgba(${ r }, ${ g }, ${ b }, ${ opacity })`;
}
