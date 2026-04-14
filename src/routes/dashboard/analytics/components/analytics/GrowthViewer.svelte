<script lang="ts">
    import { createQuery }    from '@tanstack/svelte-query';
    import { Bar }            from 'svelte-chartjs';
    import {
        Chart as ChartJS,
        Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale
    }                         from 'chart.js';

    ChartJS.register( Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale );

    import connectRequest, {
        isApiError
    }                         from '$lib/services/fetch.service';
    import type { 
        GrowthItemDTO 
    }                         from '$lib/models/analytics/analytic.model';
    import { METHOD }         from '$lib/services/http-codes';
    import { ENDPOINT }       from '$lib/utils/consts/endpoints';

    
    let year = $state( new Date().getFullYear() );

    const growthQuery = createQuery( () => ({
        queryKey    : [ 'analytics', 'growth', year ],
        queryFn     : async (): Promise<GrowthItemDTO[]> => {
            const result = await connectRequest<GrowthItemDTO[]>({
                endpoint    : `${ ENDPOINT.ANALYTICS.GROWTH }?year=${ year }`,
                method      : METHOD.GET,
                isInternal  : true
            });

            if ( isApiError( result ) ) throw result;

            return result;
        },
        staleTime   : 1000 * 60 * 15 // 15 mins cache
    }));

    const months = [ "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic" ];

    const chartData = $derived.by( () => {
        if ( !growthQuery.data ) return null;
        
        return {
            labels: growthQuery.data.map( d => months[ d.month - 1 ] ),
            datasets: [
                {
                    label: 'Escaneos',
                    data: growthQuery.data.map( d => d.total ),
                    backgroundColor: '#caa861', // LDS Gold
                    borderRadius: 4
                }
            ]
        };
    });

</script>

<div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-full h-full flex flex-col min-h-[400px]">
    
    <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Crecimiento y Variación Menual</h2>
            <p class="text-sm text-gray-500">Evolución mes a mes respecto al período anterior.</p>
        </div>

        <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Año:</span>
            <select 
                class = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-lds-gold outline-none"
                bind:value={ year }
            >
                <option value={ 2026 }>2026</option>
                <option value={ 2025 }>2025</option>
                <option value={ 2024 }>2024</option>
            </select>
        </div>
    </div>

    {#if growthQuery.isPending}
        <div class="animate-pulse mt-8 h-64 w-full bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
    {:else if growthQuery.isError}
        <div class="text-red-500 font-semibold text-center mt-10">
            <p>Error al cargar la tabla de crecimiento.</p>
        </div>
    {:else if growthQuery.data && chartData}
        <div class="relative w-full flex-1 h-[300px]">
            <Bar 
                data    = { chartData } 
                options = {{
                    responsive          : true,
                    maintainAspectRatio : false,
                    plugins             : { legend: { display: false } },
                    scales              : { y: { beginAtZero: true } }
                }} 
            />
        </div>
    {/if}
</div>
