import QRCodeStyling, {
    type DrawType
}                   from 'qr-code-styling';
import { jsPDF }    from 'jspdf';
import { toast }    from 'svelte-sonner';

import type { QRMapped } from '$lib/models/qr/qr.model';

/**
 * Genera la configuración base para qr-code-styling
 */
export const getQRConfig = ( url: string, width: number, height: number ) => ({
    width,
    height,
    data                : url,
    type                : 'svg' as DrawType,
    margin              : 10,
    dotsOptions         : { color: '#000000', type: 'classy-rounded' as const },
    cornersSquareOptions: { type: 'extra-rounded' as const, color: '#000000' },
    cornersDotOptions   : { type: 'dot' as const, color: '#000000' },
    backgroundOptions   : { color: '#ffffff' },
    image               : '/logo.avif',
    imageOptions        : {
        saveAsBlob          : true,
        hideBackgroundDots  : true,
        imageSize           : 0.4,
        margin              : 4
    },
});

/**
 * Exporta un único QR a PDF
 */
export async function exportPDF( item: QRMapped ) {
    const { appClass, url, date } = item;

    try {
        const qr    = new QRCodeStyling( getQRConfig( url, 1000, 1000 ) );
        const blob  = await qr.getRawData( 'jpeg' );

        if ( !blob ) throw new Error( 'Failed to generate QR blob' );

        const imgData = await new Promise<string>( ( resolve ) => {
            const reader = new FileReader();

            reader.onloadend = () => resolve( reader.result as string );
            reader.readAsDataURL( blob as Blob );
        });

        const pdf = new jsPDF({
            orientation : 'portrait',
            unit        : 'mm',
            format      : 'a4'
        });

        const pdfWidth  = pdf.internal.pageSize.getWidth();
        const imgWidth  = 150;
        const imgHeight = imgWidth;
        const x         = ( pdfWidth - imgWidth ) / 2;
        const y         = 30;

        pdf.setFont( 'helvetica', 'bold' );
        pdf.setFontSize( 32 );
        pdf.text( appClass.label, pdfWidth / 2, y, { align: 'center' } );

        pdf.setFont( 'helvetica', 'normal' );
        pdf.setFontSize( 16 );
        pdf.text( date, pdfWidth / 2, y + 15, { align: 'center' } );

        pdf.addImage( imgData, 'JPEG', x, y + 25, imgWidth, imgHeight, undefined, 'FAST' );
        pdf.save( `QR_${ appClass.slug }.pdf` );

        return true;
    } catch ( error ) {
        console.error( 'Error exportando PDF:', error );
        toast.error( 'Error exportando PDF.' );

        return false;
    }
}

/**
 * Descarga múltiples PDFs de forma secuencial
 */
export async function downloadBulkPDFs( items: QRMapped[] ) {
    let successCount = 0;

    for ( const item of items ) {
        const success = await exportPDF( item );
        if ( success ) successCount++;
    }

    if ( successCount === items.length ) {
        toast.success( `Se descargaron ${ successCount } PDFs correctamente` );
    } else {
        toast.info( `Se descargaron ${ successCount } de ${ items.length } PDFs` );
    }
}

/**
 * Imprime uno o varios QRs en un solo trabajo de impresión
 */
export async function printQRs( items: QRMapped[] ) {
    try {
        const printContainer = document.createElement( 'div' );

        printContainer.className = 'print-only-container';

        // Estilos para impresión
        const style = document.createElement( 'style' );
        style.innerHTML = `
            @media print {
                body > *:not(.print-only-container) { display: none !important; }
                .print-only-container { display: block !important; width: 100% !important; }
                .print-page {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                    width: 100vw;
                    page-break-after: always;
                    background: white;
                }
                .print-page:last-child { page-break-after: auto; }
                .print-title { font-size: 3.5rem; font-weight: 800; color: black; margin: 0; }
                .print-date { font-size: 1.5rem; font-weight: 500; color: #374151; margin-top: 1rem; margin-bottom: 2rem; }
                .print-qr-image { width: 500px; height: 500px; }
            }
        `;
        document.head.appendChild( style );

        const imgUrls: string[] = [];

        for ( const item of items ) {
            const qr = new QRCodeStyling( getQRConfig( item.url, 800, 800 ) );
            const blob = await qr.getRawData( 'png' );

            if ( blob ) {
                const url = URL.createObjectURL( blob as Blob );
                imgUrls.push( url );

                const page = document.createElement( 'div' );
                page.className = 'print-page';
                page.innerHTML = `
                    <h2 class="print-title">${ item.appClass.label }</h2>
                    <p class="print-date">${ item.date }</p>
                    <img src="${ url }" class="print-qr-image" />
                `;
                printContainer.appendChild( page );
            }
        }

        document.body.appendChild( printContainer );

        // Esperar a que todas las imágenes carguen
        const images = Array.from( printContainer.querySelectorAll( 'img' ) );
        await Promise.all( images.map( img => {
            if ( img.complete ) return Promise.resolve();
            return new Promise( resolve => img.onload = resolve );
        }));

        window.print();

        // Limpieza
        document.body.removeChild( printContainer );
        document.head.removeChild( style );
        imgUrls.forEach( url => URL.revokeObjectURL( url ) );
    } catch ( error ) {
        console.error( 'Error en impresión masiva:', error );
        toast.error( 'Error al preparar la impresión' );
    }
}
