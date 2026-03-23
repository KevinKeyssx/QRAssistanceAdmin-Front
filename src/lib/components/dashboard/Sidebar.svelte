<script lang="ts">
	import { page } from '$app/stores';

	const links = [
		{ href: '/dashboard/qr-generator', label: 'QR Generator' },
		{ href: '/dashboard/members',      label: 'Members'      },
		{ href: '/dashboard/graphics',     label: 'Graphics'     }
	];
</script>

<aside class="flex flex-col w-full bg-gray-50/90 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-5 print:hidden shadow-2xl transition-all duration-300">
	<div class="mb-8 font-bold text-xl text-gray-900 dark:text-white">
		Dashboard
	</div>

	<nav class="flex-1 flex flex-col gap-2">
		{#each links as link}
			<a
				href  = { link.href }
				class = {`px-4 py-2 rounded-lg transition-colors duration-200 ${ $page.url.pathname === link.href ? 'bg-lds-navy text-white dark:bg-lds-gold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700' }`}
			>
				{ link.label }
			</a>
		{/each}
	</nav>
</aside>
