<script lang="ts">
	import {
		createQuery,
		useQueryClient
	}						from '@tanstack/svelte-query';
	import {
		Users,
		UserCheck,
		QrCode,
		FileSpreadsheet,
		Plus,
		Calendar as CalendarIcon,
		TrendingUp,
		ArrowRight,
		Quote,
		LoaderCircle,
		MessageSquareText
	}						from 'lucide-svelte';
	import { fly }          from 'svelte/transition';
	import * as XLSX		from 'xlsx';
	import { toast }		from 'svelte-sonner';

	import connectRequest, {
		isApiError
	}								from '$lib/services/fetch.service';
	import { METHOD }				from '$lib/services/http-codes';
	import type { LayoutData }		from './$types';
	import type {
		AssistanceResponse
	}								from '$lib/models/assistance/assistance.model';
	import type { MemberResponse }	from '$lib/models/member/member.model';
	import type {
		QRHistoryResponse
	}								from '$lib/models/qr/qr.model';
	import Dialog					from '$lib/components/shared/Dialog.svelte';
	import AssistanceForm			from '$lib/components/dashboard/assistance/AssistanceForm.svelte';


	let { data }: { data: LayoutData } = $props();


    const today = new Date().toISOString().split( 'T' )[ 0 ];

	// ─── Estado ───────────────────────────────────────────────────────────────
    let isRegisterDialogOpen    = $state( false );
	let isGeneratingExcel       = $state( false );

	const queryClient = useQueryClient();

	// 1. Asistencia de Hoy (para contador y reporte)
	const todayAssistanceQuery = createQuery( ( ) => ( {
		queryKey : [ 'dashboard-today-assistance', today ],
		queryFn  : async ( ) => {
			const result = await connectRequest<AssistanceResponse>( {
				endpoint   : `assistances/get-all?page=1&size=500&date=${ today }`,
				method     : METHOD.GET,
				isInternal : true
			});
	
            if ( isApiError( result )) throw result;
	
            return result;
		}
	}));

	// 2. Miembros Totales y Nuevos del Mes
	const membersStatsQuery = createQuery( ( ) => ( {
		queryKey : [ 'dashboard-members-stats' ],
		queryFn  : async ( ) => {
			const result = await connectRequest<MemberResponse>( {
				endpoint   : `members/get-all?page=1&size=100`,
				method     : METHOD.GET,
				isInternal : true
			});

            if ( isApiError( result )) throw result;

			const currentMonth = new Date().getMonth();
			const currentYear  = new Date().getFullYear();

			const newThisMonth = result.items.filter( ( m ) => {
				const date = new Date( m.created_at );
				return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
			} ).length;

			return {
				total : result.total,
				new   : newThisMonth
			};
		}
	}));

	// 3. Sesiones de Hoy
	const sessionsQuery = createQuery( ( ) => ( {
		queryKey : [ 'dashboard-sessions-today', today ],
		queryFn  : async ( ) => {
			const result = await connectRequest<QRHistoryResponse>( {
				endpoint   : `qr/get-history?year=${ new Date().getFullYear() }&page=1&size=50`,
				method     : METHOD.GET,
				isInternal : true
			} );
			if ( isApiError( result ) ) throw result;

			// Filtrar las creadas hoy
			return result.items.filter( ( s ) => s.date === today );
		}
	}));

	// 4. Snapshot de Encuestas (Mes Actual)
	const surveyQuery = createQuery( ( ) => ( {
		queryKey : [ 'dashboard-survey-snapshot' ],
		queryFn  : async ( ) => {
			const result = await connectRequest<Record<string, { yes: number, no: number }>>( {
				endpoint   : `survey?year=${ new Date().getFullYear() }&month=${ new Date().getMonth() + 1 }`,
				method     : METHOD.GET,
				isInternal : true
			});
	
            if ( isApiError( result ) ) throw result;

			// Calcular balance total
			let yes = 0;
			let no  = 0;
			Object.values( result ).forEach( ( v ) => {
				yes += v.yes;
				no  += v.no;
			} );

			return { yes, no, total: yes + no };
		}
	}));

	// ─── Lógica Excel ────────────────────────────────────────────────────────
	async function exportTodayReport( ) {
		const assistances = todayAssistanceQuery.data?.items;

        if ( !assistances || assistances.length === 0 ) {
			toast.error( 'No hay asistencias registradas hoy para exportar.' );
			return;
		}

		isGeneratingExcel = true;

		try {
			const dataToExport = assistances.map( ( a ) => ( {
				'Fecha'		    : new Date( a.created_at ).toLocaleDateString( 'es-ES' ),
				'Hora'		    : new Date( a.created_at ).toLocaleTimeString( 'es-ES', { hour: '2-digit', minute: '2-digit' } ),
				'Miembro'		: `${a.member.name} ${a.member.last_name}`,
				'Organización'  : a.qr.type.toUpperCase().replace( '-', ' ' ),
				// 'Apellidos'	    : a.member.last_name,
				// 'ID Sesión'	    : a.qr.session_id
			}));

			const worksheet = XLSX.utils.json_to_sheet( dataToExport );
			const workbook  = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet( workbook, worksheet, 'Asistencias' );

			XLSX.writeFile( workbook, `Reporte_Asistencias_${ today }.xlsx` );

            toast.success( 'Reporte generado con éxito' );
		} catch ( error ) {
			toast.error( 'Error al generar el reporte' );
		} finally {
			isGeneratingExcel = false;
		}
	}

	// ─── Citas Inspiradoras ──────────────────────────────────────────────────
	const quotes = [
		{ text: "La asistencia a las reuniones es una expresión de amor a Dios.", author: "Barrio Cisterna" },
		{ text: "Servir es el camino para encontrar la verdadera felicidad.", author: "Comunidad" },
		{ text: "Donde dos o tres están reunidos en mi nombre, allí estoy yo.", author: "Referencia" }
	];
	const randomQuote = quotes[ Math.floor( Math.random() * quotes.length ) ];
</script>


<svelte:head>
	<title>Inicio | Dashboard | QR Assistance</title>
</svelte:head>


<main class="w-full max-w-7xl mx-auto p-4 sm:p-0 flex flex-col gap-8 align-top">
	<!-- ─── HERO: BIENVENIDA ────────────────────────────────────────────── -->
	<section 
		class	= "relative overflow-hidden p-8 lg:p-10 rounded-3xl bg-lds-navy dark:bg-gray-900 border border-white/10 shadow-2xl"
		in:fly	= { { y: 20, duration: 600 } }
	>
		<!-- Efectos de fondo -->
		<div class="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-lds-gold/20 blur-[100px] rounded-full"></div>
		
		<div class="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
			<div class="flex flex-col gap-2">
				<h1 class="text-3xl lg:text-5xl font-black text-white leading-tight">
					¡Hola, { data.user?.name ?? 'Administrador' }!
				</h1>

                <div class="flex items-center gap-2 text-white/70 font-medium">
					<CalendarIcon class="w-4 h-4 text-lds-gold" />

                    <span class="capitalize">
						{ new Date().toLocaleDateString( 'es-ES', { weekday: 'long', day: 'numeric', month: 'long' } ) }
					</span>

                    <span class="opacity-30">|</span>

                    <span>Panel de control</span>
				</div>
			</div>

			<div class="flex flex-wrap gap-3">
				<button 
					onclick	= { exportTodayReport }
					disabled= { ( todayAssistanceQuery.data?.total ?? 0 ) === 0 || isGeneratingExcel }
					class	= "flex items-center gap-2 px-6 py-3 rounded-2xl bg-lds-gold text-gray-900 font-bold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:hover:scale-100 shadow-lg shadow-lds-gold/20"
				>
					{#if isGeneratingExcel}
						<LoaderCircle class="w-4 h-4 animate-spin" />
					{:else}
						<FileSpreadsheet class="w-4 h-4" />
					{/if}
					Reporte de Hoy
				</button>

				<button 
					onclick	= { ( ) => isRegisterDialogOpen = true }
					class	= "flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/20 font-bold text-sm transition-all hover:bg-white/20 active:scale-95"
				>
					<Plus class="w-4 h-4" />
					Registro Manual
				</button>
			</div>
		</div>
	</section>

	<!-- ─── GRID DE OPERACIONES ─────────────────────────────────────────── -->
	<section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		<!-- CARD: PULSO DE HOY -->
		<div 
			class	= "group p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl transition-all"
			in:fly	= { { y: 20, duration: 600, delay: 100 } }
		>
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<div class="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
						<UserCheck class="w-6 h-6" />
					</div>

                    <div class="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">
						<TrendingUp class="w-3 h-3" />
						Hoy
					</div>
				</div>

                <div>
					<h3 class="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Asistencia Hoy</h3>

                    <p class="text-4xl font-black text-gray-900 dark:text-white mt-1">
						{ todayAssistanceQuery.data?.total ?? 0 }
					</p>
				</div>

                <div class="h-1.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
					<div 
						class	= "h-full bg-emerald-500 transition-all duration-1000" 
						style	= "width: { Math.min( ( todayAssistanceQuery.data?.total ?? 0 ) / 50 * 100, 100 ) }%"
					></div>
				</div>
			</div>
		</div>

		<!-- CARD: MIEMBROS -->
		<div 
			class	= "p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl"
			in:fly	= { { y: 20, duration: 600, delay: 200 } }
		>
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<div class="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
						<Users class="w-6 h-6" />
					</div>
				</div>
				<div>
					<h3 class="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Miembros</h3>
					<div class="flex items-baseline gap-2 mt-1">
						<p class="text-4xl font-black text-gray-900 dark:text-white">
							{ membersStatsQuery.data?.total ?? 0 }
						</p>
						<span class="text-xs font-bold text-blue-500">
							+{ membersStatsQuery.data?.new ?? 0 } este mes
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- CARD: SESIONES ACTIVAS -->
		<div 
			class	= "p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl"
			in:fly	= { { y: 20, duration: 600, delay: 300 } }
		>
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<div class="p-3 rounded-2xl bg-lds-gold/10 text-lds-gold">
						<QrCode class="w-6 h-6" />
					</div>
					<div class="flex items-center gap-1.5">
						<span class="flex h-2 w-2 rounded-full bg-lds-gold animate-ping"></span>
						<span class="text-[10px] font-black uppercase text-lds-gold">Live</span>
					</div>
				</div>
				<div>
					<h3 class="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sesiones de Hoy</h3>
					<p class="text-4xl font-black text-gray-900 dark:text-white mt-1">
						{ sessionsQuery.data?.length ?? 0 }
					</p>
				</div>
				<a href="/dashboard/qr-generator" class="text-xs font-bold text-lds-gold flex items-center gap-1 hover:gap-2 transition-all">
					Ir al generador <ArrowRight class="w-3 h-3" />
				</a>
			</div>
		</div>

		<!-- CARD: ENCUESTAS SNAPSHOT -->
		<div 
			class	= "p-6 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl"
			in:fly	= { { y: 20, duration: 600, delay: 400 } }
		>
			<div class="flex flex-col gap-4">
				<div class="flex items-center justify-between">
					<div class="p-3 rounded-2xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
						<MessageSquareText class="w-6 h-6" />
					</div>
				</div>
				<div>
					<h3 class="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Encuestas del Mes</h3>
					<div class="flex items-baseline gap-2 mt-1">
						<p class="text-4xl font-black text-gray-900 dark:text-white">
							{ surveyQuery.data?.total ?? 0 }
						</p>
						<span class="text-xs font-bold text-purple-500">
							Respuestas
						</span>
					</div>
				</div>
				<div class="flex gap-1 h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
					<div class="h-full bg-emerald-500" style="width: { ( ( surveyQuery.data?.yes ?? 0 ) / ( surveyQuery.data?.total ?? 1 ) ) * 100 }%"></div>
					<div class="h-full bg-rose-500" style="width: { ( ( surveyQuery.data?.no ?? 0 ) / ( surveyQuery.data?.total ?? 1 ) ) * 100 }%"></div>
				</div>
			</div>
		</div>
	</section>

	<!-- ─── SECCIÓN INFERIOR: MENSAJE & ACCIÓN ──────────────────────────── -->
	<section class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
		<!-- CITA INSPIRADORA -->
		<div 
			class	= "lg:col-span-2 relative p-10 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl flex flex-col justify-center items-center text-center gap-4 overflow-hidden"
			in:fly	= { { y: 20, duration: 600, delay: 500 } }
		>
			<Quote class="w-12 h-12 text-lds-gold opacity-20 absolute top-6 left-6" />
			<p class="text-xl lg:text-2xl font-medium text-gray-700 dark:text-gray-300 italic max-w-2xl leading-relaxed">
				"{ randomQuote.text }"
			</p>
			<span class="text-sm font-black text-lds-gold uppercase tracking-widest">— { randomQuote.author } —</span>
		</div>

		<!-- ACCESO RÁPIDO A ANALÍTICAS -->
		<div 
			class	= "p-8 rounded-3xl bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-700 flex flex-col justify-between gap-6"
			in:fly	= { { y: 20, duration: 600, delay: 600 } }
		>
			<div>
				<h4 class="text-lg font-bold text-gray-900 dark:text-white">Más Analíticas</h4>
				<p class="text-sm text-gray-500 mt-2">¿Quieres ver la retención o fidelidad del trimestre?</p>
			</div>

            <a 
				href	= "/dashboard/analytics"
				class	= "flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-lds-navy dark:bg-lds-gold text-white dark:text-gray-900 font-bold text-sm transition-all hover:opacity-90 active:scale-95"
			>
				Ver Analíticas Detalladas
			</a>
		</div>
	</section>
</main>


<!-- ─── DIÁLOGOS ─────────────────────────────────────────────────────── -->
<Dialog
	open        = { isRegisterDialogOpen }
	title		= "Registro Manual de Asistencia"
	description	= "Carga una asistencia rápidamente sin necesidad de código QR."
	onClose		= { ( ) => isRegisterDialogOpen = false }
>
	<AssistanceForm 
		onCancel	= { ( ) => isRegisterDialogOpen = false }
		onSuccess	= { ( ) => { 
			isRegisterDialogOpen = false;
			queryClient.invalidateQueries( { queryKey: [ 'dashboard-today-assistance' ] } );
		}}
	/>
</Dialog>


<style>
	/* Animación suave para las barras de progreso */
	div {
		transition: width 1s cubic-bezier(0.165, 0.84, 0.44, 1);
	}
</style>
