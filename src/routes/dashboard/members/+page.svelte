<script lang="ts">
    import { fly } from 'svelte/transition';

    import { 
        createMutation, 
        useQueryClient,
        createQuery
    }                                   from '@tanstack/svelte-query';
    import { toast }                    from 'svelte-sonner';
    import { FingerprintPattern, Plus } from 'lucide-svelte';


    import type { 
        Member, 
        MemberResponse 
    }                       from '$lib/models/member/member.model';
    import connectRequest, { 
        isApiError 
    }                       from '$lib/services/fetch.service';
    import { METHOD }       from '$lib/services/http-codes';
    import Paginator        from '$lib/components/shared/Paginator.svelte';
    import EditMember       from './components/MemberForm.svelte';
    import AssistanceForm   from '$lib/components/dashboard/assistance/AssistanceForm.svelte';
    import Dialog           from '$lib/components/shared/Dialog.svelte';
    import ConfirmDelete    from '$lib/components/shared/ConfirmDelete.svelte';
    import ActionButtons    from '$lib/components/shared/ActionButtons.svelte';
    import { getClassName } from '$lib/utils/classes';

    // ─── Estado ───────────────────────────────────────────────────────────────
    let searchQuery         = $state( '' );
    let activeSearch        = $state( '' );
    let pageSize            = $state<number>( 50 );
    let currentPage         = $state( 1 );
    let memberToDelete      = $state<Member | null>( null );
    let memberToEdit        = $state<Member | null>( null );
    let isDeleteDialogOpen  = $state( false );
    let isEditDialogOpen    = $state( false );

    let isRegisterDialogOpen = $state( false );
    let selectedMemberId     = $state( '' );

    const queryClient = useQueryClient();

    const membersQuery = createQuery( () => ({
        queryKey    : [ 'members', currentPage, pageSize, activeSearch ],
        queryFn     : async (): Promise<MemberResponse> => {
            const result = await connectRequest<MemberResponse>({
                endpoint    : `members/get-all?page=${ currentPage }&size=${ pageSize }&query=${ encodeURIComponent( activeSearch ) }`,
                method      : METHOD.GET,
                isInternal  : true
            });

            if ( isApiError( result ) ) throw result;
            return result;
        },
        staleTime: 1000 * 60 * 5
    }));

    const deleteMutation = createMutation( () => ({
        mutationFn: async ( id: string ) => {
            const result = await connectRequest<Member>({
                endpoint: `members/delete?id=${ id }`,
                method: METHOD.DELETE,
                isInternal: true
            });
            if ( isApiError( result ) ) throw result;
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ 'members' ] });
            isDeleteDialogOpen = false;
            memberToDelete     = null;

            toast.success( 'Miembro eliminado correctamente' );
        },
        onError: ( error ) => {
            toast.error( String( error ) );
        }
    }));

    // ─── Lógica de filtrado y paginación ──────────────────────────────────────
    const totalPages    = $derived( membersQuery.data?.pages ?? 1 );
    const totalMembers  = $derived( membersQuery.data?.total ?? 0 );
    const items         = $derived( membersQuery.data?.items ?? [] );



    // Reinicia la página al cambiar tamaño
    $effect( () => {
        pageSize;
        currentPage = 1;
    });


    // ─── Acciones ─────────────────────────────────────────────────────────────
    function handleSearch() {
        activeSearch = searchQuery;
        currentPage  = 1;
    }

    function handleKeyDown( event: KeyboardEvent ) {
        if ( event.key === 'Enter' ) {
            handleSearch();
        }
    }


    // ─── Helpers de formato ───────────────────────────────────────────────────
    function formatShortDate( dateStr: string ) {
        const date = new Date( dateStr );
        return date.toLocaleDateString( 'es-ES', { day: '2-digit', month: 'short', year: 'numeric' } );
    }

    function getInitials( name: string, last_name: string ) {
        return `${ name.charAt( 0 ) }${ last_name.charAt( 0 ) }`.toUpperCase();
    }


    // ─── Acciones ─────────────────────────────────────────────────────────────
    function openEdit( member: Member | null = null ) {
        memberToEdit        = member ? { ...member } : null;
        isEditDialogOpen    = true;
    }

    function openDelete( member: Member ) {
        memberToDelete      = member;
        isDeleteDialogOpen  = true;
    }

    function handleDeleteConfirm( member: Member ) {
        deleteMutation.mutate( member._id );
    }

    function openRegister( memberId: string ) {
        selectedMemberId     = memberId;
        isRegisterDialogOpen = true;
    }

    function handlePageChange( page: number ) {
        currentPage = page;
    }

    function handlePageSizeChange( size: number ) {
        pageSize    = size;
        currentPage = 1;
    }
</script>


<svelte:head>
    <title>Miembros | Dashboard | QR Assistance</title>
</svelte:head>


<main class="flex flex-col gap-6 w-full max-w-6xl mx-auto align-top">
    <!-- Encabezado -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 class="text-3xl font-bold text-lds-navy dark:text-lds-gold tracking-tight">Miembros</h1>

        <button
            onclick = { () => openEdit() }
            class   = "flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-lds-navy dark:bg-lds-gold text-white dark:text-gray-900 rounded-lg font-bold text-sm shadow-sm hover:opacity-90 transition-all active:scale-95"
        >
            <Plus class="w-4 h-4" />

            <span>Agregar Miembro</span>
        </button>
    </div>

    <!-- Barra de controles: buscador -->
    <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <!-- Buscador con botón -->
        <div class="relative flex-1 flex gap-2">
            <div class="relative flex-1">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                    </svg>
                </div>

                <input
                    bind:value={ searchQuery }
                    id          = "member-search"
                    type        = "search"
                    placeholder = "Buscar por nombre o apellido..."
                    onkeydown   = { handleKeyDown }
                    class       = "w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                        placeholder:text-gray-400 dark:placeholder:text-gray-500
                        border-2 border-gray-200 dark:border-gray-700
                        focus:border-lds-navy dark:focus:border-lds-gold shadow-sm"
                />
            </div>

            <button
                onclick = { handleSearch }
                class   = "px-6 py-2.5 bg-lds-navy dark:bg-lds-gold text-white dark:text-gray-900 rounded-lg font-bold text-sm shadow-sm hover:opacity-90 transition-all active:scale-95"
            >
                Buscar
            </button>
        </div>
    </div>

    <!-- Info de resultados -->
    {#if membersQuery.data && !membersQuery.isPending}
        <div in:fly={{ y: -4, duration: 200 }} class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 -mt-2">
            {#if activeSearch.trim()}
                <span>
                    <span class="font-semibold text-gray-700 dark:text-gray-200">{ totalMembers }</span>
                    resultado{ totalMembers !== 1 ? 's' : '' } para
                    "<span class="font-semibold text-lds-navy dark:text-lds-gold">{ activeSearch.trim() }</span>"
                </span>
            {:else}
                <span>
                    Mostrando
                    <span class="font-semibold text-gray-700 dark:text-gray-200">
                        { ( currentPage - 1 ) * pageSize + 1 }–{ Math.min( currentPage * pageSize, totalMembers ) }
                    </span>
                    de
                    <span class="font-semibold text-gray-700 dark:text-gray-200">
                        { totalMembers }
                    </span>
                    miembros
                </span>
            {/if}
        </div>
    {/if}

    <!-- Lista de miembros -->
    {#if membersQuery.isPending}
        <div class="text-center py-16 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <div class="w-8 h-8 mx-auto border-4 border-lds-navy border-t-transparent dark:border-lds-gold dark:border-t-transparent rounded-full animate-spin"></div>
            <p class="mt-4 font-medium">Cargando miembros...</p>
        </div>
    {:else if membersQuery.isError}
        <div class="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl">
            Error al cargar los miembros.
        </div>
    {:else}
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {#if items.length === 0}
                <div class="py-16 text-center text-gray-500 dark:text-gray-400">
                    <svg class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p class="font-medium">No se encontraron miembros</p>
                    <p class="text-sm mt-1">Intenta con otro término de búsqueda</p>
                </div>
            {:else}
                <div class="divide-y divide-gray-100 dark:divide-gray-700">
                    {#each items as member ( member._id )}
                        <div
                            in:fly={{ y: 8, duration: 250 }}
                            class="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                        >
                            <!-- Avatar + Info -->
                            <div class="flex items-center gap-4 min-w-0">
                                <!-- Iniciales avatar -->
                                <div class="w-10 h-10 sm:w-14 sm:h-14 md:w-10 md:h-10 lg:w-14 lg:h-14 bg-lds-navy dark:bg-lds-gold rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                    <span class="text-white dark:text-gray-900 font-bold text-sm sm:text-base tracking-wide">
                                        { getInitials( member.name, member.last_name ) }
                                    </span>
                                </div>

                                <div class="min-w-0 space-y-0.5">
                                    <h4 class="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base md:text-sm lg:text-base truncate">
                                        { member.name } { member.last_name }
                                    </h4>

                                    <div class="flex gap-2 items-center">
                                        <div class="px-2.5 py-1 bg-gray-200/80 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-lg text-xs sm:text-sm md:text-xs lg:text-sm">
                                            { getClassName( member.classes[0] )}
                                        </div>

                                        {#if getClassName( member.classes[1] )}
                                            <div class="px-2.5 py-1 bg-gray-200/80 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-lg text-xs sm:text-sm md:text-xs lg:text-sm">
                                                { getClassName( member.classes[1] )}
                                            </div>
                                        {/if}
                                    </div>

                                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                        Actualizado { formatShortDate( member.updated_at ) }
                                    </p>
                                </div>
                            </div>

                            <!-- Badge + Acciones -->
                            <div class="flex items-center gap-1 sm:gap-3 md:gap-1 lg:gap-3 shrink-0 ">
                                {#if member.saveFinger}
                                    <span class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs px-2.5 py-1.5 rounded-full font-semibold">
                                        <FingerprintPattern class="w-3 h-3" />

                                        <span class="hidden sm:flex md:hidden lg:flex">
                                            Huella
                                        </span>
                                    </span>
                                {/if}

                                <!-- Acciones -->
                                <ActionButtons
                                    onRegister  = { ( ) => openRegister( member.ulid_token ) }
                                    onEdit      = { ( ) => openEdit( member ) }
                                    onDelete    = { ( ) => openDelete( member ) }
                                    editTitle   = "Actualizar miembro"
                                    deleteTitle = "Eliminar miembro"
                                />
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- ─── Paginador ──────────────────────────────────────────────────── -->
        <Paginator
            currentPage      = { currentPage }
            totalPages       = { totalPages }
            pageSize         = { pageSize }
            onPageChange     = { handlePageChange }
            onPageSizeChange = { handlePageSizeChange }
        />
    {/if}
</main>


<ConfirmDelete
    open        = { isDeleteDialogOpen }
    title       = "Eliminar miembro"
    description = "Esta acción no se puede deshacer."
    itemName    = { memberToDelete ? `${ memberToDelete.name } ${ memberToDelete.last_name }` : '' }
    itemExtra   = "¿Estás seguro que deseas eliminar este miembro?"
    isPending   = { deleteMutation.isPending }
    onClose     = { () => isDeleteDialogOpen = false }
    onConfirm   = { () => memberToDelete && handleDeleteConfirm( memberToDelete ) }
/>


<EditMember
    open    = { isEditDialogOpen }
    member  = { memberToEdit }
    onClose = { ( ) => isEditDialogOpen = false }
/>


<Dialog
    open        = { isRegisterDialogOpen }
    title       = "Registro Manual de Asistencia"
    description = "Registra la asistencia para este miembro seleccionando una sesión QR."
    onClose     = { ( ) => isRegisterDialogOpen = false }
>
    <AssistanceForm 
        initialMemberId   = { selectedMemberId }
        onCancel          = { ( ) => isRegisterDialogOpen = false }
        onSuccess         = { ( ) => isRegisterDialogOpen = false }
    />
</Dialog>
