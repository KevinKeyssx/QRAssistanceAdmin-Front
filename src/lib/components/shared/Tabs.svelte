<script lang="ts">
    interface TabOption {
        value : string;
        label : string;
    }

    interface Props {
        options   : TabOption[];
        activeTab : string;
    }

    let { 
        options, 
        activeTab = $bindable() 
    }: Props = $props();

    // Calculamos el porcentaje de ancho basado en la cantidad de opciones
    const widthPercent = $derived( 100 / ( options.length || 1 ) );
    
    // Calculamos el índice activo
    const activeIndex  = $derived( options.findIndex( o => o.value === activeTab ) );
</script>

<div class="flex bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-xl w-full max-w-[500px] shadow-sm relative print:hidden self-start">
    {#each options as option}
        <button
            onclick  = { () => activeTab = option.value }
            class    = "relative flex-1 py-1.5 text-sm font-semibold transition-colors duration-300 z-10 { activeTab === option.value ? 'text-gray-900 dark:text-gray-900' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200' }"
        >
            { option.label }
        </button>
    {/each}

    {#if activeIndex !== -1}
        <div
            class = "absolute top-1.5 bottom-1.5 bg-white dark:bg-lds-gold rounded-lg shadow-sm transition-transform duration-300 ease-out"
            style = "width: calc({ widthPercent }% - 6px); transform: translateX(calc({ activeIndex * 100 }% + { activeIndex > 0 ? 3 * activeIndex : 0 }px));"
        ></div>
    {/if}
</div>
