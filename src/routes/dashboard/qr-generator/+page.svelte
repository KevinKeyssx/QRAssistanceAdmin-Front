<script lang="ts">
    import { fade } from 'svelte/transition';
    import { env }  from '$env/dynamic/public';

    import { createQuery }          from '@tanstack/svelte-query';
    import { Printer, FileStack }   from 'lucide-svelte';

    import connectRequest, {
        isApiError
    }                               from '$lib/services/fetch.service';
    import {
        printQRs,
        downloadBulkPDFs
    }                               from '$lib/utils/qr-export';
    import QRIcon                   from '$lib/icons/QRIcon.svelte';
    import Dialog                   from '$lib/components/shared/Dialog.svelte';
    import Tabs                     from '$lib/components/shared/Tabs.svelte';
    import GenerateNewQR            from './components/generateNewQR.svelte';
    import QRHistory                from './components/QRHistory.svelte';
    import QrsToday                 from './components/QrsToday.svelte';
    import { METHOD }               from '$lib/services/http-codes';
    import { formatDate }           from '$lib/utils/tempo';
    import type { QR, QRMapped }    from '$lib/models/qr/qr.model';
    import { LDS_ALL_CLASSES }      from '$lib/utils/classes';


    let activeTab       = $state<'today' | 'history'>( 'today' );
    let isDialogOpen    = $state( false );
    let qrToEdit        = $state<QR | null>( null );
    let isExporting     = $state( false );


    const tabOptions = [
        { value: 'today', label: 'Generados hoy' },
        { value: 'history', label: 'Historial' }
    ];

    // ─── Query ────────────────────────────────────────────────────────────────
    const todayQuery = createQuery( () => ({
        queryKey    : [ 'qrs-today' ],
        queryFn     : async (): Promise<QR[]> => {
            const result = await connectRequest<QR[]>({
                endpoint    : 'qr/qrs-today',
                method      : METHOD.POST,
                isInternal  : true,
                body        : {}
            });

            if ( isApiError( result ) ) throw result;

            return result;
        },
        staleTime: 1000 * 60 * 5
    }));


    const mappedItems: QRMapped[] = $derived.by( () => {
        if ( !todayQuery.data ) return [];

        return todayQuery.data.map( item => {
            let appClass = LDS_ALL_CLASSES.find( c => c.slug === item.type );
            // let appClass = LDS_CLASSES.find( c => c.slug === item.type );

            // if ( !appClass ) {
            //     appClass = {
            //         slug            : item.type,
            //         label           : getClassName( item.type ),
            //         icon            : null,
            //         classCompatible : []
            //     } as any; // Cast for safety in the mapping fallback
            // }

            const url = `${ env.PUBLIC_FRONTEND_QR_URL }/${ item.session_id }?class=${ item.type }`;

            return {
                id        : item._id,
                url,
                date      : formatDate( item.date ),
                startHour : item.start_hour,
                endHour   : item.end_hour,
                original  : item,
                appClass  : appClass!,
            };
        });
    });

    // ─── Batch Actions ────────────────────────────────────────────────────────
    async function handlePrintAll(): Promise<void> {
        if ( mappedItems.length === 0 ) return;

        isExporting = true;

        try {
            await printQRs( mappedItems );
        } finally {
            isExporting = false;
        }
    }


    async function handleDownloadAll(): Promise<void> {
        if ( mappedItems.length === 0 ) return;

        isExporting = true;

        try {
            await downloadBulkPDFs( mappedItems );
        } finally {
            isExporting = false;
        }
    }


    function handleOpenCreate(): void {
        qrToEdit     = null;
        isDialogOpen = true;
    }


    function handleEdit( qr: QR ): void {
        qrToEdit     = qr;
        isDialogOpen = true;
    }


    function handleSuccess(): void {
        isDialogOpen = false;
        qrToEdit     = null;
    }
</script>


<svelte:head>
	<title>Generador QR | Dashboard | QR Assistance</title>
</svelte:head>


<main class="flex flex-col gap-6 w-full max-w-6xl mx-auto align-top">
	<div class="flex justify-between items-center print:hidden">
		<h1 class="text-3xl font-bold text-lds-navy dark:text-lds-gold">Generador QR</h1>

        <button
            onclick = { handleOpenCreate }
            class   = "bg-lds-navy text-white dark:bg-lds-gold dark:text-gray-900 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm flex gap-1.5 items-center hover:opacity-90 transition-all active:scale-95"
        >
            <QRIcon />
            <span class="hidden sm:flex">Programar nuevo QR</span>
        </button>
	</div>

    <!-- TABS -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs bind:activeTab={ activeTab } options={ tabOptions } />

        {#if activeTab === 'today' && mappedItems.length > 0}
            <div class="flex items-center gap-2 print:hidden" in:fade>
                <button
                    onclick     = { handlePrintAll }
                    disabled    = { isExporting }
                    title       = "Imprimir todos los QRs"
                    class       = "flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 lg:px-4 lg:py-2 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-xs font-bold shadow-sm disabled:opacity-50"
                >
                    <Printer class="w-4 h-4" />

                    <span class="sm:hidden lg:flex">
                        Imprimir Todo
                    </span>
                </button>

                <button
                    onclick     = { handleDownloadAll }
                    disabled    = { isExporting }
                    title       = "Descargar PDFs"
                    class       = "flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-3 lg:px-4 lg:py-2 rounded-xl bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-xs font-bold shadow-sm disabled:opacity-50"
                >
                    <FileStack class="w-4 h-4" />

                    <span class="sm:hidden lg:flex">
                        Descargar PDFs
                    </span>
                </button>
            </div>
        {/if}
    </div>

    {#if activeTab === 'today'}
        <QrsToday 
            items     = { mappedItems } 
            isPending = { todayQuery.isPending }
            isError   = { todayQuery.isError }
            onEdit    = { handleEdit } 
        />
    {/if}

    {#if activeTab === 'history'}
        <QRHistory onEdit={ handleEdit } />
    {/if}
</main>

<Dialog
    open        = { isDialogOpen }
    title       = { qrToEdit ? 'Editar Programación QR' : 'Crear QR Personalizado' }
    description = { qrToEdit ? 'Modifica los parámetros del código QR seleccionado.' : 'Configura los parámetros detallados para crear un código QR de evento especial o uso extraordinario.' }
    onClose     = { () => isDialogOpen = false }
>
    <GenerateNewQR
        qr        = { qrToEdit }
        onCancel  = { () => isDialogOpen = false }
        onSuccess = { handleSuccess }
    />
</Dialog>
