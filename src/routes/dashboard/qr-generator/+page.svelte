<script lang="ts">
	import { onMount }      from 'svelte';
    import { fade, fly }    from 'svelte/transition';

    import { createQuery }  from '@tanstack/svelte-query';
    import { toast }        from 'svelte-sonner';

	import { PUBLIC_QR_BASE_URL }   from '$env/static/public';
    import ClassQRCard              from './components/ClassQRCard.svelte';
    import { formatDate }           from '$lib/utils/tempo';
	import { LDS_CLASSES }          from '$lib/utils/classes';
    import QRIcon                   from '$lib/icons/QRIcon.svelte';
    import Dialog                   from '$lib/components/shared/Dialog.svelte';

    import GenerateNewQR from './components/generateNewQR.svelte';


    let activeTab       = $state<'today' | 'history'>( 'today' );
    let isDialogOpen    = $state( false );
	let historiQR       = $state<any[]>( [] );
    let isSunday        = $state( true );


    onMount( () => {
		// Validar si es domingo y está vacío
		if ( isSunday && historiQR.length === 0 ) {
			const sessionId = crypto.randomUUID();
			const today     = new Date();

			const newHistory = LDS_CLASSES.map( ( c ) => {
				const url = `${ PUBLIC_QR_BASE_URL }?sessionId=${ sessionId }&class=${ c.slug }`;

				return {
					classSlug	: c.slug,
					appClass	: c,
					url			: url,
					date		: today,
					isNew		: true
				};
			});

			historiQR = [ ...newHistory ];
		}
	});


    function handleGenerateNewQR( formData: any ) {
        console.log( "Configuración recibida:", formData );

        toast.success( `QR para ${ formData.type } configurado con éxito.` );
        isDialogOpen = false;
    }

    // Mock Database Fetcher for TanStack Query
	const fetchHistoricalQRs = async () => {
		await new Promise( res => setTimeout( res, 800 ) ); 

		return [
			{
				id			: 1,
				classSlug	: 'primaria',
				appClass	: LDS_CLASSES.find( c => c.slug === 'primaria' )!,
				date		: new Date( 2026, 2, 22 )
			},
			{
				id			: 2,
				classSlug	: 'sociedad-socorro',
				appClass	: LDS_CLASSES.find( c => c.slug === 'sociedad-socorro' )!,
				date		: new Date( 2026, 2, 15 )
			},
			{
				id			: 3,
				classSlug	: 'quorom-elderes',
				appClass	: LDS_CLASSES.find( c => c.slug === 'quorom-elderes' )!,
				date		: new Date( 2026, 1, 22 )
			},
			{
				id			: 4,
				classSlug	: 'jas',
				appClass	: LDS_CLASSES.find( c => c.slug === 'jas' )!,
				date		: new Date( 2026, 1, 15 )
			},
			{
				id			: 5,
				classSlug	: 'hombres-jovenes',
				appClass	: LDS_CLASSES.find( c => c.slug === 'hombres-jovenes' )!,
				date		: new Date( 2026, 0, 25 )
			}
		];
	};


	const historyQuery = createQuery( () => ({
		queryKey	: [ 'qr-history' ],
		queryFn		: fetchHistoricalQRs
	}));


    let groupedHistory = $derived.by( () => {
        if ( !historyQuery.data ) return {};
        
        const grouped : Record<string, any[]> = {};
        
        historyQuery.data.forEach( item => {
            const monthYear = item.date.toLocaleString( 'es-ES', { month: 'long', year: 'numeric' } ).replace( /^\w/, c => c.toUpperCase() );
            
            if ( !grouped[monthYear] ) {
                grouped[monthYear] = [];
            }
            
            const dayString     = item.date.toLocaleString( 'es-ES', { weekday: 'long' } );
            const dayStringCap  = dayString.charAt( 0 ).toUpperCase() + dayString.slice( 1 );
            const formattedDate = `${ dayStringCap } ${ item.date.getDate() }`;

            grouped[monthYear].push({ ...item, formattedDate });
        });
        
        return grouped;
    });
</script>


<svelte:head>
	<title>Generador QR | Dashboard</title>
</svelte:head>

<main class="flex flex-col gap-6 w-full max-w-6xl mx-auto align-top">
	<div class="flex justify-between items-center print:hidden">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Generar Asistencias QR</h1>

        <!-- {#if isSunday}
			<span class="bg-lds-navy text-white dark:bg-lds-gold px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
				Domingo de Asistencia
			</span>
		{/if} -->

        <button 
            onclick = { () => isDialogOpen = true }
            class   = "bg-lds-navy text-white dark:bg-lds-gold dark:text-gray-900 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm flex gap-1.5 items-center hover:opacity-90 transition-all active:scale-95"
        >
            <QRIcon />

            Programar nuevo QR
        </button>
	</div>

    <!-- TABS COMPONENT -->
    <div class="flex bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-xl w-full max-w-sm shadow-sm relative print:hidden self-start">
        <button 
            onclick  = { () => activeTab = 'today' }
            class    = "relative flex-1 py-1.5 text-sm font-semibold transition-colors duration-300 z-10 { activeTab === 'today' ? 'text-gray-900 dark:text-gray-900' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200' }"
        >
            Generados hoy
        </button>

        <button 
            onclick  = { () => activeTab = 'history' }
            class    = "relative flex-1 py-1.5 text-sm font-semibold transition-colors duration-300 z-10 { activeTab === 'history' ? 'text-gray-900 dark:text-gray-900' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200' }"
        >
            Historial
        </button>

        <div 
            class = "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-lds-gold rounded-lg shadow-sm transition-transform duration-300 ease-out"
            style = "transform: translateX({ activeTab === 'today' ? '0' : 'calc(100% + 4px)' });"
        ></div>
    </div>

    {#if activeTab === 'today'}
        <div in:fade={{ duration: 300 }} class="flex flex-col gap-6">
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

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
                {#each historiQR as item ( item.classSlug )}
                    <ClassQRCard 
                        appClass = { item.appClass }
                        url      = { item.url }
                        date     = { formatDate( item.date ) }
                        disabled = { !isSunday }
                    />
                {/each}

                {#if historiQR.length === 0}
                    <div class="col-span-full py-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        No hay códigos QR generados aún para hoy.
                    </div>
                {/if}
            </div>
        </div>
    {/if}


    {#if activeTab === 'history'}
        <div in:fly={{ y: 20, duration: 400 }} class="w-full space-y-8 pb-12">
            {#if historyQuery.isPending}
                <div class="text-center py-16 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div class="w-8 h-8 mx-auto border-4 border-lds-navy border-t-transparent dark:border-lds-gold dark:border-t-transparent rounded-full animate-spin"></div>
                    <p class="mt-4 font-medium">Cargando historial...</p>
                </div>
            {:else if historyQuery.isError}
                <div class="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    Error al cargar el historial.
                </div>
            {:else}
                {#each Object.entries( groupedHistory ) as [ monthYear, items ]}
                    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <div class="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 class="text-lg font-bold text-gray-800 dark:text-white capitalize">{ monthYear }</h3>
                        </div>

                        <div class="divide-y divide-gray-100 dark:divide-gray-700">
                            {#each items as item}
                                <div class="flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div class="flex items-center gap-5">
                                        <!-- Generico QR Icon -->
                                        <div class="w-14 h-14 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center text-lds-navy dark:text-lds-gold shrink-0 border border-gray-200 dark:border-gray-700">
                                            <QRIcon size={32} />
                                        </div>

                                        <div>
                                            <h4 class="font-bold text-gray-900 dark:text-gray-100 text-lg">
                                                { item.appClass?.label || item.className }
                                            </h4>
                                            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                                                { item.formattedDate }
                                            </p>
                                        </div>
                                    </div>

                                    <span class="bg-blue-50 text-blue-700 dark:bg-lds-gold/20 dark:text-lds-gold text-xs px-3 py-1.5 rounded-full font-bold tracking-wide">
                                        Generado
                                    </span>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}

                {#if Object.keys( groupedHistory ).length === 0}
                    <div class="py-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        No hay registros en el historial.
                    </div>
                {/if}
            {/if}
        </div>
    {/if}
</main>


<Dialog 
    open        = { isDialogOpen }
    title       = "Crear QR Personalizado"
    description = "Configura los parámetros detallados para crear un código QR de evento especial o uso extraordinario."
    onClose     = { () => isDialogOpen = false }
>
    <GenerateNewQR 
        onCancel   = { () => isDialogOpen = false }
        onGenerate = { handleGenerateNewQR }
    />
</Dialog>
