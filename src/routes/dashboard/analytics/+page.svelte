<script lang="ts">
    import Tabs               from "$lib/components/shared/Tabs.svelte";
    import Select             from "$lib/components/shared/Select.svelte";
    import MainChartViewer    from "./components/analytics/MainChartViewer.svelte";
    import RetentionViewer    from "./components/analytics/RetentionViewer.svelte";
    import LoyaltyViewer      from "./components/analytics/LoyaltyViewer.svelte";
    import PunctualityViewer  from "./components/analytics/PunctualityViewer.svelte";
    import GrowthViewer       from "./components/analytics/GrowthViewer.svelte";

    let activeTab = $state<'main' | 'retention' | 'loyalty' | 'punctuality' | 'growth'>( 'main' );

    const tabOptions = [
        { value: 'main',        label: 'General' },
        { value: 'retention',   label: 'Retención' },
        { value: 'loyalty',     label: 'Fidelidad' },
        { value: 'punctuality', label: 'Puntualidad' },
        { value: 'growth',      label: 'Crecimiento' }
    ];
</script>


<svelte:head>
    <title>Estadísticas y Analíticas | Dashboard | QR Assistance</title>
</svelte:head>


<main class="flex flex-col gap-6 w-full max-w-6xl mx-auto align-top pb-10 overflow-x-hidden lg:overflow-x-visible">
    <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold text-lds-navy dark:text-lds-gold">Analíticas de Asistencia</h1>

        <p class="text-sm text-gray-500 dark:text-gray-400">
            Revisa indicadores dinámicos, retención, puntualidad, fidelidad y crecimiento de tu congregación.
        </p>
    </div>

    <!-- NAVEGACIÓN -->
    <div class="sm:hidden md:flex lg:hidden">
        <Select 
            items = { tabOptions } 
            bind:value = { activeTab as any } 
            placeholder = "Seleccionar vista..."
            class = "w-full" 
        />
    </div>

    <div class="hidden sm:flex md:hidden lg:flex">
        <Tabs bind:activeTab={ activeTab } options={ tabOptions } maxWidth="" />
    </div>

    <div class="w-full flex-1 min-w-0">
        {#if activeTab === 'main'}
            <MainChartViewer />
        {/if}

        {#if activeTab === 'retention'}
            <RetentionViewer />
        {/if}

        {#if activeTab === 'loyalty'}
            <LoyaltyViewer />
        {/if}

        {#if activeTab === 'punctuality'}
            <PunctualityViewer />
        {/if}

        {#if activeTab === 'growth'}
            <GrowthViewer />
        {/if}
    </div>
</main>
