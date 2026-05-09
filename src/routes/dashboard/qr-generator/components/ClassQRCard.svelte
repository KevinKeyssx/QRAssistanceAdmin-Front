<script lang="ts">
	import { onMount } from 'svelte';

    import {
        CalendarDays,
        Clock,
        FileText,
        Pen,
        Printer,
        Share2,
        Trash
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
		qr        : QRMapped;
		disabled? : boolean;
		canManage?: boolean;
		onEdit?   : () => void;
		onDelete? : () => void;
		shareQR?  : ( url: string, label: string ) => void;
	}



    let {
        qr,
        disabled  = false,
        canManage = true,
        onEdit,
        onDelete,
        shareQR
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
        <div class="relative w-max p-4 bg-white rounded-xl shadow-inner border border-gray-100 transition-all duration-500 ">
            <div bind:this={ qrRef }></div>

            <!-- Glow sutil de fondo -->
            <div class="absolute inset-0 bg-lds-navy/5 dark:bg-lds-gold/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10"></div>

            <!-- Acciones de Gestión (Over QR) -->
            {#if canManage}
                <div class="absolute inset-0 flex items-center justify-center gap-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] bg-white/20 dark:bg-gray-900/20 rounded-xl print:hidden pointer-events-none group-hover:pointer-events-auto">
                    {#if onEdit}
                        <button
                            onclick = { onEdit }
                            class   = "p-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-600 hover:text-lds-navy dark:text-gray-300 dark:hover:text-lds-gold shadow-lg border border-gray-100 dark:border-gray-700 transition-all active:scale-90"
                            title   = "Editar programación"
                        >
                            <Pen class="w-5 h-5" />
                        </button>
                    {/if}

                    <button
                        onclick = { () => shareQR?.( qr.url, qr.appClass.label ) }
                        class   = "p-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-600 hover:text-lds-navy dark:text-gray-300 dark:hover:text-lds-gold shadow-lg border border-gray-100 dark:border-gray-700 transition-all active:scale-90"
                        title   = "Compartir enlace"
                    >
                        <Share2 class="w-5 h-5" />
                    </button>


                    {#if onDelete}
                        <button
                            onclick = { () => isConfirmOpen = true }
                            class   = "p-2.5 rounded-xl bg-white dark:bg-gray-800 text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-500 shadow-lg border border-gray-100 dark:border-gray-700 transition-all active:scale-90"
                            title   = "Eliminar código"
                        >
                            <Trash class="w-5 h-5" />
                        </button>
                    {/if}
                </div>
            {/if}
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

            <!-- Acciones cuand es mobil -->
            <button
                onclick = { onEdit }
                { disabled }
                class   = "flex md:hidden items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200/50 dark:border-gray-600/50 transition-all font-bold text-sm shadow-sm active:scale-95 disabled:opacity-50"
            >
                <Pen class="w-4 h-4 dark:text-lds-gold dark:hover:text-lds-navy" />
            </button>

            <button
                onclick  = { () => shareQR?.( qr.url, qr.appClass.label ) }
                { disabled }
                class    = "flex md:hidden items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200/50 dark:border-gray-600/50 transition-all font-bold text-sm shadow-sm active:scale-95 disabled:opacity-50"
                title    = "Compartir enlace"
            >
                <Share2 class="w-4 h-4" />
            </button>


            <button
                onclick = { () => isConfirmOpen = true }
                { disabled }
                class   = "flex md:hidden items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200/50 dark:border-gray-600/50 transition-all font-bold text-sm shadow-sm active:scale-95 disabled:opacity-50"
            >
                <Trash class="w-4 h-4 hover:text-red-500" />
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
