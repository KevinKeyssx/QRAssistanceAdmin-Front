<script lang="ts">
    import { getLocalTimeZone, today } from "@internationalized/date";

    import Calendar from "$lib/components/shared/Calendar.svelte";

    let dateValue = $state( today( getLocalTimeZone() ) );
</script>


<svelte:head>
    <title>Asistencias | Dashboard | QR Assistance</title>
</svelte:head>

<main class="flex flex-col gap-6 w-full max-w-6xl mx-auto align-top">
    <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Asistencias</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
            Gestiona y visualiza la asistencia seleccionando una fecha en el calendario.
        </p>
    </div>

    <div class="flex flex-col md:flex-row gap-8 items-start">
        <!-- Contenedor del Calendario -->
        <div class="shrink-0 flex flex-col gap-3">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Fecha de registro
            </h2>
            <Calendar bind:value={ dateValue } />

            {#if dateValue}
                <div class="text-sm font-medium text-lds-navy dark:text-lds-gold px-1 mt-2">
                    Seleccionado: { dateValue.toString() }
                </div>
            {/if}
        </div>

        <!-- Espacio para la tabla o lista de asistencias -->
        <div class="flex-1 w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px] flex items-center justify-center">
            <div class="text-center text-gray-500 dark:text-gray-400">
                <p>Selecciona una fecha para ver las asistencias de ese día.</p>
                <p class="text-xs mt-1">(La tabla o lista se renderizará aquí)</p>
            </div>
        </div>
    </div>
</main>