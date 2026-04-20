<script lang="ts">
    import { fade } from 'svelte/transition';
    import { 
        createMutation, 
        useQueryClient 
    }                   from '@tanstack/svelte-query';
    import { toast }    from 'svelte-sonner';

    import connectRequest, {
        isApiError
    }                   from '$lib/services/fetch.service';
    import type { 
        QR, 
        QRMapped 
    }                   from '$lib/models/qr/qr.model';
    import ClassQRCard  from './ClassQRCard.svelte';
    import { METHOD }   from '$lib/services/http-codes';


    export interface Props {
        items     : QRMapped[];
        isPending : boolean;
        isError   : boolean;
        onEdit    : ( qr: QR ) => void;
    }


    let { 
        items, 
        isPending, 
        isError, 
        onEdit 
    }: Props = $props();


    const queryClient = useQueryClient();


    const deleteMutation = createMutation( () => ({
        mutationFn: async ( id: string ) => {
            const result = await connectRequest({
                endpoint    : `qr/delete?id=${ id }`,
                method      : METHOD.DELETE,
                isInternal  : true
            });

            if ( isApiError( result ) ) throw result;
            return result;
        },
        onSuccess: () => {
            toast.success( 'QR eliminado correctamente' );
            queryClient.invalidateQueries({ queryKey: [ 'qrs-today' ] });
            queryClient.invalidateQueries({ queryKey: [ 'qr-history' ] });
        },
        onError: ( err: any ) => {
            toast.error( err.message || 'Error al eliminar el QR' );
        }
    }));
</script>


<div in:fade={{ duration: 300 }} class="flex flex-col gap-6 w-full">
    <!-- Estado: Cargando -->
    {#if isPending}
        <div class="grid  grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {#each [ 1, 2, 3, 4 ] as _}
                <div class="w-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse p-6 flex flex-col items-center gap-5">
                    <div class="flex flex-col items-center gap-3 w-full">
                        <!-- <div class="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700"></div> -->
                        <div class="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                        <div class="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    </div>

                    <div class="w-52 aspect-square bg-gray-200 dark:bg-gray-700 rounded-xl shadow-inner"></div>

                    <div class="grid grid-cols-2 gap-3 w-full">
                        <div class="h-11 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                        <div class="h-11 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    </div>
                </div>
            {/each}
        </div>

    <!-- Estado: Error -->
    {:else if isError}
        <div class="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <svg class="w-10 h-10 mx-auto mb-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p class="font-semibold">Error al cargar los QRs de hoy</p>
            <p class="text-sm text-red-400 mt-1">Intenta recargar la página</p>
        </div>

    <!-- Estado: Datos -->
    {:else}
        {#if items.length === 0}
            <div class="py-16 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p class="font-semibold">No hay códigos QR generados aún para hoy.</p>
                <p class="text-sm mt-1">Si programaste un evento, debería aparecer aquí.</p>
            </div>
        {:else}
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 relative">
                {#each items as item ( item.id )}
                    <ClassQRCard
                        qr       = { item }
                        onEdit   = { () => onEdit( item.original ) }
                        onDelete = { () => deleteMutation.mutateAsync( item.id ) }
                    />
                {/each}
            </div>
        {/if}
    {/if}
</div>
