<script lang="ts">
    import { createQuery }    from '@tanstack/svelte-query';
    import { Line }           from 'svelte-chartjs';
    import {
        Chart as ChartJS,
        Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler
    }                         from 'chart.js';

    ChartJS.register( Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler );

    import connectRequest, {
        isApiError
    }                         from '$lib/services/fetch.service';
    import { METHOD }         from '$lib/services/http-codes';
    import type { 
        MainChartItemDTO 
    }                         from '$lib/models/analytics/analytic.model';
    import { LDS_CLASSES }    from '$lib/utils/classes';
    import { ENDPOINT }       from '$lib/utils/consts/endpoints';

    
    let year   = $state( new Date().getFullYear().toString() );
    let month  = $state( '' );
    let qrType = $state( '' );

    const months = [ 
        { val: '', label: 'Todos los meses' },
        { val: '1', label: 'Enero' }, { val: '2', label: 'Febrero' }, { val: '3', label: 'Marzo' },
        { val: '4', label: 'Abril' }, { val: '5', label: 'Mayo' }, { val: '6', label: 'Junio' },
        { val: '7', label: 'Julio' }, { val: '8', label: 'Agosto' }, { val: '9', label: 'Septiembre' },
        { val: '10', label: 'Octubre' }, { val: '11', label: 'Noviembre' }, { val: '12', label: 'Diciembre' }
    ];

    const mainChartQuery = createQuery( () => {
        const queryParams = new URLSearchParams({ year });
        if ( month ) queryParams.append( 'month', month );
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
            return !month && typeof d.label === 'number' && d.label <= 12 
                    ? months[ d.label ].label.substring(0, 3) 
                    : d.label.toString();
        });
        
        const dataValues = mainChartQuery.data.map( d => d.total );

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Asistencias',
                    data: dataValues,
                    borderColor: '#caa861', // LDS Gold
                    backgroundColor: 'rgba(202, 168, 97, 0.1)',
                    tension: 0.4, // Curva suave (equivalente a Spline)
                    borderWidth: 3,
                    fill: true,
                    pointBackgroundColor: '#1a2a40', // LDS Navy para los puntos
                    pointRadius: 4,
                    pointHoverRadius: 6
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

        <div class="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div class="flex flex-col gap-1 w-full sm:w-auto">
                <label for="yearSelect" class="text-xs font-semibold text-gray-600 dark:text-gray-400">Año *</label>
                <select 
                    id = "yearSelect"
                    class = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-lds-gold outline-none min-w-[100px]"
                    bind:value={ year }
                >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                </select>
            </div>

            <div class="flex flex-col gap-1 w-full sm:w-auto">
                <label for="monthSelect" class="text-xs font-semibold text-gray-600 dark:text-gray-400">Mes (Drill-down)</label>
                <select 
                    id = "monthSelect"
                    class = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-lds-gold outline-none min-w-[140px]"
                    bind:value={ month }
                >
                    {#each months as m}
                        <option value={ m.val }>{ m.label }</option>
                    {/each}
                </select>
            </div>

            <div class="flex flex-col gap-1 w-full sm:w-auto">
                <label for="typeSelect" class="text-xs font-semibold text-gray-600 dark:text-gray-400">Organización</label>
                <select 
                    id = "typeSelect"
                    class = "border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-lds-gold outline-none min-w-[160px]"
                    bind:value={ qrType }
                >
                    <option value="">Todas las clases</option>
                    {#each LDS_CLASSES as cls}
                        <option value={ cls.slug }>{ cls.label }</option>
                    {/each}
                </select>
            </div>
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
