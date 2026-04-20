<script lang="ts">
	import { onMount } from 'svelte';

    import {
        CalendarDays,
        Clock,
        FileText,
        Printer
    }                       from 'lucide-svelte';
    import { toast }        from 'svelte-sonner';
    import QRCodeStyling    from 'qr-code-styling';

    import {
        exportPDF,
        printQRs,
        getQRConfig
    }                           from '$lib/utils/qr-export';
    import { isDark }           from '$lib/stores/themeStore';
    import Dialog               from '$lib/components/shared/Dialog.svelte';
    import ConfirmDelete        from '$lib/components/shared/ConfirmDelete.svelte';
    import { getThemeColor }    from '$lib/utils/theme';
    import type { QRMapped }    from '$lib/models/qr/qr.model';


	export interface Props {
        qr          : QRMapped;
		disabled?	: boolean;
		canManage?	: boolean;
		onEdit?		: () => void;
		onDelete?	: () => void;
	}


    let {
        qr,
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
        const themeColor = getThemeColor();

        qrCodeStyling = new QRCodeStyling({
            ...getQRConfig( qr.url, 200, 200 ),
            dotsOptions: {
                color: themeColor,
                type: 'classy-rounded'
            },
            cornersSquareOptions: {
                type: 'extra-rounded',
                color: themeColor
            },
            cornersDotOptions: {
                type: 'dot',
                color: themeColor
            }
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


    const getExportItem = () => qr;


    async function handlePrint() {
		if ( disabled ) return;
        await printQRs([ getExportItem() ]);
	}


    async function handleDownloadPDF() {
		if ( disabled ) return;
        const success = await exportPDF( getExportItem() );
        if ( success ) {
            toast.success( 'PDF descargado correctamente' );
        } else {
            toast.error( 'Error al generar el PDF' );
        }
	}


    async function confirmDelete() {
        if ( !onDelete ) return;

        isDeleting = true;

        try {
            onDelete();

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
            <div class="flex gap-2 items-center">
                {#if qr.appClass.icon}
                    <span class="text-lds-navy dark:text-lds-gold">
                        <qr.appClass.icon />
                    </span>
                {/if}

                <h3 class="font-bold text-lg text-gray-900 dark:text-gray-100 text-center tracking-tight leading-tight px-0">
                    { qr.appClass.label }
                </h3>
            </div>

            <div class="flex flex-wrap items-center justify-center gap-2">
                <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700/60 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                    <CalendarDays class="w-3 h-3" />

                    { qr.date }
                </div>

                <div class="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-lds-gold/10 text-[10px] font-bold uppercase tracking-widest text-lds-navy dark:text-lds-gold">
                    <Clock class="w-3 h-3" />

                    { qr.startHour } - { qr.endHour }
                </div>
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
        itemName    = { qr.appClass.label }
        itemExtra   = { qr.date }
    />
</Dialog>


<style>
    @media print {
        :global(.print-only-container) {
            display         : flex !important;
            flex-direction  : column !important;
            align-items     : center !important;
            justify-content : center !important;
            width           : 100% !important;
            margin          : 0 auto !important;
        }
    }
</style>
