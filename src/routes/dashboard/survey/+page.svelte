<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Bar } from 'svelte-chartjs';
	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		BarElement,
		CategoryScale,
		LinearScale
	} from 'chart.js';
	import connectRequest, { isApiError } from '$lib/services/fetch.service';
	import { METHOD } from '$lib/services/http-codes';

	import { LDS_CLASSES } from '$lib/utils/classes';


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

	const months = [
		{ val: '',   label: 'Todos los meses' },
		{ val: '1',  label: 'Enero' }, { val: '2',  label: 'Febrero' }, { val: '3',  label: 'Marzo' },
		{ val: '4',  label: 'Abril' }, { val: '5',  label: 'Mayo' }, { val: '6',  label: 'Junio' },
		{ val: '7',  label: 'Julio' }, { val: '8',  label: 'Agosto' }, { val: '9',  label: 'Septiembre' },
		{ val: '10', label: 'Octubre' }, { val: '11', label: 'Noviembre' }, { val: '12', label: 'Diciembre' }
	];

	const statsQuery = createQuery( () => {
		const params = new URLSearchParams({ year });
		if ( month )     params.append( 'month',      month );
		if ( classType ) params.append( 'class_type', classType );

		return {
			queryKey : [ 'survey-stats', year, month, classType ],
			queryFn	 : async () => {
				const result = await connectRequest<Record<string, { yes: number, no: number }>>({
					endpoint	: `survey?${ params.toString() }`,
					method		: METHOD.GET,
					isInternal	: true
				});

				if ( isApiError( result ) ) throw result;

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
					backgroundColor	: '#22c55e'
				},
				{
					label			: 'NO',
					data			: noData,
					backgroundColor	: '#ef4444'
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
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Encuestas</h1>
			<p class="text-sm text-gray-500 mt-1">Métricas de respuestas obtenidas.</p>
		</div>

		<div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
			<div class="flex flex-col gap-1 w-full sm:w-auto">
				<label for="yearSelect" class="text-xs font-semibold text-gray-600 dark:text-gray-400">Año *</label>
				<select 
					id = "yearSelect"
					class = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-lds-gold outline-none min-w-[100px]"
					bind:value={ year }
				>
					<option value="2026">2026</option>
					<option value="2025">2025</option>
					<option value="2024">2024</option>
				</select>
			</div>

			<div class="flex flex-col gap-1 w-full sm:w-auto">
				<label for="monthSelect" class="text-xs font-semibold text-gray-600 dark:text-gray-400">Mes (Drill-down)</label>
				<select 
					id = "monthSelect"
					class = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-lds-gold outline-none min-w-[140px]"
					bind:value={ month }
				>
					{#each months as m}
						<option value={ m.val }>{ m.label }</option>
					{/each}
				</select>
			</div>

			<div class="flex flex-col gap-1 w-full sm:w-auto">
				<label for="typeSelect" class="text-xs font-semibold text-gray-600 dark:text-gray-400">Organización</label>
				<select 
					id = "typeSelect"
					class = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-lds-gold outline-none min-w-[160px]"
					bind:value={ classType }
				>
					<option value="">Todas las clases</option>
					{#each LDS_CLASSES as cls}
						<option value={ cls.slug }>{ cls.label }</option>
					{/each}
				</select>
			</div>
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
