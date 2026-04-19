<script lang="ts">
    import { fly } from 'svelte/transition';

    import { 
        SearchIcon, 
        UserPlus 
    }                       from 'lucide-svelte';
    import { 
        createQuery,
        createMutation,
        useQueryClient
    }                       from '@tanstack/svelte-query';
    import { CalendarDate } from "@internationalized/date";
    import { toast }        from 'svelte-sonner';

    import connectRequest, { 
        isApiError 
    }                       from '$lib/services/fetch.service';
    import type { 
        Assistance,
        AssistanceResponse 
    }                       from '$lib/models/assistance/assistance.model';
    import { METHOD }       from '$lib/services/http-codes';
    import Calendar         from '$lib/components/shared/Calendar.svelte';
    import Paginator        from '$lib/components/shared/Paginator.svelte';
    import AssistanceForm   from '$lib/components/dashboard/assistance/AssistanceForm.svelte';
    import Dialog           from '$lib/components/shared/Dialog.svelte';
    import ConfirmDelete    from '$lib/components/shared/ConfirmDelete.svelte';
    import ClasesSelect     from '$lib/components/shared/filter/ClasesSelect.svelte';

    // ─── Estado ───────────────────────────────────────────────────────────────
    let memberSearch        = $state( '' );
    let activeMemberQuery   = $state( '' );
    let selectedQrType      = $state( '' );
    let selectedDate        = $state<CalendarDate | undefined>( undefined );
    
    let pageSize            = $state<number>( 10 );
    let currentPage         = $state( 1 );

    let isDeleteDialogOpen  = $state( false );
    let assistanceToDelete  = $state<Assistance | null>( null );

    let isRegisterDialogOpen = $state( false );

    const queryClient = useQueryClient();

    // Derivado para la fecha en formato ISO/String para el API
    let dateFilter = $derived( 
        selectedDate 
            ? `${ selectedDate.year }-${ String( selectedDate.month ).padStart( 2, '0' ) }-${ String( selectedDate.day ).padStart( 2, '0' ) }` 
            : '' 
    );

    const assistancesQuery = createQuery( () => ({
        queryKey    : [ 'assistances', currentPage, pageSize, activeMemberQuery, selectedQrType, dateFilter ],
        queryFn     : async (): Promise<AssistanceResponse> => {
            let endpoint = `assistances/get-all?page=${ currentPage }&size=${ pageSize }`;

            if ( activeMemberQuery ) {
                endpoint += `&member_query=${ encodeURIComponent( activeMemberQuery ) }`;
            }

            if ( selectedQrType ) {
                endpoint += `&qr_type=${ encodeURIComponent( selectedQrType ) }`;
            }

            if ( dateFilter ) {
                endpoint += `&date=${ encodeURIComponent( dateFilter ) }`;
            }

            const result = await connectRequest<AssistanceResponse>({
                endpoint,
                method      : METHOD.GET,
                isInternal  : true
            });

            if ( isApiError( result ) ) throw result;
            return result;
        },
        staleTime   : 1000 * 60 * 5
    }));

    const deleteMutation = createMutation( () => ({
        mutationFn  : async ( id: string ) => {
            const result = await connectRequest({
                endpoint    : `assistances/delete?id=${ id }`,
                method      : METHOD.DELETE,
                isInternal  : true
            });
            if ( isApiError( result ) ) throw result;
            return result;
        },
        onSuccess   : () => {
            queryClient.invalidateQueries({ queryKey: [ 'assistances' ] });
            toast.success( 'Asistencia eliminada correctamente' );
            isDeleteDialogOpen  = false;
            assistanceToDelete  = null;
        },
        onError     : ( error: any ) => {
            toast.error( error.message || 'Error al eliminar la asistencia' );
        }
    }));

    // ─── Lógica ───────────────────────────────────────────────────────────────
    const totalPages        = $derived( assistancesQuery.data?.pages ?? 1 );
    const totalAssistances  = $derived( assistancesQuery.data?.total ?? 0 );
    const items             = $derived( assistancesQuery.data?.items ?? [] );


    // Reinicia la página al cambiar filtros o tamaño
    $effect( () => {
        pageSize;
        selectedQrType;
        dateFilter;
        currentPage = 1;
    });


    function handleSearch() {
        activeMemberQuery   = memberSearch;
        currentPage         = 1;
    }

    function handleKeyDown( event: KeyboardEvent ) {
        if ( event.key === 'Enter' ) {
            handleSearch();
        }
    }

    function handlePageChange( page: number ) {
        currentPage = page;
    }

    function handlePageSizeChange( size: number ) {
        pageSize    = size;
        currentPage = 1;
    }

    function openDeleteDialog( assistance: Assistance ) {
        assistanceToDelete  = assistance;
        isDeleteDialogOpen  = true;
    }

    function handleDeleteConfirm() {
        if ( assistanceToDelete ) {
            deleteMutation.mutate( assistanceToDelete._id );
        }
    }

    function clearFilters() {
        memberSearch        = '';
        activeMemberQuery   = '';
        selectedQrType      = '';
        selectedDate        = undefined;
        currentPage         = 1;
    }


    // ─── Helpers de formato ───────────────────────────────────────────────────
    function formatDisplayDate( dateStr: string ) {
        const date = new Date( dateStr );
        return date.toLocaleDateString( 'es-ES', { 
            day     : '2-digit', 
            month   : 'short', 
            year    : 'numeric' 
        });
    }

    function getInitials( name: string, last_name: string ) {
        return `${ name.charAt( 0 ) }${ last_name.charAt( 0 ) }`.toUpperCase();
    }
</script>


<svelte:head>
    <title>Asistencias | Dashboard | QR Assistance</title>
</svelte:head>


<main class="flex flex-col gap-6 w-full max-w-6xl mx-auto align-top pb-10">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 class="text-3xl font-bold text-lds-navy dark:text-lds-gold tracking-tight">Asistencias</h1>

        <div class="flex items-center gap-3">
            {#if assistancesQuery.data }
                <span class="hidden md:inline-flex bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                    { totalAssistances } registros
                </span>
            {/if }

            <button
                onclick = { clearFilters }
                class   = "text-xs font-bold text-lds-navy dark:text-lds-gold hover:underline uppercase tracking-widest px-2 py-1"
            >
                Limpiar Filtros
            </button>
        </div>
    </div>

    <!-- Barra de controles: filtros -->
    <div class="grid grid-cols-1 md:grid-cols-12 gap-5 items-end bg-white dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
        
        <!-- Buscador por Miembro -->
        <div class="md:col-span-5 flex flex-col gap-2">
            <label for="member-search" class="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                Buscar Miembro
            </label>
            <div class="flex gap-2">
                <div class="relative flex-1">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                        </svg>
                    </div>

                    <input
                        bind:value={ memberSearch }
                        id          = "member-search"
                        type        = "text"
                        placeholder = "Nombre o apellido..."
                        onkeydown   = { handleKeyDown }
                        class       = "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all duration-200
                            bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white
                            placeholder:text-gray-400 dark:placeholder:text-gray-500
                            border border-gray-200 dark:border-gray-700
                            focus:border-lds-navy dark:focus:border-lds-gold focus:ring-1 focus:ring-lds-navy dark:focus:ring-lds-gold shadow-sm"
                    />
                </div>

                <button
                    onclick     = { handleSearch }
                    class       = "px-5 py-2.5 bg-lds-navy dark:bg-lds-gold text-white dark:text-gray-900 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 transition-all active:scale-95 shrink-0"
                >
                    <SearchIcon class="w-4 h-4 text-white" />
                    <!-- Buscar -->
                </button>
            </div>
        </div>

        <div class="md:col-span-3">
            <ClasesSelect 
                label         = "Tipo de Clase"
                bind:value     = { selectedQrType } 
                class         = "w-full"
            />
        </div>

        <!-- Filtro por Fecha (Calendar) -->
        <div class="md:col-span-4 flex flex-col gap-2">
            <label for="date-calendar" class="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">
                Fecha de Asistencia
            </label>

            <div class="flex gap-2">
                <Calendar 
                    bind:value  = { selectedDate }
                    class       = "flex-1"
                />

                <button
                    onclick     = { ( ) => isRegisterDialogOpen = true }
                    title       = "Registrar Asistencia Manual"
                    class       = "px-4 py-2.5 bg-lds-navy dark:bg-lds-gold text-white dark:text-gray-900 rounded-xl font-bold text-sm shadow-sm hover:opacity-90 transition-all active:scale-95 shrink-0 flex items-center justify-center"
                >
                    <UserPlus class="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>

    <!-- Info de resultados -->
    {#if assistancesQuery.data && !assistancesQuery.isPending }
        <div in:fly={{ y: -4, duration: 200 }} class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 px-2 mt-1">
            <span>
                Mostrando
                <span class="font-semibold text-gray-700 dark:text-gray-200">
                    { ( currentPage - 1 ) * pageSize + 1 }–{ Math.min( currentPage * pageSize, totalAssistances ) }
                </span>
                de
                <span class="font-semibold text-gray-700 dark:text-gray-200">
                    { totalAssistances }
                </span>
                asistentes
            </span>

            {#if activeMemberQuery || selectedQrType || dateFilter }
                <div class="w-1.5 h-1.5 rounded-full bg-lds-navy dark:bg-lds-gold opacity-40"></div>
                <span class="italic text-xs">Filtros activos</span>
            {/if }
        </div>
    {/if }

    <!-- Lista de asistencias -->
    {#if assistancesQuery.isPending }
        <div class="text-center py-20 bg-white/50 dark:bg-gray-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <div class="w-10 h-10 mx-auto border-4 border-lds-navy border-t-transparent dark:border-lds-gold dark:border-t-transparent rounded-full animate-spin"></div>
            <p class="mt-4 font-bold text-gray-500 dark:text-gray-400 tracking-tight">Sincronizando asistencias...</p>
        </div>
    {:else if assistancesQuery.isError }
        <div class="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30">
            <p class="font-bold">Error al cargar datos</p>
            <p class="text-xs mt-1 opacity-70">Por favor intenta de nuevo más tarde</p>
        </div>
    {:else }
        <div class="bg-white dark:bg-gray-800/60 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700/60 overflow-hidden">
            {#if items.length === 0 }
                <div class="py-24 text-center">
                    <div class="inline-flex items-center justify-center size-20 rounded-3xl bg-gray-50 dark:bg-gray-900 mb-6 text-gray-200 dark:text-gray-700">
                        <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                    </div>
                    <p class="font-bold text-gray-900 dark:text-white text-lg">Sin resultados</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">
                        No pudimos encontrar registros de asistencia con los filtros seleccionados.
                    </p>
                </div>
            {:else }
                <div class="grid grid-cols-1 divide-y divide-gray-50 dark:divide-gray-700/40">
                    {#each items as item ( item._id ) }
                        <div
                            in:fly={{ y: 8, duration: 250 }}
                            class="flex items-center justify-between p-5 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-all duration-300 group"
                        >
                            <!-- Info Miembro -->
                            <div class="flex items-center gap-5 min-w-0">
                                <div class="w-14 h-14 bg-linear-to-br from-lds-navy to-lds-navy/80 dark:from-lds-gold dark:to-lds-gold/80 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-lds-navy/10 dark:shadow-lds-gold/10 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-500">
                                    <span class="text-white dark:text-gray-900 font-black text-lg tracking-tighter">
                                        { getInitials( item.member.name, item.member.last_name ) }
                                    </span>
                                </div>

                                <div class="min-w-0">
                                    <h4 class="font-bold text-gray-900 dark:text-gray-100 text-[17px] tracking-tight truncate">
                                        { item.member.name } { item.member.last_name }
                                    </h4>
                                    <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                        <div class="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100/80 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-lg text-[11px] font-black uppercase tracking-wider">
                                            <div class="w-1.5 h-1.5 rounded-full bg-lds-navy dark:bg-lds-gold"></div>
                                            { item.qr.type }
                                        </div>
                                        <div class="flex items-center gap-1 text-[13px] text-gray-400 dark:text-gray-500 font-medium">
                                            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            { item.qr.start_hour } — { item.qr.end_hour }
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 mt-2 uppercase tracking-wide">
                                        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        { formatDisplayDate( item.qr.date ) }
                                    </div>
                                </div>
                            </div>

                            <!-- Acciones (UI Placeholder) -->
                            <!-- <div class="flex items-center gap-1 sm:gap-2 shrink-0 ml-4 lg:opacity-0 group-hover:opacity-100 transition-all duration-300"> -->
                                <!-- Botón Eliminar -->
                                <button
                                    onclick = { () => openDeleteDialog( item ) }
                                    title   = "Eliminar registro"
                                    class   = "p-2.5 rounded-xl text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all shadow-none hover:shadow-sm active:scale-90"
                                >
                                    <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            <!-- </div> -->
                        </div>
                    {/each }
                </div>
            {/if }
        </div>

        <!-- Paginador -->
        <Paginator
            currentPage      = { currentPage }
            totalPages       = { totalPages }
            pageSize         = { pageSize }
            onPageChange     = { handlePageChange }
            onPageSizeChange = { handlePageSizeChange }
        />
    {/if }
</main>


<ConfirmDelete
    open        = { isDeleteDialogOpen }
    title       = "Eliminar asistencia"
    itemName    = { assistanceToDelete ? `${ assistanceToDelete.member.name } ${ assistanceToDelete.member.last_name }` : '' }
    itemExtra   = { assistanceToDelete ? `Asistencia a ${ assistanceToDelete.qr.type } del ${ formatDisplayDate( assistanceToDelete.qr.date ) }` : '' }
    isPending   = { deleteMutation.isPending }
    onClose     = { ( ) => isDeleteDialogOpen = false }
    onConfirm   = { handleDeleteConfirm }
/>


<Dialog
    open        = { isRegisterDialogOpen }
    title       = "Registro Manual de Asistencia"
    description = "Selecciona un miembro y una sesión QR para registrar la asistencia manualmente."
    onClose     = { ( ) => isRegisterDialogOpen = false }
>
    <AssistanceForm 
        onCancel  = { ( ) => isRegisterDialogOpen = false }
        onSuccess = { ( ) => isRegisterDialogOpen = false }
    />
</Dialog>
