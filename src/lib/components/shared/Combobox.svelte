<script lang="ts">
	import { Combobox }	from 'bits-ui';

    import { 
		Check, 
		ChevronsUpDown, 
		Search,
		ChevronUp,
		ChevronDown
	} from 'lucide-svelte';

	// ─── Props ───────────────────────────────────────────────────────────────
	interface Props {
		items	        : { value: string; label: string }[ ];
		value           : string;
		placeholder?    : string;
		icon?	        : any;
		loading?	    : boolean;
		onSelect?       : ( value: string ) => void;
	}

	let { 
		items = [ ], 
		value = $bindable( '' ), 
		placeholder = 'Seleccionar...', 
		icon : Icon = Search,
		loading = false,
		onSelect
	}: Props = $props();


	// ─── Estado Local ────────────────────────────────────────────────────────
	let searchValue = $state( '' );
	let open        = $state( false );

	// Sincronizar searchValue con el label del valor seleccionado UNICAMENTE al cargar
	// o cuando el valor cambia externamente (pero no mientras el usuario escribe)
	$effect( ( ) => {
		if ( value && !open ) {
			const found = items.find( ( i ) => i.value === value );
			if ( found ) searchValue = found.label;
		}
	} );


	// Filtrado Local (Evita peticiones HTTP al escribir)
	const filteredItems = $derived(
		searchValue === ''
			? items
			: items.filter( ( item ) =>
				item.label.toLowerCase().includes( searchValue.toLowerCase() )
			)
	);


	function handleSelect( v: string | undefined ) {
		if ( !v ) return;
		value = v;
		const found = items.find( ( i ) => i.value === v );
		if ( found ) searchValue = found.label;
		onSelect?.( v );
		open = false;
	}
</script>


<Combobox.Root
	type			= "single"
	bind:value		= { value }
	bind:open		= { open }
	onValueChange	= { handleSelect }
>
	<div class="relative w-full">
		<!-- Icono izquierdo -->
		<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
			{#if Icon}
				<Icon class="w-4 h-4" />
			{/if}
		</div>

		<!-- Input Controlado via Snippet -->
		<Combobox.Input>
			{#snippet child( { props } )}
				<input
					{ ...props }
					value		= { searchValue }
					oninput		= { ( e ) => { 
						( props as any ).oninput?.( e );
						searchValue = ( e.target as HTMLInputElement ).value; 
					} }
					class = "w-full pl-10 pr-10 py-3 rounded-xl text-sm font-medium outline-none transition-all duration-200
						bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white
						border border-gray-200 dark:border-gray-700
						focus:border-lds-navy dark:focus:border-lds-gold shadow-sm"
					placeholder	= { placeholder }
				/>
			{/snippet}
		</Combobox.Input>

		<!-- Botón disparador (Trigger) -->
		<Combobox.Trigger class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
			{#if loading}
				<div class="w-4 h-4 border-2 border-lds-navy dark:border-lds-gold border-t-transparent animate-spin rounded-full"></div>
			{:else}
				<ChevronsUpDown class="w-4 h-4" />
			{/if}
		</Combobox.Trigger>
	</div>

	<Combobox.Portal>
		<Combobox.Content
			sideOffset	= { 8 }
			class		= "z-110 w-(--bits-combobox-anchor-width) p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl mt-2 outline-none
				data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
				data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
		>
			<Combobox.ScrollUpButton class="flex items-center justify-center py-1 text-gray-400 cursor-default">
				<ChevronUp class="w-3 h-3" />
			</Combobox.ScrollUpButton>

			<Combobox.Viewport class="max-h-64 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
				{#each filteredItems as item ( item.value )}
					<Combobox.Item
						value	= { item.value }
						label	= { item.label }
						class	= "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors outline-none
                            text-gray-700 dark:text-gray-300
                            hover:bg-gray-100 dark:hover:bg-gray-700
                            data-highlighted:bg-gray-100 dark:data-highlighted:bg-gray-700
                            data-selected:bg-lds-navy/10 dark:data-selected:bg-lds-gold/10 data-selected:text-lds-navy dark:data-selected:text-lds-gold"
					>
						<span class="truncate">{ item.label }</span>

                        {#if value === item.value}
							<Check class="w-4 h-4 shrink-0" />
						{/if}
					</Combobox.Item>
				{:else}
					<div class="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
						{ searchValue ? 'No se encontraron resultados' : 'Comienza a escribir...' }
					</div>
				{/each}
			</Combobox.Viewport>

			<Combobox.ScrollDownButton class="flex items-center justify-center py-1 text-gray-400 cursor-default">
				<ChevronDown class="w-3 h-3" />
			</Combobox.ScrollDownButton>
		</Combobox.Content>
	</Combobox.Portal>
</Combobox.Root>
