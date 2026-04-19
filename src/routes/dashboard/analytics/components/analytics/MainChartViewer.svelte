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
        MainChartItemDTO 
    }                       from '$lib/models/analytics/analytic.model';
    import {
        getThemeColor,
        getThemeColorRGBA
    }                       from '$lib/utils/theme';
    import { ENDPOINT }     from '$lib/utils/consts/endpoints';
    import YearSelect       from '$lib/components/shared/filter/YearSelect.svelte';
    import MonthSelect      from '$lib/components/shared/filter/MonthSelect.svelte';
    import ClasesSelect     from '$lib/components/shared/filter/ClasesSelect.svelte';
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


    let year   = $state( new Date().getFullYear().toString() );
    let month  = $state( '' );
    let qrType = $state( '' );


    const months = [ 
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];


    const mainChartQuery = createQuery( () => {
        const queryParams = new URLSearchParams({ year });
        if ( month ) {
            // Ajustamos el mes de 0-indexed a 1-indexed para el API
            const monthApi = ( Number( month ) + 1 ).toString();
            queryParams.append( 'month', monthApi );
        }

        if ( qrType ) queryParams.append( 'qr_type', qrType );

        return {
            queryKey    : [ 'analytics', 'main-chart', year, month, qrType ],
            queryFn     : async (): Promise<MainChartItemDTO[]> => {
                const result = await connectRequest<MainChartItemDTO[]>({
                    endpoint    : `${ ENDPOINT.ANALYTICS.MAIN }?${ queryParams.toString() }`,
                    method      : METHOD.GET,
                    isInternal  : true
                });

                if ( isApiError( result ) ) throw result;

                return result;
            },
            staleTime   : 1000 * 60 * 15 // 15 mins cache
        };
    });


    const chartData = $derived.by( () => {
        if ( !mainChartQuery.data ) return null;

        const labels = mainChartQuery.data.map( d => {
            return !month && typeof d.label === 'number' && d.label >= 1 && d.label <= 12 
                ? months[ d.label - 1 ].substring( 0, 3 ) 
                : d.label.toString();
        });

        const dataValues = mainChartQuery.data.map( d => d.total );

        return {
            labels: labels,
            datasets: [
                {
                    label                   : 'Asistencias',
                    data                    : dataValues,
                    borderColor             : getThemeColor( $isDark ),
                    backgroundColor         : getThemeColorRGBA( 0.15, $isDark ),
                    tension                 : 0.4, // Curva suave (equivalente a Spline)
                    borderWidth             : 3,
                    fill                    : true,
                    pointBackgroundColor    : $isDark ? '#1a2a40' : '#ffffff',
                    pointRadius             : 4,
                    pointHoverRadius        : 6
                }
            ]
        };
    });
</script>

<div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-full h-full flex flex-col min-h-[500px]">
    <div class="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
        <div>
            <h2 class="text-xl font-bold text-gray-900 dark:text-white">Panorama General de Asistencia</h2>

            <p class="text-sm text-gray-500">Métricas dinámicas de asistencia global, mensual o por organización.</p>
        </div>

        <div class="flex flex-wrap items-end gap-3 w-full xl:w-auto">
            <YearSelect bind:value={ year } class="w-28" />

            <MonthSelect 
                bind:value={ month } 
                class="w-44" 
            />

            <ClasesSelect 
                bind:value={ qrType } 
                class="w-48"
            />
        </div>
    </div>

    {#if mainChartQuery.isPending}
        <div class="animate-pulse mt-8 h-80 w-full bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
    {:else if mainChartQuery.isError}
        <div class="text-red-500 font-semibold text-center mt-10">
            <p>Error al cargar el panorama general.</p>
        </div>
    {:else if mainChartQuery.data && chartData}
        <div class="relative w-full flex-1 h-[400px]">
            <Line 
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
