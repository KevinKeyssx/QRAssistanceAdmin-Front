<script lang="ts">
    import { DropdownMenu } from "bits-ui";

    import { authClient }   from "$lib/auth/auth-client";
    import { goto }         from "$app/navigation";


    interface Props {
        user: any;
    }


    let { user }: Props = $props();


    async function logout() {
        await authClient.signOut();
        goto( "/" );
    }
</script>


<DropdownMenu.Root>
    <DropdownMenu.Trigger class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95 outline-none">
        <div class="w-8 h-8 rounded-lg bg-lds-navy dark:bg-lds-gold flex items-center justify-center text-white dark:text-gray-900 text-xs font-black uppercase shadow-sm">
            { user.name?.charAt( 0 ) || 'A' }
        </div>

        <div class="flex-col items-start leading-none hidden sm:flex">
            <span class="text-[13px] font-bold text-gray-900 dark:text-gray-100 uppercase tracking-tight">
                { user.name }
            </span>
            <span class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                { user.role }
            </span>
        </div>

        <svg class="w-4 h-4 text-gray-400 dark:text-gray-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
    </DropdownMenu.Trigger>


    <DropdownMenu.Content class="w-64 mt-2 p-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50">

        <div class="px-3 py-2 flex flex-col gap-1">
            <div class="flex items-center gap-2">
                <div class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-lds-navy dark:text-lds-gold text-sm font-black border border-gray-100 dark:border-gray-700">
                    { user.name?.charAt( 0 ) || 'A' }
                </div>

                <div class="flex flex-col min-w-0">
                    <span class="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{ user.name }</span>
                    <span class="text-[11px] font-medium text-gray-400 dark:text-gray-500 truncate">{ user.email }</span>
                </div>
            </div>
        </div>

        <div class="px-3 py-2 flex flex-col gap-1.5 mt-1">
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700/50">
                <span class="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Estado</span>
                <span class="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[9px] font-black uppercase tracking-widest rounded-md border border-green-100 dark:border-green-900/30">
                    Activo
                </span>
            </div>
        </div>

        <DropdownMenu.Separator class="h-px my-2 bg-gray-100 dark:bg-gray-700" />

        <DropdownMenu.Item 
            onclick = { logout }
            class   = "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer outline-none active:scale-[0.98]"
        >
            <div class="p-1.5 bg-red-100/50 dark:bg-red-900/20 rounded-lg">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
            </div>
            Cerrar Sesión
        </DropdownMenu.Item>
    </DropdownMenu.Content>
</DropdownMenu.Root>
