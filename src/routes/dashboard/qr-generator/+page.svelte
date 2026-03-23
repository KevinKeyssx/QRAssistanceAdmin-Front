<script lang="ts">
	import { onMount }             from 'svelte';
	import ClassQRCard             from '$lib/components/dashboard/ClassQRCard.svelte';
	import { LDS_CLASSES }         from '$lib/utils/classes';
	import { PUBLIC_QR_BASE_URL }  from '$env/static/public';

    const history = [
        {
            classSlug : 'primaria',
            appClass  : LDS_CLASSES.find( ( c ) => c.slug === 'primaria' ),
            url       : 'https://qr.lds.org/1234567890',
            date      : new Date(),
            isNew     : false
        }
    ]

	// Estado mockeado
	let historiQR = $state<any[]>( [] );

	// let isSunday = $derived( new Date().getDay() === 0 );
    let isSunday = $state( true );

	onMount( () => {
		// Validar si es domingo y está vacío
		if ( isSunday && historiQR.length === 0 ) {
			const sessionId = crypto.randomUUID();
			const today = new Date();

			const newHistory = LDS_CLASSES.map( ( c ) => {
				const url = `${PUBLIC_QR_BASE_URL}?sessionId=${sessionId}&class=${c.slug}`;
				return {
					classSlug : c.slug,
					appClass  : c,
					url,
					date      : today,
					isNew     : true
				};
			});

			historiQR = [ ...newHistory ];
		}
	});
</script>

<svelte:head>
	<title>Generador QR | Dashboard</title>
</svelte:head>

<div class="flex flex-col gap-6 w-full max-w-6xl mx-auto align-top">
	<div class="flex justify-between items-center print:hidden">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Generar Asistencias QR</h1>
		{#if isSunday}
			<span class="bg-lds-navy text-white dark:bg-lds-gold px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
				Domingo de Asistencia
			</span>
		{/if}
	</div>

	{#if !isSunday}
		<div class="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded-r-md print:hidden">
			<div class="flex">
				<div class="shrink-0">
					<svg class="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
					</svg>
				</div>
				<div class="ml-3">
					<p class="text-sm text-yellow-700 dark:text-yellow-200">
						Los códigos QR solo se pueden generar y utilizar los días domingo. El sistema está inhabilitado por el momento.
					</p>
				</div>
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative mt-4">
		{#each historiQR as item ( item.classSlug )}
			<ClassQRCard 
				appClass = { item.appClass }
				url      = { item.url }
				date     = { item.date }
				disabled = { !isSunday }
				isNew    = { item.isNew }
			/>
		{/each}

		{#if historiQR.length === 0}
			<div class="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
				No hay códigos QR generados aún para hoy.
			</div>
		{/if}
	</div>
</div>
