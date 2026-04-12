<script lang="ts">
    import Dialog from './Dialog.svelte';

    interface Props {
        open        : boolean;
        title?      : string;
        description?: string;
        itemName?   : string; // Nombre del item a mostrar en el cuadro rojo
        itemExtra?  : string; // Info adicional (opcional)
        confirmText?: string;
        cancelText? : string;
        isPending?  : boolean;
        onClose     : () => void;
        onConfirm   : () => void;
    }

    let {
        open,
        title       = 'Eliminar item',
        description = 'Esta acción no se puede deshacer.',
        itemName,
        itemExtra   = '¿Estás seguro que deseas eliminar este elemento?',
        confirmText = 'Eliminar',
        cancelText  = 'Cancelar',
        isPending   = false,
        onClose,
        onConfirm
    }: Props = $props();
</script>

<Dialog
    { open }
    { title }
    { description }
    { onClose }
>
    <div class="flex flex-col gap-6">
        {#if itemName}
            <!-- Cuadro Rojo de Advertencia (Estilo Premium) -->
            <div class="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 transition-all">
                <div class="w-12 h-12 bg-red-100 dark:bg-red-800/50 rounded-xl flex items-center justify-center shrink-0">
                    <svg class="w-6 h-6 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>

                <div class="min-w-0">
                    <p class="font-bold text-gray-900 dark:text-white truncate">
                        { itemName }
                    </p>

                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        { itemExtra }
                    </p>
                </div>
            </div>
        {/if}

        <div class="flex gap-3 justify-end items-center mt-2">
            <button
                type    = "button"
                onclick = { onClose }
                disabled = { isPending }
                class   = "px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300
                    bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                    transition-all active:scale-95 disabled:opacity-50"
            >
                { cancelText }
            </button>

            <button
                id      = "confirm-delete-action"
                type    = "button"
                onclick = { onConfirm }
                disabled = { isPending }
                class   = "flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white
                    bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700
                    transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
                {#if isPending}
                    <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                {/if}
                
                { isPending ? 'Eliminando...' : confirmText }
            </button>
        </div>
    </div>
</Dialog>
