<script lang="ts">
    import {
        Chart as ChartJS,
        Title,
        Tooltip,
        Legend,
        LineElement,
        PointElement,
        CategoryScale,
        LinearScale,
        Filler
    }                       from 'chart.js';
    import { Line }         from 'svelte-chartjs';
    import { createQuery }  from '@tanstack/svelte-query';

    import connectRequest, {
        isApiError
    }                       from '$lib/services/fetch.service';
    import { METHOD }       from '$lib/services/http-codes';
    import type { 
        PunctualityItemDTO 
    }                       from '$lib/models/analytics/analytic.model';
    import {
        getThemeColor,
        getThemeColorRGBA
    }                       from '$lib/utils/theme';
    import { ENDPOINT }     from '$lib/utils/consts/endpoints';
    import { isDark }       from '$lib/stores/themeStore';


    ChartJS.register(
        Title,
        Tooltip,
        Legend,
        LineElement,
        PointElement,
        CategoryScale,
        LinearScale,
        Filler
    );


    const punctualityQuery = createQuery( () => ({
        queryKey    : [ 'analytics', 'punctuality' ],
        queryFn     : async (): Promise<PunctualityItemDTO[]> => {
            const result = await connectRequest<PunctualityItemDTO[]>({
                endpoint    : ENDPOINT.ANALYTICS.PUNCTUALITY,
                method      : METHOD.GET,
                isInternal  : true
            });

            if ( isApiError( result ) ) throw result;

            return result;
        },
        staleTime   : 1000 * 60 * 15 // 15 mins cache
    }));

    const chartData = $derived.by( () => {
        if ( !punctualityQuery.data ) return null;
        
        const labels = punctualityQuery.data.map( d => `${ d.hour.toString().padStart( 2, '0' ) }:${ d.block.toString().padStart( 2, '0' ) }` );
        const dataValues = punctualityQuery.data.map( d => d.total );

        return {
            labels: labels,
            datasets: [
                {
                    label           : 'Volumen',
                    data            : dataValues,
                    borderColor     : getThemeColor( $isDark ),
                    backgroundColor : getThemeColorRGBA( 0.15, $isDark ),
                    fill            : true,
                    stepped         : true, // Interpolación de paso (StepAfter)
                    tension         : 0,
                    borderWidth     : 2
                }
            ]
        };
    });
</script>


<div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-full h-full flex flex-col min-h-[400px]">
    <div class="mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Puntualidad en Día Domingo</h2>

        <p class="text-sm text-gray-500">Volumen de escaneos separados en bloques de 15 minutos.</p>
    </div>

    {#if punctualityQuery.isPending}
        <div class="animate-pulse mt-8 h-64 w-full bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
    {:else if punctualityQuery.isError}
        <div class="text-red-500 font-semibold text-center mt-10">
            <p>Error al cargar los datos de puntualidad.</p>
        </div>
    {:else if punctualityQuery.data && chartData}
        <div class="relative w-full flex-1 h-[300px]">
            <Line 
                data    = { chartData } 
                options = {{
                    responsive          : true,
                    maintainAspectRatio : false,
                    plugins             : { legend: { display: false }},
                    scales              : { y: { beginAtZero: true }},
                    elements            : {
                        point: {
                            radius      : 3,
                            hoverRadius : 6
                        }
                    }
                }}
            />
        </div>
    {/if}
</div>
