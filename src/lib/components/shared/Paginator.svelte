<script lang="ts">
    interface Props {
        currentPage     : number;
        totalPages      : number;
        pageSize        : number;
        pageSizeOptions?: number[];
        onPageChange    : ( page: number ) => void;
        onPageSizeChange: ( size: number ) => void;
    }

    let {
        currentPage,
        totalPages,
        pageSize,
        pageSizeOptions = [ 10, 20, 50, 100 ],
        onPageChange,
        onPageSizeChange
    }: Props = $props();


    const visiblePages = $derived.by( () => {
        return Array.from( { length: totalPages }, ( _, i ) => i + 1 ).filter( p => {
            if ( totalPages <= 5 ) return true;
            if ( p === 1 || p === totalPages ) return true;
            return Math.abs( p - currentPage ) <= 1;
        });
    });
</script>


{#if totalPages > 1 || true}
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pb-8 mt-2">
        <!-- Info de página -->
        <span class="text-sm text-gray-500 dark:text-gray-400 order-2 sm:order-1">
            Página <span class="font-semibold text-gray-700 dark:text-gray-200">{ currentPage }</span> de
            <span class="font-semibold text-gray-700 dark:text-gray-200">{ totalPages }</span>
        </span>

        <!-- Botones de página (solo si hay más de 1 página) -->
        {#if totalPages > 1}
            <div class="flex items-center gap-1.5 order-1 sm:order-2">
                <!-- Anterior -->
                <button
                    id       = "pagination-prev"
                    onclick  = { () => onPageChange( Math.max( 1, currentPage - 1 ) ) }
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

                <!-- Números de página -->
                {#each visiblePages as page, idx}
                    {#if idx > 0 && visiblePages[idx - 1] !== page - 1}
                        <span class="px-1 text-gray-400 dark:text-gray-600 select-none">…</span>
                    {/if}
                    <button
                        id      = "pagination-page-{ page }"
                        onclick = { () => onPageChange( page ) }
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
                    onclick  = { () => onPageChange( Math.min( totalPages, currentPage + 1 ) ) }
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
        {:else}
            <div class="order-1 sm:order-2"></div>
        {/if}

        <!-- Selector de tamaño por página -->
        <div class="relative shrink-0 order-3">
            <select
                id          = "page-size-select"
                value       = { pageSize }
                onchange    = { ( e ) => onPageSizeChange( Number( ( e.target as HTMLSelectElement ).value ) ) }
                class       = "appearance-none h-full pl-4 pr-9 py-2 rounded-lg text-sm font-semibold outline-none transition-all duration-200
                               bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300
                               border border-gray-200 dark:border-gray-700
                               focus:border-lds-navy dark:focus:border-lds-gold shadow-sm cursor-pointer"
            >
                {#each pageSizeOptions as size}
                    <option value={ size }>{ size } por página</option>
                {/each}
            </select>

            <div class="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                <svg class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </div>
        </div>
    </div>
{/if}
