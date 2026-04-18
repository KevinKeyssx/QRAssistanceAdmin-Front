<script lang="ts">
	import { Toaster, toast } from 'svelte-sonner';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import { page } from '$app/state';

	import './layout.css';

	import {
		isDark,
		toggleDarkMode
	}               from '$lib/stores/themeStore';
	import Header   from '$lib/components/page/Header.svelte';
	import Footer   from '$lib/components/page/Footer.svelte';


	let { children } = $props();

	const queryClient = new QueryClient();

	$effect( () => {
		if ( page.url.searchParams.get( 'error' ) === 'unauthorized' ) {
			toast.error( 'Este miembro no está autorizado.', {
				description : 'Tu correo no se encuentra en la lista de permitidos.',
				id          : 'unauthorized-error',
			});
		}
	});
</script>


<svelte:head>
	<link rel="icon" href="/favicon.png" type="image/png" />
</svelte:head>


<QueryClientProvider client={ queryClient }>
	<div class="relative min-h-dvh flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300" class:dark={ $isDark }>
		<img
			src="/fullLightRays.png"
			alt="background"
			class="fixed top-0 left-0 w-full h-full object-cover object-center pointer-events-none opacity-40 dark:opacity-10 select-none z-0"
		/>

		<div class="relative z-10 flex flex-col min-h-dvh">
			<Header darkMode={ $isDark } onToggle={ toggleDarkMode } />

			<main class="flex-1 flex flex-col items-center justify-center">
				{@render children()}
			</main>

			<Footer />
		</div>
	</div>

	<Toaster 
		position    = "bottom-right" 
		richColors 
		theme       = { $isDark ? 'dark' : 'light' } 
	/>
</QueryClientProvider>
