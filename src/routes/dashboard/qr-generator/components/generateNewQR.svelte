<script lang="ts">
	import { getLocalTimeZone, today, CalendarDate, Time } from "@internationalized/date";

    import Calendar         from "$lib/components/shared/Calendar.svelte";
	import TimeRangePicker  from "$lib/components/shared/TimeRangePicker.svelte";
	import ToggleGroup      from "$lib/components/shared/ToggleGroup.svelte";


	interface Props {
		onCancel	: () => void;
		onGenerate	: ( data: any ) => void;
	}


	let {
		onCancel,
		onGenerate
	}: Props = $props();


	const EVENT_TYPES = [ 'Evento', 'Show', 'Noche de hogar', 'Reunión', 'Servicio', 'Otro' ];


    let selectedType	= $state( EVENT_TYPES[0] );
	let selectedDate	= $state<CalendarDate | any>( today( getLocalTimeZone() ) );
	let timeRange       = $state({
		start: new Time(9, 0),
		end: new Time(11, 0)
	});


	function setToday() {
		selectedDate = today( getLocalTimeZone() );
	}


	function handleSubmit( e: Event ) {
		e.preventDefault();

		onGenerate({
			type	: selectedType,
			date	: selectedDate ? selectedDate.toString() : '',
			start	: timeRange.start ? timeRange.start.toString() : '',
			end		: timeRange.end ? timeRange.end.toString() : ''
		});
	}
</script>


<form class="flex flex-col gap-6" onsubmit={ handleSubmit }>
	<!-- Tipo de Evento (Pills) -->
	<div class="flex flex-col gap-3">
		<span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
			Tipo de Actividad
		</span>

		<ToggleGroup bind:value={selectedType} options={EVENT_TYPES} class="w-full" />
	</div>

	<!-- Fecha y Botón de Hoy -->
	<div class="flex flex-col gap-3">
		<!-- <div class="flex items-center justify-between"> -->
			<span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
				Fecha de Creación
			</span>
		<!-- </div> -->

		<div class="flex justify-between gap-3">
			<Calendar bind:value={ selectedDate } class="w-full" />

            <button
				type	= "button"
				onclick	= { setToday }
				class	= "flex px-3 w-28 items-center justify-center gap-1 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-[13px] font-semibold transition-colors shadow-sm"
				title	= "Seleccionar el día de hoy"
			>
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
				Ir a Hoy
			</button>
		</div>
	</div>

	<!-- Horas (Rango Pickers) -->
	<div class="flex flex-col gap-3">
		<span class="text-sm font-semibold text-gray-700 dark:text-gray-300">
			Horario de Actividad
		</span>

        <TimeRangePicker bind:value={ timeRange } class="w-full" />
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
