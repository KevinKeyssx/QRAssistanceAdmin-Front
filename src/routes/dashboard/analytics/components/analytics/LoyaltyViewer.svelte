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
    import { METHOD }         from '$lib/services/http-codes';
    import type { 
        LoyaltyStatusDTO 
    }                         from '$lib/models/analytics/analytic.model';
    import { ENDPOINT }       from '$lib/utils/consts/endpoints';

    
    const loyaltyQuery = createQuery( () => ({
        queryKey    : [ 'analytics', 'loyalty' ],
        queryFn     : async (): Promise<LoyaltyStatusDTO[]> => {
            const result = await connectRequest<LoyaltyStatusDTO[]>({
                endpoint    : ENDPOINT.ANALYTICS.LOYALTY,
                method      : METHOD.GET,
                isInternal  : true
            });

            if ( isApiError( result ) ) throw result;

            return result;
        },
        staleTime   : 1000 * 60 * 15 // 15 mins cache
    }));

    const chartData = $derived.by( () => {
        if ( !loyaltyQuery.data ) return null;
        
        const translateStatus = (status: string) => {
            const s = status.toLowerCase();
            if ( s.includes( 'active' ) ) return 'Activos';
            if ( s.includes( 'risk' ) ) return 'En Riesgo';
            return 'Inactivos';
        };

        const backgroundColors = loyaltyQuery.data.map( d => {
            if ( d.status.toLowerCase().includes( 'active' ) ) return '#caa861'; // lds gold
            if ( d.status.toLowerCase().includes( 'risk' ) ) return '#8b6914'; // darker gold
            return '#1a2a40'; // lds navy
        });

        return {
            labels: loyaltyQuery.data.map( d => translateStatus( d.status ) ),
            datasets: [
                {
                    label: 'Cantidad de Miembros',
                    data: loyaltyQuery.data.map( d => d.totalCount ),
                    backgroundColor: backgroundColors,
                    borderRadius: 4
                }
            ]
        };
    });
</script>

<div class="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-full h-full flex flex-col min-h-[400px]">
    <div class="mb-6">
        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Estado de Fidelidad y Riesgo</h2>
        <p class="text-sm text-gray-500">Distribución de asistentes según su última fecha de registro (Activos: 14 días, En Riesgo: 14-28 días, Inactivos: >28 días).</p>
    </div>

    {#if loyaltyQuery.isPending}
        <div class="animate-pulse mt-8 space-y-4">
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
    {:else if loyaltyQuery.isError}
        <div class="text-red-500 font-semibold text-center mt-10">
            <p>Error al cargar los datos de lealtad.</p>
        </div>
    {:else if loyaltyQuery.data && chartData}
        <div class="relative w-full flex-1 h-[300px] mt-4">
            <Bar 
                data    = { chartData } 
                options = {{
                    indexAxis           : 'y', // Horizontal bars
                    responsive          : true,
                    maintainAspectRatio : false,
                    plugins             : { legend: { display: false } },
                    scales              : { x: { beginAtZero: true } }
                }} 
            />
        </div>
    {/if}
</div>
