<script lang="ts">
	import { page } from '$app/state';

    import { links }    from './links';
    import UserDropdown from '$lib/components/shared/dropdown/UserDropdown.svelte';
</script>


<aside class="flex flex-col w-full bg-gray-50/90 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-5 print:hidden shadow-2xl transition-all duration-300">
	<div class="mb-8 font-bold text-xl text-gray-900 dark:text-white">
		Panel de control
	</div>

	<nav class="flex-1 flex flex-col gap-2">
		{#each links as link}
			<a
				href  = { link.href }
				class = {`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${ page.url.pathname === link.href ? 'bg-lds-navy text-white dark:bg-lds-gold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' }`}
			>
                <link.icon class="w-5 h-5" />
				{ link.label }
			</a>
		{/each}
	</nav>

    {#if page.data.user}
        <div class="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <UserDropdown user={ page.data.user } />
        </div>
    {/if}
</aside>
