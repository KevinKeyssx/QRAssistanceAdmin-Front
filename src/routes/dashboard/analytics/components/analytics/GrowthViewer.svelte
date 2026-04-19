<script lang="ts">
    import {
        Chart as ChartJS,
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale
    }                       from 'chart.js';
    import { Bar }          from 'svelte-chartjs';
    import { createQuery }  from '@tanstack/svelte-query';

    import connectRequest, {
        isApiError
    }                       from '$lib/services/fetch.service';
    import type { 
        GrowthItemDTO 
    }                       from '$lib/models/analytics/analytic.model';
    import {
        getThemeColor,
        getThemeColorRGBA
    }                       from '$lib/utils/theme';
    import { METHOD }       from '$lib/services/http-codes';
    import { ENDPOINT }     from '$lib/utils/consts/endpoints';
    import { isDark }       from '$lib/stores/themeStore';
    import YearSelect       from '$lib/components/shared/filter/YearSelect.svelte';


    ChartJS.register(
        Title,
        Tooltip,
        Legend,
        BarElement,
        CategoryScale,
        LinearScale
    );


    let year = $state( new Date().getFullYear().toString() );


    const growthQuery = createQuery( () => ({
        queryKey    : [ 'analytics', 'growth', year ],
        queryFn     : async (): Promise<GrowthItemDTO[]> => {
            const result = await connectRequest<GrowthItemDTO[]>({
                endpoint    : `${ ENDPOINT.ANALYTICS.GROWTH }?year=${ year }`,
                method      : METHOD.GET,
                isInternal  : true
            });

            if ( isApiError( result )) throw result;

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
                    label           : 'Escaneos',
                    data            : growthQuery.data.map( d => d.total ),
                    backgroundColor : getThemeColorRGBA( 0.8, $isDark ),
                    borderColor     : getThemeColor( $isDark ),
                    borderWidth     : 1,
                    borderRadius    : 4
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

        <YearSelect bind:value={ year } class="w-28" />
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
