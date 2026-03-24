<script lang="ts">
	interface Props {
		onCancel	: () => void;
		onGenerate	: ( data: any ) => void;
	}


	let {
		onCancel,
		onGenerate
	}: Props = $props();


	const EVENT_TYPES = [ 'Evento', 'Show', 'Noche de hogar' ];

	let selectedType	= $state( EVENT_TYPES[0] );
	let selectedDate	= $state( '' );
	let startTime		= $state( '' );
	let endTime			= $state( '' );


	function setToday() {
		const today     = new Date();
		const yyyy	    = today.getFullYear();
		const mm	    = String( today.getMonth() + 1 ).padStart( 2, '0' );
		const dd	    = String( today.getDate() ).padStart( 2, '0' );

		selectedDate = `${ yyyy }-${ mm }-${ dd }`;
	}


	function handleSubmit( e: Event ) {
		e.preventDefault();

		onGenerate({
			type	: selectedType,
			date	: selectedDate,
			start	: startTime,
			end		: endTime
		});
	}
</script>


<form class="flex flex-col gap-6" onsubmit={ handleSubmit }>
	<!-- Tipo de Evento (Pills) -->
	<div class="flex flex-col gap-3">
		<span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
			Tipo de Actividad
		</span>

		<div class="flex flex-wrap gap-3">
			{#each EVENT_TYPES as type}
				<button
					type	= "button"
					onclick	= { () => selectedType = type }
					class	= "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border { selectedType === type ? 'bg-lds-navy text-white border-lds-navy shadow-md dark:bg-lds-gold dark:text-gray-900 dark:border-lds-gold scale-105' : 'bg-transparent text-gray-600 border-gray-300 hover:border-gray-400 dark:text-gray-400 dark:border-gray-600 dark:hover:border-gray-400' }"
				>
					{ type }
				</button>
			{/each}
		</div>
	</div>

	<!-- Fecha y Botón de Hoy -->
	<div class="flex flex-col gap-3">
		<label for="creation-date" class="text-sm font-semibold text-gray-700 dark:text-gray-300">
			Fecha de Creación
		</label>
		
		<div class="flex gap-3 items-center">
			<input 
				id          = "creation-date"
				type		= "date"
				required
				bind:value={ selectedDate }
				class		= "flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-lds-navy dark:focus:ring-lds-gold focus:border-lds-navy dark:focus:border-lds-gold outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-transparent"
			/>
			
			<button
				type	= "button"
				onclick	= { setToday }
				class	= "px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-semibold transition-colors shadow-sm"
				title	= "Seleccionar el día de hoy"
			>
				Hoy
			</button>
		</div>
	</div>

	<!-- Horas (Grid de 2 columnas) -->
	<div class="grid grid-cols-2 gap-4">
		<div class="flex flex-col gap-3">
			<label for="start-time" class="text-sm font-semibold text-gray-700 dark:text-gray-300">
				Hora de Inicio
			</label>
			<input 
				id          = "start-time"
				type		= "time"
				required
				bind:value={ startTime }
				class		= "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-lds-navy dark:focus:ring-lds-gold focus:border-lds-navy dark:focus:border-lds-gold outline-none transition-colors text-gray-900 dark:text-gray-100"
			/>
		</div>

		<div class="flex flex-col gap-3">
			<label for="end-time" class="text-sm font-semibold text-gray-700 dark:text-gray-300">
				Hora de Fin
			</label>
			<input 
				id          = "end-time"
				type		= "time"
				required
				bind:value={ endTime }
				class		= "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-lds-navy dark:focus:ring-lds-gold focus:border-lds-navy dark:focus:border-lds-gold outline-none transition-colors text-gray-900 dark:text-gray-100"
			/>
		</div>
	</div>

	<!-- Custom Spacing para el footer del Modal -->
	<div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
		<button
			type	= "button"
			onclick	= { onCancel }
			class	= "px-5 py-2.5 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
		>
			Cancelar
		</button>

		<button
			type	= "submit"
			class	= "px-6 py-2.5 rounded-lg font-bold text-white bg-lds-navy hover:bg-lds-navy/90 dark:bg-lds-gold dark:text-gray-900 dark:hover:bg-lds-gold/90 transition-all shadow-md active:scale-95 flex gap-2 items-center"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
			Generar Código
		</button>
	</div>
</form>
