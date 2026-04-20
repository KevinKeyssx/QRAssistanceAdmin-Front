<script lang="ts">
	import { 
		createQuery, 
		createMutation, 
		useQueryClient 
	}					from '@tanstack/svelte-query';
	import { 
		LoaderCircle, 
		User, 
		QrCode 
	}					from 'lucide-svelte';
	import { toast }    from 'svelte-sonner';


	import connectRequest, { 
		isApiError 
	}								from '$lib/services/fetch.service';
	import { METHOD }				from '$lib/services/http-codes';
	import type { MemberResponse }	from '$lib/models/member/member.model';
	import type { 
		QRHistoryResponse 
	}								from '$lib/models/qr/qr.model';
    import Combobox                 from '../../../components/shared/Combobox.svelte';
    import { getClassName }         from '$lib/utils/classes';


	interface Props {
		initialMemberId?   : string;
		initialQrId?       : string;
		onSuccess?         : ( ) => void;
		onCancel?          : ( ) => void;
	}


	let { 
		initialMemberId, 
		initialQrId, 
		onSuccess, 
		onCancel 
	}: Props = $props();

	// ─── Estado ───────────────────────────────────────────────────────────────
	// svelte-ignore state_referenced_locally
	let selectedMemberId = $state( initialMemberId ?? '' );
	// svelte-ignore state_referenced_locally
	let selectedQrId     = $state( initialQrId ?? '' );

	const queryClient = useQueryClient();

	// ─── Errores ──────────────────────────────────────────────────────────────
	const ERROR_MESSAGES: Record<string, string> = {
		'ERR_201' : 'El miembro no puede asistir a esta clase.',
		'ERR_301' : 'Debes completar la encuesta del tercer domingo.',
		'ERR_202' : 'Este QR ya expiró.',
		'ERR_203' : 'Este QR es para otra fecha, no para hoy.',
		'ERR_204' : 'Fuera de horario.',
		'ERR_205' : 'Formato de hora en QR inválido.'
	};

	// Carga inicial de miembros (Top 100). No depende de la búsqueda para evitar re-fetches.
	const membersQuery = createQuery( ( ) => ( {
		queryKey : [ 'members-all-preload' ],
		queryFn  : async ( ) => {
			const result = await connectRequest<MemberResponse>( {
				endpoint   : `members/get-all?page=1&size=100`, // Cargamos 100 para filtro local
				method     : METHOD.GET,
				isInternal : true
			} );
			if ( isApiError( result ) ) throw result;
			return result.items.map( m => ( {
				value : m.ulid_token,
				label : `${ m.name } ${ m.last_name }`
			} ) );
		},
		staleTime : 1000 * 60 * 10 // 10 minutos
	} ) );

	// Carga inicial de QRs (Últimos 100)
	const qrsQuery = createQuery(() => ({
		queryKey : [ 'qrs-all-preload' ],
		queryFn  : async () => {
			const result = await connectRequest<QRHistoryResponse>({
				endpoint   : `qr/get-history?year=${ new Date().getFullYear() }&page=1&size=100`,
				method     : METHOD.GET,
				isInternal : true
			});

            if ( isApiError( result )) throw result;

            return result.items.map( q => ({
				value : q.session_id,
				label : `${ getClassName( q.type ) } — ${ new Date( q.date ).toLocaleDateString( 'es-ES', { weekday: 'long', day: 'numeric' } ) } (${ q.start_hour })`
			}));
		},
		staleTime : 1000 * 60 * 10
	}));

	// ─── Mutación ─────────────────────────────────────────────────────────────
	const registerMutation = createMutation( ( ) => ( {
		mutationFn : async ( ) => {
			return await connectRequest<{ data: any, status: number }>( {
				endpoint   : 'assistances/register',
				method     : METHOD.POST,
				isInternal : true,
				body       : {
					member_ulid   : selectedMemberId,
					qr_session_id : selectedQrId
				}
			} );
		},
		onSuccess : ( res ) => {
			if ( res.status === 201 ) {
				toast.success( 'Asistencia registrada correctamente.' );
			} else if ( res.status === 200 ) {
				toast.info( 'Asistencia ya registrada.' );
			}

            queryClient.invalidateQueries( { queryKey: [ 'assistances' ] } );
			onSuccess?.( );
		},
		onError : ( err: any ) => {
			const errorData = err.data?.data.detail;
			const message   = ERROR_MESSAGES[ errorData?.code ] ?? 'Ocurrió un error al registrar la asistencia';
			toast.error( message );
		}
	}));


	const isSubmitDisabled = $derived( !selectedMemberId || !selectedQrId || registerMutation.isPending );


	function handleSubmit( e: Event ) {
		e.preventDefault();

        if ( isSubmitDisabled ) return;

        registerMutation.mutate();
	}


	// Sincronizar props iniciales al abrir
	$effect( ( ) => {
		selectedMemberId = initialMemberId  ?? '';
		selectedQrId     = initialQrId      ?? '';
	});
</script>


<form 
	onsubmit	= { handleSubmit }
	class		= "flex flex-col gap-6"
>
	<!-- Selección de Miembro -->
	<div class="flex flex-col gap-2">
		<label 
			for		= "member-combobox" 
			class	= "text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1"
		>
			Miembro
		</label>

		<Combobox
			items		= { membersQuery.data ?? [ ] }
			bind:value	= { selectedMemberId }
			placeholder	= "Buscar por nombre..."
			icon		= { User }
			loading		= { membersQuery.isPending }
		/>
	</div>

	<!-- Selección de Clase/QR -->
	<div class="flex flex-col gap-2">
		<label 
			for		= "qr-combobox" 
			class	= "text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1"
		>
			Clase / Sesión QR
		</label>

		<Combobox
			items		= { qrsQuery.data ?? [ ] }
			bind:value	= { selectedQrId }
			placeholder	= "Buscar por tipo o fecha..."
			icon		= { QrCode }
			loading		= { qrsQuery.isPending }
		/>
	</div>

	<!-- Acciones -->
	<div class="flex items-center justify-end gap-3 mt-4">
		<button
			type	= "button"
			onclick	= { onCancel }
			class	= "px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50 transition-all"
		>
			Cancelar
		</button>

		<button
			type	= "submit"
			disabled= { isSubmitDisabled }
			class	= "flex items-center gap-2 px-8 py-2.5 bg-lds-navy dark:bg-lds-gold text-white dark:text-gray-900 rounded-xl font-bold text-sm shadow-lg shadow-lds-navy/10 dark:shadow-lds-gold/10 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed"
		>
			{#if registerMutation.isPending}
				<LoaderCircle class="w-4 h-4 animate-spin" />
				Registrando...
			{:else}
				Registrar Asistencia
			{/if}
		</button>
	</div>
</form>
