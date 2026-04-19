<script lang="ts">
    import {
        Chart as ChartJS,
        Title,
        Tooltip,
        Legend,
        ArcElement
    }                       from 'chart.js';
    import { Doughnut }     from 'svelte-chartjs';
    import { createQuery }  from '@tanstack/svelte-query';


    import connectRequest, {
        isApiError
    }                           from '$lib/services/fetch.service';
    import type { 
        RetentionDTO 
    }                           from '$lib/models/analytics/analytic.model';
    import { METHOD }           from '$lib/services/http-codes';
    import { ENDPOINT }         from '$lib/utils/consts/endpoints';
    import { isDark }           from '$lib/stores/themeStore';
    import { getThemeColor }    from '$lib/utils/theme';


    ChartJS.register( Title, Tooltip, Legend, ArcElement );


    const retentionQuery = createQuery( () => ({
        queryKey    : [ 'analytics', 'retention' ],
        queryFn     : async (): Promise<RetentionDTO> => {
            const result = await connectRequest<RetentionDTO>({
                endpoint    : ENDPOINT.ANALYTICS.RETENTION,
                method      : METHOD.GET,
                isInternal  : true
            });

            if ( isApiError( result ) ) throw result;

            return result;
        },
        staleTime   : 1000 * 60 * 15 // 15 mins cache
    }));

    const chartData = $derived.by( () => {
        if ( !retentionQuery.data ) return null;
        
        const { totalMembers, recurringMembers } = retentionQuery.data;
        const oneTime = totalMembers - recurringMembers;
        
        return {
            labels: [ 'Recurrentes', 'Una sola vez' ],
            datasets: [
                {
                    data: [ recurringMembers, oneTime ],
                    backgroundColor: [ 
                        getThemeColor( $isDark ), 
                        '#64748b' // Slate 500 para una sola vez (Elegante)
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }
            ]
        };
    });
</script>


<div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-full h-full flex flex-col items-center justify-center min-h-[400px]">
    {#if retentionQuery.isPending}
        <div class="animate-pulse flex flex-col items-center">
            <div class="w-48 h-48 rounded-full bg-gray-200 dark:bg-gray-700"></div>

            <div class="h-4 bg-gray-200 rounded w-32 mt-4"></div>
        </div>
    {:else if retentionQuery.isError}
        <div class="text-red-500 font-semibold text-center">
            <p>Error al cargar la retención</p>
        </div>
    {:else if retentionQuery.data && chartData}
        <div class="w-full flex-1 flex flex-col lg:flex-row items-center gap-8 justify-center">
            <div class="relative h-[300px] w-full sm:w-[400px]">
                <Doughnut 
                    data    = { chartData } 
                    options = {{
                        responsive          : true,
                        maintainAspectRatio : false,
                        cutout              : '70%',
                        plugins             : {
                            legend: { position: 'bottom' }
                        }
                    }} 
                />
            </div>

            <div class="flex flex-col gap-4 bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl w-full max-w-sm">
                <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">Resumen</h3>
                <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">Total Registrados:</span>

                    <span class="font-bold text-xl">{ retentionQuery.data.totalMembers }</span>
                </div>

                <div class="flex justify-between items-center">
                    <span class="text-lds-gold">Recurrentes:</span>

                    <span class="font-bold text-xl text-lds-gold">{ retentionQuery.data.recurringMembers }</span>
                </div>

                <div class="flex justify-between items-center">
                    <span class="text-lds-navy dark:text-gray-300">Una sola vez:</span>

                    <span class="font-bold text-xl text-lds-navy dark:text-gray-300">{ retentionQuery.data.totalMembers - retentionQuery.data.recurringMembers }</span>
                </div>
            </div>
        </div>
    {/if}
</div>
