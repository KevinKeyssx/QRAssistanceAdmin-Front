<script lang="ts">
    import { UserPlus, Pencil, Trash2 } from 'lucide-svelte';
    import ActionDropdown from './dropdown/ActionDropdown.svelte';

    interface Props {
        onRegister    : () => void;
        onEdit?       : () => void;
        onDelete?     : () => void;
        showEdit?     : boolean;
        showDelete?   : boolean;
        registerTitle?: string;
        editTitle?    : string;
        deleteTitle?  : string;
        className?    : string;
    }

    let {
        onRegister,
        onEdit,
        onDelete,
        showEdit      = true,
        showDelete    = true,
        registerTitle = "Registrar asistencia",
        editTitle     = "Editar",
        deleteTitle   = "Eliminar",
        className     = ""
    }: Props = $props();
</script>


<div class="flex gap-1.5 sm:gap-2 { className }">
    <!-- Vista Desktop/Tablet Adaptativa -->
    <!-- Se oculta en móvil y en md, se muestra en sm y lg -->
    <div class="hidden sm:flex md:hidden lg:flex items-center gap-1.5 sm:gap-2">
        <button
            onclick = { onRegister }
            class   = "p-2 rounded-lg text-gray-400 hover:text-lds-navy dark:hover:text-lds-gold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
            title   = { registerTitle }
        >
            <UserPlus class="w-4 h-4" />
        </button>

        {#if showEdit && onEdit}
            <button
                onclick = { onEdit }
                class   = "p-2 rounded-lg text-gray-400 hover:text-lds-navy dark:hover:text-lds-gold hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 active:scale-95"
                title   = { editTitle }
            >
                <Pencil class="w-4 h-4" />
            </button>
        {/if}

        {#if showDelete && onDelete}
            <button
                onclick = { onDelete }
                class   = "p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 active:scale-95"
                title   = { deleteTitle }
            >
                <Trash2 class="w-4 h-4" />
            </button>
        {/if}
    </div>

    <!-- Vista Mobile/MD (Dropdown) -->
    <!-- Se muestra en móvil y en md, se oculta en sm y lg -->
    <ActionDropdown 
        class   = "block sm:hidden md:block lg:hidden"
        actions = {[
            {
                label   : registerTitle,
                icon    : UserPlus,
                onclick : onRegister
            },
            ...( ( showEdit && onEdit ) ? [
                {
                    label   : editTitle,
                    icon    : Pencil,
                    onclick : onEdit
                }
            ] : [] ),
            ...( ( showDelete && onDelete ) ? [
                {
                    label   : deleteTitle,
                    icon    : Trash2,
                    onclick : onDelete,
                    danger  : true
                }
            ] : [] )
        ]} 
    />
</div>
