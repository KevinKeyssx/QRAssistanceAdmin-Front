<script lang="ts">
	import { onMount } from 'svelte';

    import QRCodeStyling, {
        type DrawType
    }                               from 'qr-code-styling';
	import { jsPDF }                from 'jspdf';
    import { toast }                from 'svelte-sonner'
    import { FileText, Printer }    from 'lucide-svelte';

    import type { LDSClass }    from '$lib/types';
    import { isDark }           from '$lib/stores/themeStore';
    import Dialog               from '$lib/components/shared/Dialog.svelte';
    import ConfirmDelete        from '$lib/components/shared/ConfirmDelete.svelte';
    import { getThemeColor }    from '$lib/utils/theme';


	export interface Props {
		appClass	: LDSClass;
		url			: string;
		date		: string;
		disabled?	: boolean;
		canManage?	: boolean;
		onEdit?		: () => void;
		onDelete?	: () => void;
	}


    let {
        appClass,
        url,
        date,
        disabled  = false,
        canManage = true,
        onEdit,
        onDelete
    }: Props = $props();


    let isConfirmOpen   = $state( false );
    let isDeleting      = $state( false );


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

            reader.readAsDataURL( blob as Blob );
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


    async function confirmDelete() {
        if ( !onDelete ) return;

        isDeleting = true;
        try {
            await onDelete();
            isConfirmOpen = false;
        } finally {
            isDeleting = false;
        }
    }
</script>

<div
    bind:this = { cardRef }
    class     = "group relative flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-xl hover:shadow-gray-200 dark:hover:shadow-black/50 transition-all duration-500 overflow-hidden { disabled ? 'opacity-50 grayscale pointer-events-none' : '' }"
>
    <!-- Acciones de Gestión (Top Right) -->
    {#if canManage && ( onEdit || onDelete )}
        <div class="absolute top-4 right-4 flex items-center gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 print:hidden">
            {#if onEdit}
                <button
                    onclick = { onEdit }
                    class   = "p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-500 hover:text-lds-navy dark:hover:text-lds-gold border border-gray-100 dark:border-gray-700 shadow-sm transition-all active:scale-90"
                    title   = "Editar programación"
                >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                </button>
            {/if}

            {#if onDelete}
                <button
                    onclick = { () => isConfirmOpen = true }
                    class   = "p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-500 hover:text-red-500 border border-gray-100 dark:border-gray-700 shadow-sm transition-all active:scale-90"
                    title   = "Eliminar código"
                >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            {/if}
        </div>
    {/if}

    <div class="p-6 flex flex-col items-center gap-5 w-full">
        <!-- Encabezado de la Tarjeta -->
        <div class="flex flex-col items-center gap-2">
            <!-- <div class="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center text-lds-navy dark:text-lds-gold shadow-inner transition-transform duration-500 group-hover:scale-110">
                {#if appClass.icon}
                    {@const Icon = appClass.icon}
                    <Icon class="w-6 h-6" />
                {:else}
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                {/if}
            </div> -->

            <h3 class="font-bold text-xl text-gray-900 dark:text-gray-100 text-center tracking-tight leading-tight px-4">
                { appClass.label }
            </h3>

            <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700/60 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                { date }
            </div>
        </div>

        <!-- Contenedor del QR con Efecto de Profundidad -->
        <div class="relative w-max p-4 bg-white rounded-xl shadow-inner border border-gray-100 transition-all duration-500 " bind:this={ qrRef }>
            <!-- Glow sutil de fondo -->
            <div class="absolute inset-0 bg-lds-navy/5 dark:bg-lds-gold/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>
        </div>

        <!-- Botones de Acción Principales -->
        <div class="grid grid-cols-2 gap-3 w-full mt-0 print:hidden">
            <button
                onclick = { handlePrint }
                { disabled }
                class   = "flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200/50 dark:border-gray-600/50 transition-all font-bold text-sm shadow-sm active:scale-95 disabled:opacity-50"
            >
                <Printer class="sm:hidden w-4 h-4" />

                <span class="hidden sm:flex">Imprimir</span>
            </button>

            <button
                onclick = { handleDownloadPDF }
                { disabled }
                class   = "flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-lds-navy dark:bg-lds-gold  shadow-md shadow-lds-navy/20 dark:shadow-lds-gold/20 hover:opacity-90 transition-all font-bold text-sm active:scale-95 disabled:opacity-50 text-white"
            >
                <FileText class="sm:hidden w-4 h-4" />

                <span class="hidden sm:flex">PDF</span>
            </button>
        </div>
    </div>
</div>


<!-- Dialog de Confirmación de Eliminación -->
<Dialog
    open    = { isConfirmOpen }
    onClose = { () => isConfirmOpen = false }
>
    <ConfirmDelete
        open        = { isConfirmOpen }
        onConfirm   = { confirmDelete }
        onClose     = { () => isConfirmOpen = false }
        isPending   = { isDeleting }
        title       = "¿Eliminar código QR?"
        description = "Esta programación se eliminará permanentemente. Esta acción no se puede deshacer."
        itemName    = { appClass.label }
        itemExtra   = { date }
    />
</Dialog>
