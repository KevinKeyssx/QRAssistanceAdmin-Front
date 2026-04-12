<script lang="ts">
    import { toast } from "svelte-sonner";

    import {
        getLocalTimeZone,
        today,
        CalendarDate,
        Time
    }                                           from "@internationalized/date";
    import { createMutation, useQueryClient }   from "@tanstack/svelte-query";

    import connectRequest, {
        isApiError
    }                       from "$lib/services/fetch.service";
    import Calendar         from "$lib/components/shared/Calendar.svelte";
	import TimeRangePicker  from "$lib/components/shared/TimeRangePicker.svelte";
	import ToggleGroup      from "$lib/components/shared/ToggleGroup.svelte";
    import { METHOD }       from "$lib/services/http-codes";


	interface Props {
        qr?         : any;
		onCancel	: () => void;
		onSuccess	: () => void;
	}


	let {
        qr = null,
		onCancel,
		onSuccess
	}: Props = $props();


    const queryClient = useQueryClient();


    const TYPE_OPTIONS = [
        { label: 'Evento',          slug: 'event' },
        { label: 'Show',            slug: 'show' },
        { label: 'Noche de hogar',  slug: 'family-home' },
        { label: 'Reunión',         slug: 'meeting' },
        { label: 'Servicio',        slug: 'service' },
        { label: 'Otro',            slug: 'other' }
    ];


    const labels = TYPE_OPTIONS.map( opt => opt.label );

    // ─── Estado del Formulario ───────────────────────────────────────────────
    // svelte-ignore state_referenced_locally
    let selectedLabel	= $state( qr ? ( TYPE_OPTIONS.find( o => o.slug === qr.type )?.label ?? 'Otro' ) : labels[0] );
	// svelte-ignore state_referenced_locally
	let selectedDate	= $state<CalendarDate | any>( qr ? parseDate( qr.date ) : today( getLocalTimeZone() ) );
	// svelte-ignore state_referenced_locally
	let timeRange       = $state({
		start : qr ? parseTime( qr.start_hour ) : new Time( 9, 0 ),
		end   : qr ? parseTime( qr.end_hour ) : new Time( 11, 0 )
	});

    let errors = $state({
        type : false,
        date : false,
        time : false
    });

    // ─── Mutación ────────────────────────────────────────────────────────────
    const qrMutation = createMutation( () => ({
        mutationFn: async ( payload: any ) => {
            const isEdit    = !!qr?._id;
            const endpoint  = 'qr/generate-qr';
            
            const result = await connectRequest({
                endpoint    : endpoint,
                method      : isEdit ? METHOD.PUT : METHOD.POST,
                isInternal  : true,
                body        : isEdit ? { id: qr._id, ...payload } : payload
            });

            if ( isApiError( result ) ) throw result;
            return result;
        },
        onSuccess: () => {
            toast.success( qr ? 'QR actualizado con éxito' : 'QR programado con éxito' );
            queryClient.invalidateQueries({ queryKey: [ 'qrs-today' ] });
            queryClient.invalidateQueries({ queryKey: [ 'qr-history' ] });
            onSuccess();
        },
        onError: ( err: any ) => {
            toast.error( err.message || 'Error al procesar la solicitud' );
        }
    }));

    // ─── Helpers ─────────────────────────────────────────────────────────────
    function parseDate( dateStr: string ) {
        try {
            const d = new Date( dateStr );
            return new CalendarDate( d.getFullYear(), d.getMonth() + 1, d.getDate() );
        } catch {
            return today( getLocalTimeZone() );
        }
    }


    function parseTime( timeStr: string ) {
        try {
            const [ h, m ] = timeStr.split( ':' ).map( Number );
            return new Time( h, m );
        } catch {
            return new Time( 9, 0 );
        }
    }


    function setToday() {
		selectedDate = today( getLocalTimeZone() );
	}


    function validate() {
        errors.type = !selectedLabel;
        errors.date = !selectedDate;
        errors.time = !timeRange.start || !timeRange.end;

        return !errors.type && !errors.date && !errors.time;
    }


	function handleSubmit( e: Event ) {
		e.preventDefault();

        if ( !validate() ) {
            toast.error( 'Por favor completa todos los campos requeridos' );
            return;
        }

        const selectedSlug = TYPE_OPTIONS.find( o => o.label === selectedLabel )?.slug || 'other';

        // Preparar fecha en formato ISO para el backend
        // El backend espera una fecha con hora para "date" (datetime)
        const dateObj = new Date( selectedDate.year, selectedDate.month - 1, selectedDate.day, 12, 0, 0 );

		qrMutation.mutate({
			type        : selectedSlug,
			date        : dateObj.toISOString(),
			start_hour  : timeRange.start?.toString().slice( 0, 5 ) || '09:00',
			end_hour    : timeRange.end?.toString().slice( 0, 5 ) || '10:30'
		});
	}
</script>


<form class="flex flex-col gap-6" onsubmit={ handleSubmit }>
	<!-- Tipo de Evento (Pills) -->
	<div class="flex flex-col gap-3">
		<span class="text-sm font-semibold { errors.type ? 'text-red-500' : 'text-gray-700 dark:text-gray-300' }">
			Tipo de Actividad
		</span>

		<ToggleGroup 
            bind:value = { selectedLabel } 
            options    = { labels } 
            class      = "w-full { errors.type ? 'ring-2 ring-red-500 rounded-xl' : '' }" 
        />
        {#if errors.type}
            <span class="text-xs text-red-500 font-medium ml-1">Selecciona un tipo de actividad</span>
        {/if}
	</div>

	<!-- Fecha y Botón de Hoy -->
	<div class="flex flex-col gap-3">
        <span class="text-sm font-semibold { errors.date ? 'text-red-500' : 'text-gray-700 dark:text-gray-300' }">
            Fecha de Actividad
        </span>

		<div class="flex justify-between gap-3">
			<Calendar 
                bind:value  = { selectedDate } 
                class       = "w-full { errors.date ? 'border-red-500' : '' }" 
            />

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

        {#if errors.date}
            <span class="text-xs text-red-500 font-medium ml-1">La fecha es requerida</span>
        {/if}
	</div>

	<!-- Horas (Rango Pickers) -->
	<div class="flex flex-col gap-3">
		<span class="text-sm font-semibold { errors.time ? 'text-red-500' : 'text-gray-700 dark:text-gray-300' }">
			Horario de Actividad
		</span>

        <TimeRangePicker 
            bind:value = { timeRange } 
            class      = "w-full { errors.time ? 'border-red-500' : '' }" 
        />
        {#if errors.time}
            <span class="text-xs text-red-500 font-medium ml-1">El horario es requerido</span>
        {/if}
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
            disabled = { qrMutation.isPending }
			class	= "px-6 py-2.5 rounded-lg font-bold text-white bg-lds-navy hover:bg-lds-navy/90 dark:bg-lds-gold dark:text-gray-900 dark:hover:bg-lds-gold/90 transition-all shadow-md active:scale-95 flex gap-2 items-center disabled:opacity-50 disabled:cursor-not-allowed"
		>
            {#if qrMutation.isPending}
                <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            {:else}
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
            {/if}
			{ qr ? 'Guardar Cambios' : 'Generar Código' }
		</button>
	</div>
</form>
