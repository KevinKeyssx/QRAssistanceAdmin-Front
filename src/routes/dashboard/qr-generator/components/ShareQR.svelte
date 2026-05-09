<script lang="ts">
	import { 
		Share2, 
		Copy, 
		MessageCircle, 
		Check 
	}						from 'lucide-svelte';
	import { toast }		from 'svelte-sonner';
	import Dialog			from '$lib/components/shared/Dialog.svelte';


	interface Props {
		url          : string;
		label?       : string;
		buttonClass? : string;
		showLabel?   : boolean;
		isOpen?      : boolean;
		onClose?     : () => void;
		hideButton?  : boolean;
	}


	let {
		url,
		label       = 'Enlace',
		buttonClass = 'p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-md text-gray-500 hover:text-lds-navy dark:hover:text-lds-gold border border-gray-100 dark:border-gray-700 shadow-sm transition-all active:scale-90',
		showLabel   = false,
		isOpen      = $bindable( false ),
		onClose,
		hideButton  = false
	}: Props = $props();


	let isCopied = $state( false );


	function handleCopy() {
		navigator.clipboard.writeText( url );
		isCopied = true;
		toast.success( 'Enlace copiado al portapapeles' );
		setTimeout(() => isCopied = false, 2000 );
	}


	function handleWhatsApp() {
		const text         = encodeURIComponent( `Les comparto el enlace para registrar su asistencia en ${ label }: ${ url }` );
		const whatsappUrl  = `https://wa.me/?text=${ text }`;
		window.open( whatsappUrl, '_blank' );
	}


	function handleClose() {
		isOpen = false;
		if ( onClose ) onClose();
	}
</script>


{#if !hideButton}
	<button
		onclick = { () => isOpen = true }
		class   = { buttonClass }
		title   = "Compartir enlace"
	>
		<Share2 class="w-4 h-4" />

		{#if showLabel}
			<span>Compartir</span>
		{/if}
	</button>
{/if}


<Dialog
	open        = { isOpen }
	title       = "Compartir enlace"
	description = "Copia el enlace o compártelo directamente en WhatsApp."
	onClose     = { handleClose }
>
	<div class="space-y-4">
		<!-- Visualización del Link -->
		<div class="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 break-all text-sm text-gray-600 dark:text-gray-400 font-medium">
			{ url }
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			<!-- Botón Copiar -->
			<button
				onclick = { handleCopy }
				class   = "flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gray-50 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200/50 dark:border-gray-600/50 transition-all font-bold text-sm shadow-sm active:scale-95"
			>
				{#if isCopied}
					<Check class="w-4 h-4 text-green-500" />
				{:else}
					<Copy class="w-4 h-4" />
				{/if}

				{ isCopied ? 'Copiado' : 'Copiar enlace' }
			</button>

			<!-- Botón WhatsApp -->
			<button
				onclick = { handleWhatsApp }
				class   = "flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white transition-all font-bold text-sm shadow-sm shadow-green-500/20 active:scale-95"
			>
				<MessageCircle class="w-4 h-4" />

				WhatsApp
			</button>
		</div>
	</div>
</Dialog>

