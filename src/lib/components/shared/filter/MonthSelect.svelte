<script lang="ts">
    import Select, { type SelectItem } from '$lib/components/shared/Select.svelte';


    interface Props {
        value?        : string | string[];
        onValueChange?: ( value: any ) => void;
        class?        : string;
    }


    let { value = $bindable(), onValueChange, class: className = '' }: Props = $props();


    const monthOptions : SelectItem[]  = [
        { value: '',   label: 'Todos' },
        { value: '0',  label: 'Enero' },
        { value: '1',  label: 'Febrero' },
        { value: '2',  label: 'Marzo' },
        { value: '3',  label: 'Abril' },
        { value: '4',  label: 'Mayo' },
        { value: '5',  label: 'Junio' },
        { value: '6',  label: 'Julio' },
        { value: '7',  label: 'Agosto' },
        { value: '8',  label: 'Septiembre' },
        { value: '9',  label: 'Octubre' },
        { value: '10', label: 'Noviembre' },
        { value: '11', label: 'Diciembre' },
    ];
</script>


<Select 
    label         = "Mes"
    items         = { monthOptions }
    bind:value    = { value }
    onValueChange = { onValueChange }
    placeholder   = "Selecciona mes"
    class         = { className }
/>
