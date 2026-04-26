<script lang="ts">
    import { DropdownMenu } from "bits-ui";
    import { EllipsisVertical } from "lucide-svelte";

    interface Action {
        label   : string;
        icon    : any;
        onclick : () => void;
        danger? : boolean;
    }

    interface Props {
        actions   : Action[];
        class?    : string;
    }

    let { actions, class: className }: Props = $props();
</script>


<DropdownMenu.Root>
    <DropdownMenu.Trigger 
        class = "p-2 rounded-lg text-gray-400 hover:text-lds-navy dark:hover:text-lds-gold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 outline-none active:scale-95 { className }"
    >
        <EllipsisVertical class="w-5 h-5" />
    </DropdownMenu.Trigger>

    <DropdownMenu.Content 
        class           = "w-56 mt-2 p-1.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-50 outline-none"
    >
        {#each actions as action}
            <DropdownMenu.Item 
                onclick = { action.onclick }
                class   = "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer outline-none active:scale-[0.98] 
                    { action.danger 
                        ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50' 
                }"
            >
                <div class="p-1.5 rounded-lg { action.danger ? 'bg-red-100/50 dark:bg-red-900/20' : 'bg-gray-100 dark:bg-gray-900' }">
                    <action.icon class="w-4 h-4" />
                </div>

                { action.label }
            </DropdownMenu.Item>
        {/each}
    </DropdownMenu.Content>
</DropdownMenu.Root>
