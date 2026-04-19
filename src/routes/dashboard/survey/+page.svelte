<script lang="ts">
	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		BarElement,
		CategoryScale,
		LinearScale
	}                       from 'chart.js';
	import { Bar }          from 'svelte-chartjs';
	import { createQuery }  from '@tanstack/svelte-query';
    import { toast }        from 'svelte-sonner';

    import connectRequest, {
        isApiError
    }                           from '$lib/services/fetch.service';
	import { getThemeColor }    from '$lib/utils/theme';
	import { METHOD }           from '$lib/services/http-codes';
	import { isDark }           from '$lib/stores/themeStore';
	import YearSelect           from '$lib/components/shared/filter/YearSelect.svelte';
	import MonthSelect          from '$lib/components/shared/filter/MonthSelect.svelte';
	import ClasesSelect         from '$lib/components/shared/filter/ClasesSelect.svelte';


	ChartJS.register(
		Title,
		Tooltip,
		Legend,
		BarElement,
		CategoryScale,
		LinearScale
	);


	let year      = $state( '2026' );
	let month     = $state( '' );
	let classType = $state( '' );


	const statsQuery = createQuery( () => {
		const params = new URLSearchParams({ year });

        if ( month ) {
			// Ajustamos de 0-indexed a 1-indexed para el API
			const monthApi = ( Number( month ) + 1 ).toString();
			params.append( 'month', monthApi );
		}

        if ( classType ) params.append( 'class_type', classType );

		return {
			queryKey : [ 'survey-stats', year, month, classType ],
			queryFn	 : async () => {
				const result = await connectRequest<Record<string, { yes: number, no: number }>>({
					endpoint	: `survey?${ params.toString() }`,
					method		: METHOD.GET,
					isInternal	: true
				});

				if ( isApiError( result )) {
                    toast.error( 'Error al obtener las métricas de encuestas' );
                };

				return result;
			}
		};
	});

	const chartData = $derived.by( () => {
		const apiResponse = statsQuery.data;

		if ( !apiResponse ) {
			return {
				labels		: [],
				datasets	: []
			};
		}

		const labels  = Object.keys( apiResponse ).map( k => k.toUpperCase().replace( 'Q', 'Pregunta ' ) );
		const yesData = Object.values( apiResponse ).map( ( v: any ) => v.yes );
		const noData  = Object.values( apiResponse ).map( ( v: any ) => v.no );

		return {
			labels,
			datasets : [
				{
					label			: 'SÍ',
					data			: yesData,
					backgroundColor	: getThemeColor( $isDark ),
					borderRadius    : 4
				},
				{
					label			: 'NO',
					data			: noData,
					backgroundColor	: '#64748b', // Slate 500 para el NO (Soberbio)
					borderRadius    : 4
				}
			]
		};
	});

	const chartOptions = {
		responsive			: true,
		maintainAspectRatio	: false,
		scales				: {
			y : {
				beginAtZero	: true,
				ticks		: {
					stepSize	: 1,
					precision	: 0
				}
			}
		},
		plugins				: {
			legend : {
				position : 'top' as const
			},
			title : {
				display	: true,
				text	: 'Resultados de Encuestas'
			}
		}
	};
</script>


<svelte:head>
	<title>Encuestas | Dashboard | QR Assistance</title>
</svelte:head>


<main class="flex flex-col gap-6 w-full max-w-6xl mx-auto align-top">
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
		<div>
			<h1 class="text-3xl font-bold text-lds-navy dark:text-lds-gold">Encuestas</h1>

            <p class="text-sm text-gray-500 mt-1">Métricas de respuestas obtenidas.</p>
		</div>

		<div class="flex flex-wrap items-end gap-3 w-full sm:w-auto">
			<YearSelect bind:value={ year } class="w-28" />

			<MonthSelect 
				bind:value  = { month } 
				class       = "w-44" 
			/>

			<ClasesSelect 
				bind:value  = { classType }
				label       = "Organización"
				class       = "w-48"
			/>
		</div>
	</div>

	<div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 min-h-[400px]">
		{#if statsQuery.isPending}
			<div class="flex justify-center items-center h-full min-h-[300px]">
				<p class="text-gray-500 dark:text-gray-400">Cargando métricas...</p>
			</div>
		{:else if statsQuery.isError}
			<div class="flex justify-center items-center h-full min-h-[300px]">
				<p class="text-red-500">Error al cargar las métricas de encuestas</p>
			</div>
		{:else if statsQuery.isSuccess && statsQuery.data}
			<div class="relative w-full h-[400px]">
				<Bar data={chartData} options={chartOptions} />
			</div>
		{/if}
	</div>
</main>
