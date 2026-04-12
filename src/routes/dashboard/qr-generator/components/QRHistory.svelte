<script lang="ts">
    import { fly } from 'svelte/transition';

    import { 
        createQuery, 
        createMutation, 
        useQueryClient 
    }                       from '@tanstack/svelte-query';
    import { toast }        from 'svelte-sonner';

    import connectRequest, {
        isApiError
    }                       from '$lib/services/fetch.service';
    import type {
        QR,
        QRHistoryResponse
    }                       from '$lib/models/qr/qr.model';
    import { METHOD }       from '$lib/services/http-codes';
    import { LDS_CLASSES }  from '$lib/utils/classes';
    import QRIcon           from '$lib/icons/QRIcon.svelte';
    import Paginator        from '$lib/components/shared/Paginator.svelte';
    import Dialog           from '$lib/components/shared/Dialog.svelte';
    import ConfirmDelete    from '$lib/components/shared/ConfirmDelete.svelte';


    export interface Props {
        onEdit : ( qr: QR ) => void;
    }


    let { onEdit }: Props = $props();


    interface GroupedItem extends QR {
        formattedDate : string;
        classLabel    : string;
    }

    // ─── Estado ───────────────────────────────────────────────────────────────
    const currentYear   = new Date().getFullYear();
    const yearOptions   = Array.from( { length: 5 }, ( _, i ) => currentYear - i );
    const monthOptions  = [
        { value: 0,  label: 'Enero' },
        { value: 1,  label: 'Febrero' },
        { value: 2,  label: 'Marzo' },
        { value: 3,  label: 'Abril' },
        { value: 4,  label: 'Mayo' },
        { value: 5,  label: 'Junio' },
        { value: 6,  label: 'Julio' },
        { value: 7,  label: 'Agosto' },
        { value: 8,  label: 'Septiembre' },
        { value: 9,  label: 'Octubre' },
        { value: 10, label: 'Noviembre' },
        { value: 11, label: 'Diciembre' },
    ];


    let selectedYear    = $state( currentYear );
    let selectedType    = $state( '' );
    let selectedMonth   = $state<number | ''>( '' );
    let currentPage     = $state( 1 );
    let pageSize        = $state( 10 );


    let qrToDelete      = $state<QR | null>( null );
    let isConfirmOpen   = $state( false );


    const queryClient   = useQueryClient();

    // ─── Query ────────────────────────────────────────────────────────────────
    const historyQuery = createQuery( () => ({
        queryKey    : [ 'qr-history', selectedYear, currentPage, pageSize ],
        queryFn     : async (): Promise<QRHistoryResponse> => {
            const result = await connectRequest<QRHistoryResponse>({
                endpoint    : `qr/get-history?year=${ selectedYear }&page=${ currentPage }&size=${ pageSize }`,
                method      : METHOD.GET,
                isInternal  : true
            });

            if ( isApiError( result )) throw result;

            return result;
        },
        staleTime: 1000 * 60 * 2
    }));


    const deleteMutation = createMutation( () => ({
        mutationFn: async ( id: string ) => {
            const result = await connectRequest({
                endpoint    : `qr/delete?id=${ id }`,
                method      : METHOD.DELETE,
                isInternal  : true
            });

            if ( isApiError( result ) ) throw result;
            return result;
        },
        onSuccess: () => {
            toast.success( 'QR eliminado correctamente' );
            queryClient.invalidateQueries({ queryKey: [ 'qr-history' ] });
            queryClient.invalidateQueries({ queryKey: [ 'qrs-today' ] });
            isConfirmOpen = false;
        },
        onError: ( err: any ) => {
            toast.error( err.message || 'Error al eliminar el QR' );
        }
    }));

    // ─── Agrupado por mes (con filtros client-side) ───────────────────────────
    const groupedHistory = $derived.by( () => {
        if ( !historyQuery.data?.items ) return {} as Record<string, GroupedItem[]>;

        const grouped: Record<string, GroupedItem[]> = {};

        historyQuery.data.items
            .filter( item => {
                if ( selectedType && item.type !== selectedType ) return false;
                if ( selectedMonth !== '' && new Date( item.date ).getMonth() !== selectedMonth ) return false;
                return true;
            })
            .forEach( item => {
                const date      = new Date( item.date );
                const monthYear = date
                    .toLocaleString( 'es-ES', { month: 'long', year: 'numeric' } )
                    .replace( /^\w/, c => c.toUpperCase() );

                if ( !grouped[monthYear] ) grouped[monthYear] = [];

                const dayStr        = date.toLocaleString( 'es-ES', { weekday: 'long' } );
                const formattedDate = `${ dayStr.charAt( 0 ).toUpperCase() + dayStr.slice( 1 ) } ${ date.getDate() }`;
                const classLabel    = LDS_CLASSES.find( c => c.slug === item.type )?.label 
                                        ?? ( item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('-', ' ') );

                grouped[monthYear].push({ ...item, formattedDate, classLabel });
            });

        return grouped;
    });


    function canManage( dateStr: string ) {
        const today = new Date();
        today.setHours( 0, 0, 0, 0 );
        
        const date = new Date( dateStr );
        date.setHours( 0, 0, 0, 0 );
        
        return date.getTime() >= today.getTime();
    }

    const totalPages        = $derived( historyQuery.data?.pages ?? 1 );
    const hasActiveFilters  = $derived( selectedType !== '' || selectedMonth !== '' );

    // ─── Handlers ─────────────────────────────────────────────────────────────
    function handlePageChange( page: number ): void {
        currentPage = page;
    }


    function handlePageSizeChange( size: number ): void {
        pageSize    = size;
        currentPage = 1;
    }


    function handleYearChange( e: Event ): void {
        selectedYear = Number( ( e.target as HTMLSelectElement ).value );
        currentPage  = 1;
    }


    function handleTypeChange( e: Event ): void {
        selectedType = ( e.target as HTMLSelectElement ).value;
        currentPage  = 1;
    }


    function handleMonthChange( e: Event ): void {
        const val   = ( e.target as HTMLSelectElement ).value;
        selectedMonth   = val === '' ? '' : Number( val );
        currentPage     = 1;
    }


    function clearFilters(): void {
        selectedType    = '';
        selectedMonth   = '';
        currentPage     = 1;
    }


    function openDeleteConfirm( qr: QR ) {
        qrToDelete    = qr;
        isConfirmOpen = true;
    }
</script>


<div in:fly={{ y: 20, duration: 400 }} class="w-full space-y-6 pb-12">
    <!-- Barra de filtros -->
    <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-3">

            <!-- Año -->
            <div class="flex items-center gap-2">
                <label for="qr-history-year" class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0">
                    Año
                </label>

                <div class="relative">
                    <select
                        id       = "qr-history-year"
                        value    = { selectedYear }
                        onchange = { handleYearChange }
                        class    = "appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-semibold outline-none transition-all duration-200
                                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                    border border-gray-200 dark:border-gray-700
                                    focus:border-lds-navy dark:focus:border-lds-gold shadow-sm cursor-pointer"
                    >
                        {#each yearOptions as year}
                            <option value={ year }>{ year }</option>
                        {/each}
                    </select>

                    <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Separador -->
            <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

            <!-- Tipo de QR -->
            <div class="flex items-center gap-2">
                <label for="qr-history-type" class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0">
                    Clase
                </label>

                <div class="relative">
                    <select
                        id       = "qr-history-type"
                        value    = { selectedType }
                        onchange = { handleTypeChange }
                        class    = "appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-semibold outline-none transition-all duration-200
                                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                    border border-gray-200 dark:border-gray-700
                                    focus:border-lds-navy dark:focus:border-lds-gold shadow-sm cursor-pointer
                                    { selectedType ? 'border-lds-navy dark:border-lds-gold text-lds-navy dark:text-lds-gold' : '' }"
                    >
                        <option value="">Todas</option>
                        {#each LDS_CLASSES as cls}
                            <option value={ cls.slug }>{ cls.label }</option>
                        {/each}
                    </select>

                    <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Separador -->
            <div class="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

            <!-- Mes -->
            <div class="flex items-center gap-2">
                <label for="qr-history-month" class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide shrink-0">
                    Mes
                </label>

                <div class="relative">
                    <select
                        id       = "qr-history-month"
                        value    = { selectedMonth }
                        onchange = { handleMonthChange }
                        class    = "appearance-none pl-3 pr-8 py-2 rounded-lg text-sm font-semibold outline-none transition-all duration-200
                                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                                    border border-gray-200 dark:border-gray-700
                                    focus:border-lds-navy dark:focus:border-lds-gold shadow-sm cursor-pointer
                                    { selectedMonth !== '' ? 'border-lds-navy dark:border-lds-gold text-lds-navy dark:text-lds-gold' : '' }"
                    >
                        <option value="">Todos</option>
                        {#each monthOptions as m}
                            <option value={ m.value }>{ m.label }</option>
                        {/each}
                    </select>

                    <div class="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                        <svg class="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Limpiar filtros -->
            {#if hasActiveFilters}
                <button
                    onclick = { clearFilters }
                    class   = "flex items-center gap-1.5 text-xs font-semibold text-red-500 dark:text-red-400
                        hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>

                    Limpiar filtros
                </button>
            {/if}

            <!-- Total -->
            {#if historyQuery.data}
                <span class="ml-auto text-sm text-gray-400 dark:text-gray-500">
                    { historyQuery.data.total } QR{ historyQuery.data.total !== 1 ? 's' : '' } en total
                </span>
            {/if}
        </div>
    </div>

    <!-- Estado: cargando (skeleton) -->
    {#if historyQuery.isPending}
        <div class="space-y-6">
            {#each [ 1, 2 ] as group}
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                    <!-- Header del mes (skeleton) -->
                    <div class="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div class="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                    </div>

                    <!-- Items (skeleton) -->
                    <div class="divide-y divide-gray-100 dark:divide-gray-700">
                        {#each [ 1, 2, 3 ] as _}
                            <div class="flex items-center justify-between p-5">
                                <div class="flex items-center gap-5">
                                    <div class="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0"></div>
                                    <div class="space-y-2">
                                        <div class="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                        <div class="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                        <div class="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                    </div>
                                </div>

                                <div class="flex flex-col items-end gap-2">
                                    <div class="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                    <div class="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        </div>

    <!-- Estado: error -->
    {:else if historyQuery.isError}
        <div class="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <svg class="w-10 h-10 mx-auto mb-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p class="font-semibold">Error al cargar el historial</p>
            <p class="text-sm text-red-400 mt-1">Verifica tu conexión e intenta nuevamente</p>
        </div>

    <!-- Estado: datos -->
    {:else}
        {#if Object.keys( groupedHistory ).length === 0}
            <div class="py-16 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p class="font-semibold">No hay registros para { selectedYear }</p>
                <p class="text-sm mt-1">Prueba con otro año</p>
            </div>

        {:else}
            {#each Object.entries( groupedHistory ) as [ monthYear, items ]}
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <!-- Header mes -->
                    <div class="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white capitalize">{ monthYear }</h3>
                    </div>

                    <!-- Items -->
                    <div class="divide-y divide-gray-100 dark:divide-gray-700">
                        {#each items as item ( item._id )}
                            <div class="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <!-- Icono + Info -->
                                <div class="flex items-center gap-5">
                                    <div class="w-14 h-14 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center text-lds-navy dark:text-lds-gold shrink-0 border border-gray-200 dark:border-gray-700">
                                        <QRIcon size={32} />
                                    </div>

                                    <div>
                                        <h4 class="font-bold text-gray-900 dark:text-gray-100 text-base">
                                            { item.classLabel }
                                        </h4>

                                        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                            { item.formattedDate } hora { item.start_hour } – { item.end_hour }
                                        </p>
                                    </div>
                                </div>

                                <!-- Badge + Asistentes + Acciones -->
                                <div class="flex items-center gap-6 shrink-0 ml-4">
                                    <div class="flex flex-col items-end gap-1.5">
                                        <span class="bg-blue-50 text-blue-700 dark:bg-lds-gold/20 dark:text-lds-gold text-xs px-3 py-1.5 rounded-full font-bold tracking-wide">
                                            Generado
                                        </span>

                                        <span class="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                            { item.assist_count } asistente{ item.assist_count !== 1 ? 's' : '' }
                                        </span>
                                    </div>

                                    <!-- Acciones -->
                                    <div class="flex gap-2">
                                        {#if canManage( item.date )}
                                            <button
                                                onclick = { () => onEdit( item ) }
                                                class   = "p-2 rounded-lg text-gray-400 hover:text-lds-navy dark:hover:text-lds-gold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                                                title   = "Editar programación"
                                            >
                                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>

                                            <button
                                                onclick = { () => openDeleteConfirm( item ) }
                                                class   = "p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                                                title   = "Eliminar código"
                                            >
                                                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {/each}
        {/if}

        <!-- Paginador -->
        <Paginator
            currentPage      = { currentPage }
            totalPages       = { totalPages }
            pageSize         = { pageSize }
            onPageChange     = { handlePageChange }
            onPageSizeChange = { handlePageSizeChange }
        />
    {/if}
</div>

<!-- Dialog de Confirmación de Eliminación -->
<Dialog
    open    = { isConfirmOpen }
    onClose = { () => isConfirmOpen = false }
>
    {#if qrToDelete}
        <ConfirmDelete
            onConfirm   = { () => deleteMutation.mutate( qrToDelete!._id ) }
            onClose     = { () => isConfirmOpen = false }
            isPending   = { deleteMutation.isPending }
            title       = "¿Eliminar registro del historial?"
            description = { `Estás a punto de eliminar el QR de ${ qrToDelete.type }. Esta acción no se puede deshacer.` }
            open        = { isConfirmOpen }
        />
    {/if}
</Dialog>
