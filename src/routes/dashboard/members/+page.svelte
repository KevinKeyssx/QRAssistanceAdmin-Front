<script lang="ts">
    import { fly }          from 'svelte/transition';
    import { createQuery }  from '@tanstack/svelte-query';
    import { toast }        from 'svelte-sonner';

    // import ItemList         from '$lib/components/shared/ItemList.svelte';
    import Dialog from '$lib/components/shared/Dialog.svelte';

    // ─── Tipos ────────────────────────────────────────────────────────────────
    interface Member {
        id          : number;
        name        : string;
        lastName    : string;
        createdAt   : Date;
        updatedAt   : Date;
        classes     : string[];
        saveFinger  : boolean;
    }

    // ─── Estado ───────────────────────────────────────────────────────────────
    let searchQuery         = $state( '' );
    let pageSize            = $state<20 | 50 | 100>( 20 );
    let currentPage         = $state( 1 );
    let memberToDelete      = $state<Member | null>( null );
    let memberToEdit        = $state<Member | null>( null );
    let isDeleteDialogOpen  = $state( false );
    let isEditDialogOpen    = $state( false );

    // ─── Mock Data ────────────────────────────────────────────────────────────
    const fetchMembers = async (): Promise<Member[]> => {
        await new Promise( res => setTimeout( res, 700 ) );

        const classesList = [
            'Primaria',
            'JAS',
            'Sociedad de Socorro',
            'Quórum de Élderes',
            'Hombres Jóvenes',
            'Mujeres Jóvenes'
        ];

        return Array.from({ length: 84 }, ( _, i ) => ({
            id          : i + 1,
            name        : [ 'Kevin', 'María', 'José', 'Ana', 'Carlos', 'Luisa', 'Pedro', 'Elena' ][ i % 8 ],
            lastName    : [ 'García', 'Martínez', 'López', 'Rodríguez', 'Hernández', 'Pérez', 'Soto', 'Vega' ][ i % 8 ],
            createdAt   : new Date( 2025, i % 12, ( i % 28 ) + 1 ),
            updatedAt   : new Date( 2026, ( i + 2 ) % 12, ( i % 28 ) + 1 ),
            classes     : [ classesList[ i % classesList.length ] ],
            saveFinger  : i % 3 !== 0
        }));
    };


    const membersQuery = createQuery( () => ({
        queryKey    : [ 'members' ],
        queryFn     : fetchMembers
    }));

    // ─── Lógica de filtrado y paginación ──────────────────────────────────────
    const filteredMembers = $derived.by( () => {
        if ( !membersQuery.data ) return [];

        const q = searchQuery.trim().toLowerCase();

        if ( !q ) return membersQuery.data;

        return membersQuery.data.filter( m =>
            m.name.toLowerCase().includes( q ) ||
            m.lastName.toLowerCase().includes( q ) ||
            `${ m.name } ${ m.lastName }`.toLowerCase().includes( q )
        );
    });

    const totalPages = $derived( Math.max( 1, Math.ceil( filteredMembers.length / pageSize ) ) );

    const paginatedMembers = $derived.by( () => {
        const start = ( currentPage - 1 ) * pageSize;
        return filteredMembers.slice( start, start + pageSize );
    });

    const paginationPages = $derived.by( () => {
        return Array.from( { length: totalPages }, ( _, i ) => i + 1 ).filter( p => {
            if ( totalPages <= 5 ) return true;
            if ( p === 1 || p === totalPages ) return true;
            return Math.abs( p - currentPage ) <= 1;
        });
    });

    // Reinicia la página al buscar o cambiar tamaño
    $effect( () => {
        searchQuery;
        pageSize;
        currentPage = 1;
    });


    // ─── Helpers de formato ───────────────────────────────────────────────────
    function formatShortDate( date: Date ) {
        return date.toLocaleDateString( 'es-ES', { day: '2-digit', month: 'short', year: 'numeric' } );
    }

    function getInitials( name: string, lastName: string ) {
        return `${ name.charAt( 0 ) }${ lastName.charAt( 0 ) }`.toUpperCase();
    }


    // ─── Acciones ─────────────────────────────────────────────────────────────
    function openEdit( member: Member ) {
        memberToEdit        = { ...member };
        isEditDialogOpen    = true;
    }

    function openDelete( member: Member ) {
        memberToDelete      = member;
        isDeleteDialogOpen  = true;
    }

    function confirmDelete() {
        if ( !memberToDelete ) return;
        toast.success( `Miembro "${ memberToDelete.name } ${ memberToDelete.lastName }" eliminado.` );
        isDeleteDialogOpen  = false;
        memberToDelete      = null;
    }

    function confirmEdit() {
        if ( !memberToEdit ) return;
        toast.success( `Miembro "${ memberToEdit.name } ${ memberToEdit.lastName }" actualizado.` );
        isEditDialogOpen    = false;
        memberToEdit        = null;
    }


    // ─── Items para ItemList ───────────────────────────────────────────────────
    // const listItems = $derived( paginatedMembers.map( member => ({
    //     id       : member.id,
    //     title    : `${ member.name } ${ member.lastName }`,
    //     subtitle : `${ member.classes.join( ', ' ) } · Registrado ${ formatShortDate( member.createdAt ) }`,
    //     badge    : member.saveFinger ? 'Huella' : undefined,
    //     _member  : member
    // })));
</script>


<svelte:head>
    <title>Miembros | Dashboard</title>
</svelte:head>


<main class="flex flex-col gap-6 w-full max-w-6xl mx-auto align-top">

    <!-- Encabezado -->
    <div class="flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Miembros</h1>

        {#if membersQuery.data}
            <span class="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm font-semibold px-3 py-1.5 rounded-full">
                { membersQuery.data.length } miembros en total
            </span>
        {/if}
    </div>

    <!-- Barra de controles: buscador + select -->
    <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">

        <!-- Buscador -->
        <div class="relative flex-1">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
            </div>
            <input
                id          = "member-search"
                type        = "search"
                placeholder = "Buscar por nombre o apellido..."
                bind:value={ searchQuery }
                class       = "w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                               placeholder:text-gray-400 dark:placeholder:text-gray-500
                               border-2 border-gray-200 dark:border-gray-700
                               focus:border-lds-navy dark:focus:border-lds-gold shadow-sm"
            />
        </div>

        <!-- Select de cantidad -->
        <div class="relative shrink-0">
            <select
                id          = "member-page-size"
                bind:value={ pageSize }
                class       = "appearance-none h-full pl-4 pr-10 py-3 rounded-xl text-sm font-semibold outline-none transition-all duration-200
                               bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                               border-2 border-gray-200 dark:border-gray-700
                               focus:border-lds-navy dark:focus:border-lds-gold shadow-sm cursor-pointer"
            >
                <option value={ 20 }>20 por página</option>
                <option value={ 50 }>50 por página</option>
                <option value={ 100 }>100 por página</option>
            </select>
            <div class="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    </div>

    <!-- Info de resultados -->
    {#if membersQuery.data && !membersQuery.isPending}
        <div in:fly={{ y: -4, duration: 200 }} class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 -mt-2">
            {#if searchQuery.trim()}
                <span>
                    <span class="font-semibold text-gray-700 dark:text-gray-200">{ filteredMembers.length }</span>
                    resultado{ filteredMembers.length !== 1 ? 's' : '' } para
                    "<span class="font-semibold text-lds-navy dark:text-lds-gold">{ searchQuery.trim() }</span>"
                </span>
            {:else}
                <span>
                    Mostrando
                    <span class="font-semibold text-gray-700 dark:text-gray-200">
                        { ( currentPage - 1 ) * pageSize + 1 }–{ Math.min( currentPage * pageSize, filteredMembers.length ) }
                    </span>
                    de
                    <span class="font-semibold text-gray-700 dark:text-gray-200">{ filteredMembers.length }</span>
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
            {#if paginatedMembers.length === 0}
                <div class="py-16 text-center text-gray-500 dark:text-gray-400">
                    <svg class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p class="font-medium">No se encontraron miembros</p>
                    <p class="text-sm mt-1">Intenta con otro término de búsqueda</p>
                </div>
            {:else}
                <div class="divide-y divide-gray-100 dark:divide-gray-700">
                    {#each paginatedMembers as member ( member.id )}
                        <div
                            in:fly={{ y: 8, duration: 250 }}
                            class="flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                        >
                            <!-- Avatar + Info -->
                            <div class="flex items-center gap-4 min-w-0">
                                <!-- Iniciales avatar -->
                                <div class="w-12 h-12 sm:w-14 sm:h-14 bg-lds-navy dark:bg-lds-gold rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                                    <span class="text-white dark:text-gray-900 font-bold text-sm sm:text-base tracking-wide">
                                        { getInitials( member.name, member.lastName ) }
                                    </span>
                                </div>

                                <div class="min-w-0">
                                    <h4 class="font-bold text-gray-900 dark:text-gray-100 text-base truncate">
                                        { member.name } { member.lastName }
                                    </h4>
                                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                        { member.classes.join( ', ' ) }
                                    </p>
                                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                        Actualizado { formatShortDate( member.updatedAt ) }
                                    </p>
                                </div>
                            </div>

                            <!-- Badge + Acciones -->
                            <div class="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
                                {#if member.saveFinger}
                                    <span class="hidden sm:inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs px-2.5 py-1.5 rounded-full font-semibold">
                                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.27.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.99-1.4 2.25-2.5 3.75-3.27C9.98 4.04 14 4.03 17.15 6.07c1.5.9 2.75 2.1 3.76 3.59.16.23.1.54-.13.7-.23.16-.54.1-.7-.13-.92-1.37-2.07-2.47-3.45-3.3-2.9-1.82-6.64-1.81-9.52.04-1.38.83-2.54 1.93-3.4 3.21-.09.14-.25.21-.41.21zm6.25 12.07c-.08 0-.16-.02-.24-.06l-2.01-1.21c-1.58-.87-2.5-2.51-2.5-4.41V9.85c0-.28.22-.5.5-.5s.5.22.5.5v6.26c0 1.52.71 2.81 1.95 3.51l2 1.2c.24.14.32.46.18.7-.1.16-.26.27-.38.17zM14 22.25h-.01c-1.24 0-2.24-1-2.24-2.24v-6.01c0-.28.22-.5.5-.5s.5.22.5.5v6.01c0 .68.55 1.23 1.23 1.24.68 0 1.24-.55 1.24-1.23v-.51c0-.28.22-.5.5-.5s.5.22.5.5v.51c.01 1.25-.99 2.23-2.22 2.23zm4.09-2.6c-.17 0-.34-.09-.43-.25-.14-.24-.06-.54.17-.68.99-.59 1.58-1.63 1.58-2.78v-3.07c0-.28.22-.5.5-.5s.5.22.5.5v3.07c0 1.5-.81 2.89-2.1 3.65-.08.04-.15.06-.22.06zM9 15.5c-.28 0-.5-.22-.5-.5v-5c0-.28.22-.5.5-.5s.5.22.5.5v5c0 .28-.22.5-.5.5zm3.5 3c-.28 0-.5-.22-.5-.5v-8c0-.28.22-.5.5-.5s.5.22.5.5v8c0 .28-.22.5-.5.5z"/>
                                        </svg>
                                        Huella
                                    </span>
                                {/if}

                                <!-- Botón Editar -->
                                <button
                                    id      = "edit-member-{ member.id }"
                                    onclick = { () => openEdit( member ) }
                                    title   = "Actualizar miembro"
                                    class   = "p-2 rounded-lg text-gray-400 hover:text-lds-navy dark:hover:text-lds-gold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95"
                                >
                                    <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>

                                <!-- Botón Eliminar -->
                                <button
                                    id      = "delete-member-{ member.id }"
                                    onclick = { () => openDelete( member ) }
                                    title   = "Eliminar miembro"
                                    class   = "p-2 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95"
                                >
                                    <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- ─── Paginador ──────────────────────────────────────────────────── -->
        {#if totalPages > 1}
            <div class="flex items-center justify-between gap-4 pb-8 mt-2">
                <!-- Info de página -->
                <span class="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                    Página <span class="font-semibold text-gray-700 dark:text-gray-200">{ currentPage }</span> de
                    <span class="font-semibold text-gray-700 dark:text-gray-200">{ totalPages }</span>
                </span>

                <!-- Botones de página -->
                <div class="flex items-center gap-1.5 mx-auto sm:mx-0">
                    <!-- Anterior -->
                    <button
                        id       = "pagination-prev"
                        onclick  = { () => currentPage = Math.max( 1, currentPage - 1 ) }
                        disabled = { currentPage === 1 }
                        class    = "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                                   text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                                   hover:border-lds-navy dark:hover:border-lds-gold hover:text-lds-navy dark:hover:text-lds-gold
                                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600
                                   shadow-sm active:scale-95"
                    >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Anterior
                    </button>

                    <!-- Números de página (máximo 5 visibles) -->
                    {#each paginationPages as page, idx}
                        {#if idx > 0 && paginationPages[idx - 1] !== page - 1}
                            <span class="px-1 text-gray-400 dark:text-gray-600 select-none">…</span>
                        {/if}
                        <button
                            id      = "pagination-page-{ page }"
                            onclick = { () => currentPage = page }
                            class   = "w-9 h-9 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-95
                                       { currentPage === page
                                           ? 'bg-lds-navy dark:bg-lds-gold text-white dark:text-gray-900 border border-lds-navy dark:border-lds-gold'
                                           : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-lds-navy dark:hover:border-lds-gold hover:text-lds-navy dark:hover:text-lds-gold'
                                       }"
                        >
                            { page }
                        </button>
                    {/each}

                    <!-- Siguiente -->
                    <button
                        id       = "pagination-next"
                        onclick  = { () => currentPage = Math.min( totalPages, currentPage + 1 ) }
                        disabled = { currentPage === totalPages }
                        class    = "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all
                                   text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                                   hover:border-lds-navy dark:hover:border-lds-gold hover:text-lds-navy dark:hover:text-lds-gold
                                   disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600
                                   shadow-sm active:scale-95"
                    >
                        Siguiente
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        {/if}
    {/if}
</main>


<!-- ─── Dialog: Confirmar Eliminación ─────────────────────────────────────── -->
<Dialog
    open        = { isDeleteDialogOpen }
    title       = "Eliminar miembro"
    description = "Esta acción no se puede deshacer."
    onClose     = { () => isDeleteDialogOpen = false }
>
    {#if memberToDelete}
        <div class="flex flex-col gap-5">
            <div class="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">
                <div class="w-12 h-12 bg-red-100 dark:bg-red-800/50 rounded-xl flex items-center justify-center shrink-0">
                    <svg class="w-6 h-6 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <div>
                    <p class="font-bold text-gray-900 dark:text-white">
                        { memberToDelete.name } { memberToDelete.lastName }
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        ¿Estás seguro que deseas eliminar este miembro?
                    </p>
                </div>
            </div>

            <div class="flex gap-3 justify-end">
                <button
                    onclick = { () => isDeleteDialogOpen = false }
                    class   = "px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300
                               bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                               transition-all active:scale-95"
                >
                    Cancelar
                </button>
                <button
                    id      = "confirm-delete-member"
                    onclick = { confirmDelete }
                    class   = "px-4 py-2 rounded-xl text-sm font-semibold text-white
                               bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700
                               transition-all active:scale-95 shadow-sm"
                >
                    Eliminar miembro
                </button>
            </div>
        </div>
    {/if}
</Dialog>


<!-- ─── Dialog: Editar Miembro ────────────────────────────────────────────── -->
<Dialog
    open        = { isEditDialogOpen }
    title       = "Actualizar miembro"
    description = "Modifica los datos del miembro y guarda los cambios."
    onClose     = { () => isEditDialogOpen = false }
>
    {#if memberToEdit}
        <div class="flex flex-col gap-5">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label for="edit-name" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                        Nombre
                    </label>
                    <input
                        id          = "edit-name"
                        type        = "text"
                        bind:value={ memberToEdit.name }
                        class       = "w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all
                                       bg-gray-50 dark:bg-gray-700/60 text-gray-900 dark:text-white
                                       border-2 border-gray-200 dark:border-gray-600
                                       focus:border-lds-navy dark:focus:border-lds-gold"
                    />
                </div>
                <div>
                    <label for="edit-lastname" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                        Apellido
                    </label>
                    <input
                        id          = "edit-lastname"
                        type        = "text"
                        bind:value={ memberToEdit.lastName }
                        class       = "w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all
                                       bg-gray-50 dark:bg-gray-700/60 text-gray-900 dark:text-white
                                       border-2 border-gray-200 dark:border-gray-600
                                       focus:border-lds-navy dark:focus:border-lds-gold"
                    />
                </div>
            </div>

            <div class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600">
                <input
                    id              = "edit-savefinger"
                    type            = "checkbox"
                    bind:checked={ memberToEdit.saveFinger }
                    class           = "w-4 h-4 accent-lds-navy dark:accent-lds-gold cursor-pointer"
                />
                <label for="edit-savefinger" class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                    Huella registrada
                </label>
            </div>

            <div class="flex gap-3 justify-end">
                <button
                    onclick = { () => isEditDialogOpen = false }
                    class   = "px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300
                               bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                               transition-all active:scale-95"
                >
                    Cancelar
                </button>
                <button
                    id      = "confirm-edit-member"
                    onclick = { confirmEdit }
                    class   = "px-4 py-2 rounded-xl text-sm font-semibold
                               bg-lds-navy dark:bg-lds-gold text-white dark:text-gray-900
                               hover:opacity-90 transition-all active:scale-95 shadow-sm"
                >
                    Guardar cambios
                </button>
            </div>
        </div>
    {/if}
</Dialog>
