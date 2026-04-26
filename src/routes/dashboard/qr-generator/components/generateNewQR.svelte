<script lang="ts">
    import { toast } from "svelte-sonner";

    import {
        getLocalTimeZone,
        today,
        CalendarDate,
        Time
    }                                           from "@internationalized/date";
    import { createMutation, useQueryClient }   from "@tanstack/svelte-query";
    import { CalendarCheck, Plus }              from "lucide-svelte";

    import connectRequest, {
        isApiError
    }                       from "$lib/services/fetch.service";
    import type { QR }      from "$lib/models/qr/qr.model";
    import Calendar         from "$lib/components/shared/Calendar.svelte";
	import TimeRangePicker  from "$lib/components/shared/TimeRangePicker.svelte";
	import ToggleGroup      from "$lib/components/shared/ToggleGroup.svelte";
    import Select           from "$lib/components/shared/Select.svelte";
    import { METHOD }       from "$lib/services/http-codes";
    import AuraLoader       from "$lib/components/loaders/AuraLoader.svelte";


	interface Props {
        qr?         : QR | null;
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
        { label: 'Noche de hogar',  slug: 'family-home' },
        { label: 'Once',            slug: 'teatime' },
        { label: 'Reunión',         slug: 'meeting' },
        { label: 'Servicio',        slug: 'service' },
        { label: 'Otro',            slug: 'other' }
    ];


    const labels        = TYPE_OPTIONS.map( opt => opt.label );
    const comboboxItems = TYPE_OPTIONS.map( opt => ({ value: opt.label, label: opt.label }) );

    // ─── Estado del Formulario ───────────────────────────────────────────────
    // svelte-ignore state_referenced_locally
    let selectedLabel	= $state( qr ? ( TYPE_OPTIONS.find( o => o.slug === qr.type )?.label ?? 'Otro' ) : labels[0] );
	// svelte-ignore state_referenced_locally
	let selectedDate	= $state<CalendarDate>( qr ? parseDate( qr.date ) : today( getLocalTimeZone() ) );
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
        mutationFn: async ( payload: { type: string, date: string, start_hour: string, end_hour: string } ) => {
            const isEdit    = !!qr?._id;
            const endpoint  = 'qr/generate-qr';
            
            const result = await connectRequest({
                endpoint    : endpoint,
                method      : isEdit ? METHOD.PUT : METHOD.POST,
                isInternal  : true,
                body        : isEdit ? { id: qr!._id, ...payload } : payload
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
        onError: ( err: Error | { message?: string } ) => {
            const message = 'message' in err ? err.message : 'Error al procesar la solicitud';
            toast.error( message || 'Error al procesar la solicitud' );
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
        errors.time = false;

        if ( !timeRange.start || !timeRange.end ) {
            errors.time = true;
        } else {
            const startMin  = timeRange.start.hour * 60 + timeRange.start.minute;
            const endMin    = timeRange.end.hour   * 60 + timeRange.end.minute;

            if ( endMin <= startMin ) {
                errors.time = true;
            }
        }

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
			start_hour  : timeRange.start?.toString().slice( 0, 5 ),
			end_hour    : timeRange.end?.toString().slice( 0, 5 )
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
            class      = "hidden sm:flex w-full { errors.type ? 'ring-2 ring-red-500 rounded-xl' : '' }" 
        />

        <div class="sm:hidden w-full { errors.type ? 'ring-2 ring-red-500 rounded-xl' : '' }">
            <Select 
                bind:value  = { selectedLabel }
                items       = { comboboxItems }
                placeholder = "Selecciona un tipo..."
                class       = "w-full"
            />
        </div>

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
                minValue    = { today( getLocalTimeZone() )}
            />

            <button
				type	= "button"
				onclick	= { setToday }
				class	= "flex px-3 w-16 sm:w-28 items-center justify-center gap-1 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg text-[13px] font-semibold transition-colors shadow-sm"
				title	= "Seleccionar el día de hoy"
			>
                <CalendarCheck class="w-4 h-4" />

                <span class="hidden sm:block">
                    Ir a Hoy
                </span>
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
            <span class="text-xs text-red-500 font-medium ml-1">
                {( !timeRange.start || !timeRange.end ) ? 'El horario es requerido' : 'La hora final debe ser posterior a la de inicio' }
            </span>
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
			type        = "submit"
            disabled    = { qrMutation.isPending }
			class       = "px-6 py-2.5 rounded-lg font-bold text-white bg-lds-navy hover:bg-lds-navy/90 dark:bg-lds-gold dark:text-gray-900 dark:hover:bg-lds-gold/90 transition-all shadow-md active:scale-95 flex gap-2 items-center disabled:opacity-50 disabled:cursor-not-allowed"
		>
            {#if qrMutation.isPending}
                <AuraLoader />
            {:else}
                <Plus class="w-4 h-4 text-white" />
            {/if}

            <span class="text-sm sm:text-base text-white">
                { qr ? 'Guardar Cambios' : 'Generar QR' }
            </span>
		</button>
	</div>
</form>
