<script lang="ts">
    import { fly } from 'svelte/transition';

    import { 
        createQuery, 
        createMutation, 
        useQueryClient 
    }                   from '@tanstack/svelte-query';
    import { toast }    from 'svelte-sonner';
    import { QrCode }   from 'lucide-svelte';

    import connectRequest, {
        isApiError
    }                       from '$lib/services/fetch.service';
    import type {
        QR,
        QRHistoryResponse
    }                       from '$lib/models/qr/qr.model';
    import { METHOD }       from '$lib/services/http-codes';
    import { getClassName } from '$lib/utils/classes';
    import Paginator        from '$lib/components/shared/Paginator.svelte';
    import Dialog           from '$lib/components/shared/Dialog.svelte';
    import ConfirmDelete    from '$lib/components/shared/ConfirmDelete.svelte';
    import AssistanceForm   from '$lib/components/dashboard/assistance/AssistanceForm.svelte';
    import YearSelect       from '$lib/components/shared/filter/YearSelect.svelte';
    import ClasesSelect     from '$lib/components/shared/filter/ClasesSelect.svelte';
    import MonthSelect      from '$lib/components/shared/filter/MonthSelect.svelte';
    import ActionButtons    from '$lib/components/shared/ActionButtons.svelte';


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


    let selectedYear    = $state( currentYear );
    let selectedType    = $state( '' );
    let selectedMonth   = $state<number | ''>( '' );

    // Para los componentes Select que trabajan con strings
    let yearStr         = $state( currentYear.toString() );
    let monthStr        = $state( '' );

    // Sincronización
    $effect( () => {
        selectedYear = Number( yearStr );
        currentPage = 1;
    });

    $effect( () => {
        selectedMonth = monthStr === '' ? '' : Number( monthStr );
        currentPage = 1;
    });

    let currentPage     = $state( 1 );
    let pageSize        = $state( 10 );


    let qrToDelete      = $state<QR | null>( null );
    let isConfirmOpen   = $state( false );

    let isRegisterDialogOpen = $state( false );
    let selectedQrId         = $state( '' );


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

            if ( isApiError( result )) throw result;

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
                const classLabel    = getClassName( item.type );

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


    function clearFilters(): void {
        selectedType    = '';
        monthStr        = '';
        currentPage     = 1;
    }


    function openDeleteConfirm( qr: QR ) {
        qrToDelete    = qr;
        isConfirmOpen = true;
    }


    function openRegister( sessionId: string ) {
        selectedQrId         = sessionId;
        isRegisterDialogOpen = true;
    }
</script>


<div in:fly={{ y: 20, duration: 400 }} class="w-full space-y-6 pb-12">
    <!-- Barra de filtros -->
    <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-end gap-4 overflow-x-auto pb-2">
            <YearSelect bind:value={ yearStr } class="w-28 shrink-0" />

            <div class="h-10 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block shrink-0"></div>

            <ClasesSelect 
                bind:value      = { selectedType } 
                onValueChange   = { () => currentPage = 1 } 
                class           = "w-48 shrink-0"
            />

            <div class="h-10 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block shrink-0"></div>

            <MonthSelect bind:value={ monthStr } class="w-40 shrink-0" />

            <div class="mb-1 sm:mb-0">
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
                                <div class="flex items-center gap-3 sm:gap-5 md:gap-3 lg:gap-5">
                                    <div class="w-10 h-10 sm:w-14 sm:h-14 md:w-10 md:h-10 lg:w-14 lg:h-14 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center text-lds-navy dark:text-lds-gold shrink-0 border border-gray-200 dark:border-gray-700">
                                        <!-- <QRIcon size={32} /> -->
                                        <QrCode class="w-5 h-5 sm:w-8 sm:h-8 md:w-5 md:h-5 lg:w-8 lg:h-8" />
                                    </div>

                                    <div>
                                        <h4 class="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base md:text-sm lg:text-base">
                                            { item.classLabel }
                                        </h4>

                                        <p class="text-xs sm:text-sm md:text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                            { item.formattedDate } hora { item.start_hour } – { item.end_hour }
                                        </p>
                                    </div>
                                </div>

                                <!-- Badge + Asistentes + Acciones -->
                                <div class="flex items-center gap-6 shrink-0 ml-4">
                                    <div class="flex flex-col items-end gap-1.5">
                                        <span class="hidden lg:block bg-blue-50 text-lds-navy dark:bg-lds-gold/20 dark:text-lds-gold text-xs px-3 py-1.5 rounded-full font-bold tracking-wide">
                                            Generado
                                        </span>

                                        <span
                                            class="text-xs text-gray-400 dark:text-gray-500 font-medium"
                                            title={ item.assist_count === 1 ? '1 asistente' : `${ item.assist_count } asistentes` }
                                        >
                                            { item.assist_count }
                                            <span class="inline lg:hidden">
                                                as.
                                            </span>
                                            <span class="hidden lg:inline">
                                                asistente{ item.assist_count !== 1 ? 's' : '' }
                                            </span>
                                        </span>
                                    </div>

                                    <!-- Acciones -->
                                    <ActionButtons 
                                        onRegister  = { ( ) => openRegister( item.session_id ) }
                                        onEdit      = { ( ) => onEdit( item ) }
                                        onDelete    = { ( ) => openDeleteConfirm( item ) }
                                        showEdit    = { canManage( item.date ) }
                                        showDelete  = { canManage( item.date ) }
                                        editTitle   = "Editar programación"
                                        deleteTitle = "Eliminar código"
                                    />
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
    onClose = { ( ) => isConfirmOpen = false }
>
    {#if qrToDelete}
        <ConfirmDelete
            onConfirm   = { ( ) => deleteMutation.mutate( qrToDelete!._id ) }
            onClose     = { ( ) => isConfirmOpen = false }
            isPending   = { deleteMutation.isPending }
            title       = "¿Eliminar registro del historial?"
            description = { `Estás a punto de eliminar el QR de ${ qrToDelete.type }. Esta acción no se puede deshacer.` }
            open        = { isConfirmOpen }
        />
    {/if}
</Dialog>


<Dialog
    open        = { isRegisterDialogOpen }
    title       = "Registro Manual de Asistencia"
    description = "Registra la asistencia para esta sesión seleccionando un miembro."
    onClose     = { ( ) => isRegisterDialogOpen = false }
>
    <AssistanceForm 
        initialQrId   = { selectedQrId }
        onCancel      = { ( ) => isRegisterDialogOpen = false }
        onSuccess     = { ( ) => isRegisterDialogOpen = false }
    />
</Dialog>
