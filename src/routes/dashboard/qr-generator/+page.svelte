<script lang="ts">
    import QRIcon           from '$lib/icons/QRIcon.svelte';
    import Dialog           from '$lib/components/shared/Dialog.svelte';
    import Tabs             from '$lib/components/shared/Tabs.svelte';
    import GenerateNewQR    from './components/generateNewQR.svelte';
    import QRHistory        from './components/QRHistory.svelte';
    import QrsToday         from './components/QrsToday.svelte';
    import type { QR }      from '$lib/models/qr/qr.model';


    let activeTab       = $state<'today' | 'history'>( 'today' );
    let isDialogOpen    = $state( false );
    let qrToEdit        = $state<any>( null );


    const tabOptions = [
        { value: 'today', label: 'Generados hoy' },
        { value: 'history', label: 'Historial' }
    ];

    function handleOpenCreate(): void {
        qrToEdit     = null;
        isDialogOpen = true;
    }

    function handleEdit( qr: QR ): void {
        qrToEdit     = qr;
        isDialogOpen = true;
    }


    function handleSuccess(): void {
        isDialogOpen = false;
        qrToEdit     = null;
    }
</script>


<svelte:head>
	<title>Generador QR | Dashboard | QR Assistance</title>
</svelte:head>


<main class="flex flex-col gap-6 w-full max-w-6xl mx-auto align-top">
	<div class="flex justify-between items-center print:hidden">
		<h1 class="text-3xl font-bold text-lds-navy dark:text-lds-gold">Generador QR</h1>

        <button
            onclick = { handleOpenCreate }
            class   = "bg-lds-navy text-white dark:bg-lds-gold dark:text-gray-900 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm flex gap-1.5 items-center hover:opacity-90 transition-all active:scale-95"
        >
            <QRIcon />
            <span class="hidden sm:flex">Programar nuevo QR</span>
        </button>
	</div>

    <!-- TABS -->
    <Tabs bind:activeTab={ activeTab } options={ tabOptions } />

    {#if activeTab === 'today'}
        <QrsToday onEdit={ handleEdit } />
    {/if}

    {#if activeTab === 'history'}
        <QRHistory onEdit={ handleEdit } />
    {/if}
</main>

<Dialog
    open        = { isDialogOpen }
    title       = { qrToEdit ? 'Editar Programación QR' : 'Crear QR Personalizado' }
    description = { qrToEdit ? 'Modifica los parámetros del código QR seleccionado.' : 'Configura los parámetros detallados para crear un código QR de evento especial o uso extraordinario.' }
    onClose     = { () => isDialogOpen = false }
>
    <GenerateNewQR
        qr        = { qrToEdit }
        onCancel  = { () => isDialogOpen = false }
        onSuccess = { handleSuccess }
    />
</Dialog>
