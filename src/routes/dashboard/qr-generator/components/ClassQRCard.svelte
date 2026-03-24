<script lang="ts">
	import { onMount }  from 'svelte';
	import { browser }  from '$app/environment';

    import QRCodeStyling, { type DrawType }    from 'qr-code-styling';
	import { jsPDF }        from 'jspdf';
    import { toast }        from 'svelte-sonner'


    import type { LDSClass }    from '$lib/types';
    import { isDark }           from '$lib/stores/themeStore';


    interface Props {
        appClass    : LDSClass;
        url         : string;
        date        : string;
        disabled?   : boolean;
    }


    let {
		appClass,
		url,
		date,
		disabled = false,
	}: Props = $props();


    let qrRef           : HTMLElement;
	let qrCodeStyling   : any;
	let cardRef         : HTMLElement;


    onMount(() => {
        qrCodeStyling = new QRCodeStyling({
			width       : 200,
			height      : 200,
			dotsOptions : {
				color : getThemeColor(),
				type  : 'classy-rounded'
			},
            cornersSquareOptions: {
                type: 'extra-rounded',
                color: getThemeColor()
            },
            cornersDotOptions: {
                type: 'dot',
                color: getThemeColor()
            },
            ...configBaseQR( url ),
		});

        qrCodeStyling.append( qrRef );

        const unsubscribe = isDark.subscribe(() => {
            const newColor = getThemeColor();

            qrCodeStyling.update({
                dotsOptions             : { color: newColor },
                cornersSquareOptions    : { color: newColor },
                cornersDotOptions       : { color: newColor }
            });
        });

        return () => {
            unsubscribe();
        };
    });


    const configBaseQR = ( url: string ) => ({
        data                : url,
        type                : 'svg' as DrawType,
		margin              : 10,
		backgroundOptions   : { color : '#ffffff' },
        image               : '/logo.avif',
        imageOptions        : {
            saveAsBlob          : true,
            hideBackgroundDots  : true,
            imageSize           : 0.4,
            margin              : 4
        },
    });


    const generateQR = (
        width: number,
        height: number
    ) =>  new QRCodeStyling({
        width                   : width,
        height                  : height,
        dotsOptions             : { color: '#000000', type: 'classy-rounded' },
        cornersSquareOptions    : { type: 'extra-rounded', color: '#000000' },
        cornersDotOptions       : { type: 'dot', color: '#000000' },
        ...configBaseQR( url ),
    });


    function getThemeColor() {
		if ( !browser ) return '#007da5';

        const isDark = document.documentElement.classList.contains( 'dark' );

        return isDark ? '#c9a227' : '#007da5';
	}


    async function handlePrint() {
		if ( disabled ) return;

		const children          : Element[] = Array.from( document.body.children );
		const hiddenElements    : any[]     = [];

		children.forEach( child => {
			if ( child.tagName !== 'SCRIPT' && child instanceof HTMLElement ) {
				hiddenElements.push({ el: child, display: child.style.display });

                child.style.display = 'none';
			}
		});

		const printContainer = document.createElement( 'div' );

        printContainer.className = 'print-only-container';
		printContainer.innerHTML = `
			<div class="flex flex-col items-center justify-center pt-8 pb-4 w-full">
				<h2 class="text-4xl font-bold text-black">${ appClass.label }</h2>
				<p class="text-xl font-medium text-gray-800 mt-2">${ date }</p>
			</div>
			<div class="bg-white p-2 rounded-lg flex justify-center items-center w-full" id="print-qr-target"></div>
		`;

		document.body.appendChild( printContainer );

        const printQR = generateQR( 500, 500 );

		printQR.append( document.getElementById('print-qr-target')! );

        await new Promise( res => setTimeout( res, 100 ) );

		window.print();

		document.body.removeChild( printContainer );

		hiddenElements.forEach( item => {
			item.el.style.display = item.display;
		});
	}


    async function handleDownloadPDF() {
		if ( disabled ) return;

        const pdfQR = generateQR( 1000, 1000 );

        // Extraer el Blob directo mediante la API nativa de la librería (espera que el logo cargue)
        const blob = await pdfQR.getRawData( 'jpeg' );
        
        if ( !blob ) {
            toast.error( 'Error al generar la imagen del QR.' );
            return;
        }

        // Convertir Blob a Base64 asíncronamente para jsPDF
        const imgData = await new Promise<string>( ( resolve ) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve( reader.result as string );
            reader.readAsDataURL( blob );
        });

		const pdf = new jsPDF({
			orientation : 'portrait',
			unit        : 'mm',
			format      : 'a4'
		});

		const pdfWidth  = pdf.internal.pageSize.getWidth();
		const imgWidth  = 150;
		const imgHeight = imgWidth; // El QR es un cuadrado 1:1 perfecto
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

        toast.success( 'PDF descargado correctamente' );
	}
</script>


<div
    bind:this={cardRef}
    class={`card-container relative border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-800 transition-all duration-300 ${ disabled ? 'opacity-60 grayscale' : 'hover:shadow-md' } border-gray-200 dark:border-gray-700`}
>
	<div class="p-4 flex flex-col items-center gap-4 w-full">
		<h3 class="font-bold text-lg text-gray-900 dark:text-gray-100 text-center">
			{ appClass.label }
		</h3>

		<p class="text-xs text-gray-500 dark:text-gray-400">
			{ date }
		</p>

		<!-- Contenedor del QR -->
		<div class="bg-white p-2 rounded-lg flex justify-center items-center w-full" bind:this={qrRef}></div>

		<div class="flex gap-2 w-full mt-2 print:hidden">
			<button
				onclick  = { handlePrint }
				{disabled}
				class    = "flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
			>
				Imprimir
			</button>

			<button
				onclick  = { handleDownloadPDF }
				{disabled}
				class    = "flex-1 py-2 px-4 rounded-lg bg-lds-navy text-white hover:opacity-90 transition-opacity duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed dark:bg-lds-gold cursor-pointer"
			>
				PDF
			</button>
		</div>
	</div>
</div>
