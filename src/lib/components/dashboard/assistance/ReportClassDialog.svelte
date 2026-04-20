<script lang="ts">
    import { 
        FileSpreadsheet, 
        Download, 
        LoaderCircle, 
        Calendar as CalendarIcon,
        ClipboardList
    }                       from 'lucide-svelte';
    import * as XLSX        from 'xlsx';
    import { toast }        from 'svelte-sonner';
    import { fade }         from 'svelte/transition';
    import { 
        today as getToday, 
        getLocalTimeZone 
    }                       from "@internationalized/date";

    import Dialog           from '$lib/components/shared/Dialog.svelte';
    import Calendar         from '$lib/components/shared/Calendar.svelte';
    import { LDS_CLASSES }  from '$lib/utils/classes';
    import connectRequest, { 
        isApiError 
    }                       from '$lib/services/fetch.service';
    import { METHOD }       from '$lib/services/http-codes';
    import type { 
        AssistanceResponse 
    }                       from '$lib/models/assistance/assistance.model';


    interface Props {
        open    : boolean;
        onClose : ( ) => void;
    }


    let { open, onClose }: Props = $props();

    let selectedDate = $state( getToday( getLocalTimeZone() ) );
    let loadingSlug  = $state<string | null>( null );


    async function exportReport( qrType?: string, label?: string ) {
        loadingSlug = qrType || 'all';

        // Convertimos el valor del calendario a string YYYY-MM-DD
        const dateStr = selectedDate.toString();

        try {
            // Construimos el endpoint basado en si hay un qrType específico
            let endpoint = `assistances/get-all?page=1&size=1000&date=${ dateStr }`;
            if ( qrType ) {
                endpoint += `&qr_type=${ qrType }`;
            }

            const result = await connectRequest<AssistanceResponse>( {
                endpoint,
                method     : METHOD.GET,
                isInternal : true
            });

            if ( isApiError( result ) ) throw result;

            const assistances = result.items;

            if ( !assistances || assistances.length === 0 ) {
                toast.error( `No hay asistencias registradas hoy ${ qrType ? `para ${ label }` : '' }.` );
                return;
            }

            const dataToExport = assistances.map( ( a ) => ( {
                'Fecha'         : new Date( a.created_at ).toLocaleDateString( 'es-ES' ),
                'Hora'          : new Date( a.created_at ).toLocaleTimeString( 'es-ES', { hour: '2-digit', minute: '2-digit' } ),
                'Miembro'       : `${ a.member.name } ${ a.member.last_name }`,
                'Organización'  : a.qr.type.toUpperCase().replace( '-', ' ' ),
            }));

            const worksheet = XLSX.utils.json_to_sheet( dataToExport );
            const workbook  = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet( workbook, worksheet, 'Asistencias' );

            const fileName = qrType 
                ? `Reporte_${ label?.replace( /\s+/g, '_' ) }_${ dateStr }.xlsx` 
                : `Reporte_General_${ dateStr }.xlsx`;

            XLSX.writeFile( workbook, fileName );

            toast.success( `Reporte ${ qrType ? `de ${ label }` : 'general' } generado con éxito` );
        } catch ( error ) {
            console.error( 'Error exportando excel:', error );
            toast.error( 'Error al generar el reporte' );
        } finally {
            loadingSlug = null;
        }
    }
</script>


<Dialog
    { open }
    title       = "Centro de Reportes"
    description = "Descarga reportes detallados en Excel de la asistencia de hoy."
    onClose     = { onClose }
>
    <div class="flex flex-col gap-6 py-2">
        
        <!-- SECCIÓN: SELECTOR DE FECHA -->
        <div class="flex flex-col gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
            <div class="flex items-center gap-2 mb-1">
                <CalendarIcon class="w-4 h-4 text-lds-navy dark:text-lds-gold" />
                <span class="text-xs font-black uppercase tracking-widest text-gray-500">Fecha del Reporte</span>
            </div>
            <Calendar bind:value={ selectedDate } class="w-full" />
        </div>

        <!-- SECCIÓN: REPORTE GENERAL -->
        <div class="group relative overflow-hidden">
            <button
                onclick     = { ( ) => exportReport() }
                disabled    = { loadingSlug !== null }
                class       = "w-full flex items-center justify-between p-5 rounded-2xl bg-lds-navy dark:bg-gray-900 border border-white/10 shadow-lg transition-all active:scale-[0.98] disabled:opacity-70 group-hover:shadow-lds-navy/20"
            >
                <!-- Efecto de brillo de fondo -->
                <div class="absolute inset-0 bg-linear-to-r from-lds-gold/0 via-lds-gold/5 to-lds-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                <div class="relative flex items-center gap-4">
                    <div class="p-3 rounded-xl bg-white/10 text-lds-gold">
                        <FileSpreadsheet class="w-6 h-6" />
                    </div>
                    <div class="flex flex-col items-start translate-z-0">
                        <span class="text-white font-bold text-lg">Reporte General</span>
                        <span class="text-white/60 text-[10px] uppercase tracking-widest font-black">
                            { selectedDate.toString() === getToday( getLocalTimeZone() ).toString() ? 'Todas las organizaciones hoy' : `Asistencia del ${ selectedDate.toString() }` }
                        </span>
                    </div>
                </div>

                <div class="relative">
                    {#if loadingSlug === 'all'}
                        <LoaderCircle class="w-6 h-6 text-lds-gold animate-spin" />
                    {:else}
                        <div class="p-2 rounded-lg bg-lds-gold text-gray-900 shadow-sm group-hover:translate-x-1 transition-transform">
                            <Download class="w-5 h-5" />
                        </div>
                    {/if}
                </div>
            </button>
        </div>

        <div class="flex items-center gap-4">
            <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Filtrar por Organización</span>
            <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800"></div>
        </div>

        <!-- GRID: REPORTES POR CLASE -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each LDS_CLASSES as appClass, i}
                <div in:fade={{ delay: i * 50, duration: 300 }}>
                    <button
                        onclick     = { ( ) => exportReport( appClass.slug, appClass.label ) }
                        disabled    = { loadingSlug !== null }
                        class       = "w-full flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-lds-gold/30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group active:scale-[0.97] disabled:opacity-50"
                    >
                        <div class="flex items-center gap-3">
                            <div class="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 text-lds-navy dark:text-lds-gold group-hover:scale-110 transition-transform">
                                {#if appClass.icon}
                                    <appClass.icon class="w-5 h-5" />
                                {:else}
                                    <ClipboardList class="w-5 h-5" />
                                {/if}
                            </div>
                            <span class="text-sm font-bold text-gray-700 dark:text-gray-200 text-left leading-tight max-w-[120px]">
                                { appClass.label }
                            </span>
                        </div>

                        <div class="flex items-center justify-center">
                            {#if loadingSlug === appClass.slug}
                                <LoaderCircle class="w-5 h-5 text-lds-navy dark:text-lds-gold animate-spin" />
                            {:else}
                                <Download class="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-lds-gold transition-colors" />
                            {/if}
                        </div>
                    </button>
                </div>
            {/each}
        </div>
    </div>
</Dialog>
