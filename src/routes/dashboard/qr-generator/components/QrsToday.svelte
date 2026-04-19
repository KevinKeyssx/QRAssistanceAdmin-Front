<script lang="ts">
    import { fade }         from 'svelte/transition';
    import { 
        createQuery, 
        createMutation, 
        useQueryClient 
    }                       from '@tanstack/svelte-query';
    import { toast }        from 'svelte-sonner';
    import { env }          from '$env/dynamic/public';

    import connectRequest, {
        isApiError
    }                       from '$lib/services/fetch.service';
    import { METHOD }       from '$lib/services/http-codes';
    import { LDS_CLASSES }  from '$lib/utils/classes';
    import { formatDate }   from '$lib/utils/tempo';
    import ClassQRCard      from './ClassQRCard.svelte';
    import type { QR }      from '$lib/models/qr/qr.model';


    export interface Props {
        onEdit : ( qr: QR ) => void;
    }


    let { onEdit }: Props = $props();
    
    const queryClient     = useQueryClient();

    // ─── Query ────────────────────────────────────────────────────────────────
    const todayQuery = createQuery( () => ({
        queryKey    : [ 'qrs-today' ],
        queryFn     : async (): Promise<QR[]> => {
            const result = await connectRequest<QR[]>({
                endpoint    : 'qr/qrs-today',
                method      : METHOD.POST,
                isInternal  : true,
                body        : {}
            });

            if ( isApiError( result ) ) throw result;

            return result;
        },
        staleTime: 1000 * 60 * 5 // 5 minutos de cache para hoy
    }));


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

    // ─── Transformación ───────────────────────────────────────────────────────
    const mappedItems = $derived.by( () => {
        if ( !todayQuery.data ) return [];

        return todayQuery.data.map( item => {
            let appClass = LDS_CLASSES.find( c => c.slug === item.type );

            // Si no es una clase estándar, es un tipo genérico (event, show, etc.)
            if ( !appClass ) {
                appClass = {
                    slug: item.type,
                    label: item.type.charAt(0).toUpperCase() + item.type.slice(1).replace('-', ' '),
                    icon: null, // El componente manejará el icono por defecto
                    classCompatible: []
                };
            }

            const url = `${ env.PUBLIC_FRONTEND_QR_URL }/${ item.session_id }?class=${ item.type }`;

            return {
                ...item,
                appClass,
                url,
                original: item
            };
        });
    });
</script>


<div in:fade={{ duration: 300 }} class="flex flex-col gap-6 w-full">
    <!-- Estado: Cargando -->
    {#if todayQuery.isPending}
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
    {:else if todayQuery.isError}
        <div class="text-center py-12 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <svg class="w-10 h-10 mx-auto mb-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p class="font-semibold">Error al cargar los QRs de hoy</p>
            <p class="text-sm text-red-400 mt-1">Intenta recargar la página</p>
        </div>

    <!-- Estado: Datos -->
    {:else}
        {#if mappedItems.length === 0}
            <div class="py-16 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p class="font-semibold">No hay códigos QR generados aún para hoy.</p>
                <p class="text-sm mt-1">Si programaste un evento, debería aparecer aquí.</p>
            </div>
        {:else}
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 relative">
                {#each mappedItems as item ( item._id )}
                    <ClassQRCard
                        appClass = { item.appClass }
                        url      = { item.url }
                        date     = { formatDate( item.date ) }
                        onEdit   = { () => onEdit( item.original ) }
                        onDelete = { () => deleteMutation.mutateAsync( item._id ) }
                    />
                {/each}
            </div>
        {/if}
    {/if}
</div>
