<script lang="ts">
	import { onMount }           from 'svelte';
	import QRCodeStyling             from 'qr-code-styling';
	import html2canvas           from 'html2canvas';
	import { jsPDF }             from 'jspdf';
	import type { LDSClass }     from '$lib/types';
	import { browser }           from '$app/environment';

	let {
		appClass,
		url,
		date,
		disabled = false,
		isNew    = false
	} = $props<{
		appClass : LDSClass;
		url      : string;
		date     : Date;
		disabled?: boolean;
		isNew?   : boolean;
	}>();

	let qrRef : HTMLElement;
	let qrCodeStyling : any;
	let cardRef : HTMLElement;

	function getThemeColor() {
		if ( !browser ) return '#007da5';
		const isDark = document.documentElement.classList.contains( 'dark' );
		return isDark ? '#c9a227' : '#007da5';
	}

	onMount( () => {
		qrCodeStyling = new QRCodeStyling({
			width       : 200,
			height      : 200,
			data        : url,
            type        : 'svg',
			margin      : 10,
			dotsOptions : {
				color : getThemeColor(),
				type  : 'classy-rounded'
			},
			backgroundOptions : {
				color : '#ffffff',
			},
			imageOptions : {
				crossOrigin : 'anonymous',
				margin      : 5
			},
            cornersSquareOptions: {
                type: 'extra-rounded',
                color: getThemeColor()
            },
            cornersDotOptions: {
                type: 'dot',
                color: getThemeColor()
            },
		});

		qrCodeStyling.append( qrRef );

		return () => {};
	});

	async function handlePrint() {
		if ( disabled ) return;
		
		const children = Array.from( document.body.children );
		const hiddenElements : any[] = [];
		
		children.forEach( child => {
			if ( child.tagName !== 'SCRIPT' && child instanceof HTMLElement ) {
				hiddenElements.push({ el: child, display: child.style.display });
				child.style.display = 'none';
			}
		});

		const printContainer = document.createElement( 'div' );
		printContainer.className = 'print-only-container';
		printContainer.innerHTML = `
			<div class="flex flex-col items-center justify-center pt-8 pb-4 w-full">
				<h2 class="text-4xl font-bold text-black">${ appClass.label }</h2>
				<p class="text-xl font-medium text-gray-800 mt-2">${ date.toLocaleDateString() }</p>
			</div>
			<div class="bg-white p-2 rounded-lg flex justify-center items-center w-full" id="print-qr-target"></div>
		`;
		
		document.body.appendChild( printContainer );

		const printQR = new QRCodeStyling({
			width       : 500,
			height      : 500,
			data        : url,
            type        : 'svg',
			margin      : 10,
			dotsOptions : { color: '#000000', type: 'classy-rounded' },
			backgroundOptions : { color: '#ffffff' },
			imageOptions: { crossOrigin: 'anonymous', margin: 5 },
            cornersSquareOptions: { type: 'extra-rounded', color: '#000000' },
            cornersDotOptions: { type: 'dot', color: '#000000' }
		});

		printQR.append( document.getElementById('print-qr-target')! );
		await new Promise( res => setTimeout( res, 250 ) );

		window.print();

		document.body.removeChild( printContainer );

		hiddenElements.forEach( item => {
			item.el.style.display = item.display;
		});
	}

	async function handleDownloadPDF() {
		if ( disabled ) return;
		
		const tempDiv = document.createElement('div');
		tempDiv.style.position = 'absolute';
		tempDiv.style.left = '-9999px';
		tempDiv.style.top = '-9999px';
		document.body.appendChild(tempDiv);

		const pdfQR = new QRCodeStyling({
			width       : 800,
			height      : 800,
			data        : url,
            type        : 'svg',
			margin      : 10,
			dotsOptions : { color: '#000000', type: 'classy-rounded' },
			backgroundOptions : { color: '#ffffff' },
			imageOptions: { crossOrigin: 'anonymous', margin: 5 },
            cornersSquareOptions: { type: 'extra-rounded', color: '#000000' },
            cornersDotOptions: { type: 'dot', color: '#000000' }
		});

		pdfQR.append( tempDiv );
		await new Promise( res => setTimeout( res, 250 ) );

		const canvas = await html2canvas( tempDiv );
		const imgData = canvas.toDataURL( 'image/png' );

		const pdf = new jsPDF({
			orientation : 'portrait',
			unit        : 'mm',
			format      : 'a4'
		});

		const pdfWidth = pdf.internal.pageSize.getWidth();
		const imgWidth = 150;
		const imgHeight = ( canvas.height * imgWidth ) / canvas.width;
		
		const x = ( pdfWidth - imgWidth ) / 2;
		const y = 30;

		pdf.setFontSize( 28 );
		pdf.text( appClass.label, pdfWidth / 2, y, { align: 'center' } );
		
		pdf.addImage( imgData, 'PNG', x, y + 20, imgWidth, imgHeight );
		pdf.save( `QR_${ appClass.slug }.pdf` );

		document.body.removeChild(tempDiv);
	}
</script>

<div bind:this={cardRef} class={`card-container relative border rounded-xl overflow-hidden shadow-sm bg-white dark:bg-gray-800 transition-all duration-300 ${ disabled ? 'opacity-60 grayscale' : 'hover:shadow-md' } border-gray-200 dark:border-gray-700`}>
	<!-- {#if isNew && !disabled} ... {/if} -->

	<div class="p-4 flex flex-col items-center gap-4 w-full">
		<h3 class="font-bold text-lg text-gray-900 dark:text-gray-100 text-center">
			{ appClass.label }
		</h3>

		<p class="text-xs text-gray-500 dark:text-gray-400">
			{ date.toLocaleDateString() }
		</p>

		<!-- Contenedor del QR -->
		<div class="bg-white p-2 rounded-lg flex justify-center items-center w-full" bind:this={qrRef}></div>

		<div class="flex gap-2 w-full mt-2 print:hidden">
			<button
				onclick  = { handlePrint }
				{disabled}
				class    = "flex-1 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
			>
				Imprimir
			</button>

			<button
				onclick  = { handleDownloadPDF }
				{disabled}
				class    = "flex-1 py-2 px-4 rounded-lg bg-lds-navy text-white hover:opacity-90 transition-opacity duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed dark:bg-lds-gold cursor-pointer"
			>
				PDF
			</button>
		</div>
	</div>
</div>
