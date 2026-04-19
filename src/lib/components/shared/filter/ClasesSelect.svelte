<script lang="ts">
    import
    Select, {
        type SelectItem
    }                       from '$lib/components/shared/Select.svelte';
    import { LDS_CLASSES }  from '$lib/utils/classes';


    interface Props {
        value?          : string | string[];
        onValueChange?  : ( value: any ) => void;
        class?          : string;
        label?          : string;
    }


    let { 
        value = $bindable(), 
        onValueChange, 
        class: className = '',
        label = 'Clase'
    }: Props = $props();


    const classes: SelectItem[] = [
        { value : '', label: 'Todas' },
        ...LDS_CLASSES.map( c => ({ value: c.slug, label: c.label }) ),
        { value : 'service',        label: 'Servicio' },
        { value : 'family-home',    label: 'Noche de Hogar' },
        { value : 'show',           label: 'Show' },
        { value : 'event',          label: 'Evento' },
        { value : 'meeting',        label: 'Reunión' },
        { value : 'other',          label: 'Otro' },
    ];
</script>


<Select 
    { label }
    items           = { classes }
    bind:value      = { value }
    onValueChange   = { onValueChange }
    placeholder     = "Selecciona clase"
    class           = { className }
/>
