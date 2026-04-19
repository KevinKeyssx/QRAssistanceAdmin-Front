<script lang="ts">
	import { page } from '$app/state';

    import { links } from './links';
</script>


<nav class="flex w-full bg-gray-50/90 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700 p-2 rounded-2xl overflow-x-auto print:hidden shadow-lg transition-all duration-300">
	<ul class="flex items-center gap-4">
		{#each links as link}
			<li>
				<a
					href  = { link.href }
					class = {`flex items-center gap-1.5 whitespace-nowrap px-3 py-1.5 rounded-md text-sm transition-colors duration-200 ${ page.url.pathname === link.href ? 'bg-lds-navy text-white dark:bg-lds-gold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' }`}
				>
                    <svelte:component this={ link.icon } class="w-4 h-4" />
					{ link.label }
				</a>
			</li>
		{/each}
	</ul>
</nav>
