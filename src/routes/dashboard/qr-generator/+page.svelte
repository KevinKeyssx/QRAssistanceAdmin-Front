<script lang="ts">
    import QRIcon           from '$lib/icons/QRIcon.svelte';
    import Dialog           from '$lib/components/shared/Dialog.svelte';
    import GenerateNewQR    from './components/generateNewQR.svelte';
    import QRHistory        from './components/QRHistory.svelte';
    import QrsToday         from './components/QrsToday.svelte';
    import type { QR }      from '$lib/models/qr/qr.model';


    let activeTab       = $state<'today' | 'history'>( 'today' );
    let isDialogOpen    = $state( false );
    let qrToEdit        = $state<any>( null );


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
		<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Generador QR</h1>

        <button
            onclick = { handleOpenCreate }
            class   = "bg-lds-navy text-white dark:bg-lds-gold dark:text-gray-900 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm flex gap-1.5 items-center hover:opacity-90 transition-all active:scale-95"
        >
            <QRIcon />
            <span class="hidden sm:flex">Programar nuevo QR</span>
        </button>
	</div>

    <!-- TABS -->
    <div class="flex bg-gray-100 dark:bg-gray-800/80 p-1.5 rounded-xl w-full max-w-sm shadow-sm relative print:hidden self-start">
        <button
            onclick  = { () => activeTab = 'today' }
            class    = "relative flex-1 py-1.5 text-sm font-semibold transition-colors duration-300 z-10 { activeTab === 'today' ? 'text-gray-900 dark:text-gray-900' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200' }"
        >
            Generados hoy
        </button>

        <button
            onclick  = { () => activeTab = 'history' }
            class    = "relative flex-1 py-1.5 text-sm font-semibold transition-colors duration-300 z-10 { activeTab === 'history' ? 'text-gray-900 dark:text-gray-900' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200' }"
        >
            Historial
        </button>

        <div
            class = "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-lds-gold rounded-lg shadow-sm transition-transform duration-300 ease-out"
            style = "transform: translateX({ activeTab === 'today' ? '0' : 'calc(100% + 4px)' });"
        ></div>
    </div>

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
