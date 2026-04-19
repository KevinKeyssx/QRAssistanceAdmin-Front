<script lang="ts">
    import {
        Check,
        ChevronsUpDown,
        ChevronUp,
        ChevronDown
    }           from 'lucide-svelte';
    import {
        Select,
        type WithoutChildren
    }           from 'bits-ui';


    // ─── Tipos ────────────────────────────────────────────────────────────────────
    export type SelectItem = {
        value    : string;
        label    : string;
        disabled?: boolean;
    };

    // Definición manual de props para evitar problemas con uniones complejas de Bits UI
    interface Props {
        items         : SelectItem[];
        value?        : string | string[];
        type?         : 'single' | 'multiple';
        placeholder?  : string;
        label?        : string;
        disabled?     : boolean;
        required?     : boolean;
        name?         : string;
        open?         : boolean;
        onOpenChange? : ( open: boolean ) => void;
        onValueChange?: ( value: any ) => void;
        contentProps? : WithoutChildren<Select.ContentProps>;
        class?        : string;
    }

    // ─── Props ────────────────────────────────────────────────────────────────────
    let {
        items,
        placeholder  = 'Selecciona una opción',
        label,
        contentProps,
        value        = $bindable(),
        type         = 'single',
        disabled     = false,
        class        : className = '',
        ...restProps
    }: Props = $props();

    // ─── Reactividad ─────────────────────────────────────────────────────────────
    let selectedLabel = $derived.by( () => {
        if ( type === 'multiple' ) {
            const values = ( value as string[] ) || [];

            return items
                .filter( ( item: SelectItem ) => values.includes( item.value ) )
                .map( ( item: SelectItem ) => item.label )
                .join( ', ' );
        }

        return items.find( ( item: SelectItem ) => item.value === value )?.label;
    });
</script>


<div class="inline-block { className }">
    {#if label}
        <!-- svelte-ignore a11y_label_has_associated_control -->
        <label class="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 ml-1">
            { label }
        </label>
    {/if}

    <Select.Root
        bind:value    = { value as any }
        { type }
        { disabled }
        { ...restProps }
        { items }
        onValueChange = { ( v: any ) => restProps.onValueChange?.( v ) }
    >
        <!-- ── Trigger ─────────────────────────────────────────────────────────── -->
        <Select.Trigger
            class = "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-all hover:border-lds-navy dark:hover:border-lds-gold focus:outline-none focus:ring-2 focus:ring-lds-navy/20 dark:focus:ring-lds-gold/20 data-placeholder:text-gray-400 dark:data-placeholder:text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        { disabled }
        >
            <span class="truncate text-left { !selectedLabel ? 'text-gray-400 dark:text-gray-500' : '' }">
                { selectedLabel || placeholder }
            </span>
            <ChevronsUpDown class="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
        </Select.Trigger>

        <!-- ── Portal + Content ─────────────────────────────────────────────────── -->
        <Select.Portal>
            <Select.Content
                sideOffset = { 6 }
                class      = "z-50 min-w-(--bits-select-anchor-width) max-h-72 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
                { ...contentProps }
            >
                <Select.ScrollUpButton class="flex w-full items-center justify-center py-1 text-gray-400 dark:text-gray-500">
                    <ChevronUp class="w-3 h-3" />
                </Select.ScrollUpButton>

                <Select.Viewport class="p-1 max-h-60 overflow-y-auto">
                    {#each items as item ( item.value )}
                        <Select.Item
                            value    = { item.value }
                            label    = { item.label }
                            disabled = { item.disabled }
                            class    = "flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-700 dark:text-gray-300 cursor-pointer outline-none transition-colors data-highlighted:bg-lds-navy/5 dark:data-highlighted:bg-lds-gold/10 data-highlighted:text-lds-navy dark:data-highlighted:text-lds-gold data-disabled:opacity-40 data-disabled:cursor-not-allowed"
                        >
                            {#snippet children( { selected } )}
                                <span class="truncate">{ item.label }</span>

                                {#if selected}
                                    <Check class="w-4 h-4 text-lds-navy dark:text-lds-gold shrink-0" />
                                {/if}
                            {/snippet}
                        </Select.Item>
                    {/each}
                </Select.Viewport>

                <Select.ScrollDownButton class="flex w-full items-center justify-center py-1 text-gray-400 dark:text-gray-500">
                    <ChevronDown class="w-3 h-3" />
                </Select.ScrollDownButton>
            </Select.Content>
        </Select.Portal>
    </Select.Root>
</div>
