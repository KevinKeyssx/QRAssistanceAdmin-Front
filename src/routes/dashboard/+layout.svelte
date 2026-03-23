<script lang="ts">
	import Sidebar from '$lib/components/dashboard/Sidebar.svelte';
	import Topbar  from '$lib/components/dashboard/Topbar.svelte';

	let { children } = $props();
</script>

<div class="w-full flex justify-center items-start flex-1 px-4 py-8 md:px-8 md:py-12">
	<div class="flex flex-col md:flex-row w-full max-w-[1600px] gap-6 md:gap-10 relative shrink-0 mt-20">
		<!-- Navegación móvil -->
		<div class="md:hidden w-full">
			<Topbar />
		</div>

		<!-- Navegación escritorio -->
		<div class="hidden md:block shrink-0 sticky top-32 z-10 w-64">
			<Sidebar />
		</div>

		<!-- Área principal de contenido -->
		<div class="flex-1 w-full relative">
			<main class="w-full print:p-0">
				{@render children()}
			</main>
		</div>
	</div>
</div>
