<script lang="ts">
    import Select, { type SelectItem } from '$lib/components/shared/Select.svelte';


    interface Props {
        value?        : string | string[];
        onValueChange?: ( value: any ) => void;
        class?        : string;
    }


    let {
        value = $bindable(),
        onValueChange,
        class: className = ''
    }: Props = $props();


    function generateYears(): SelectItem[] {
        const initialYear       = 2026;
        const currentYear       = new Date().getFullYear();
        const years: number[]   = Array.from({ length: Math.max( 1, currentYear - initialYear + 1 ) }, (_, i) => initialYear + i);

        return years.map( y => ({ value: String( y ), label: String( y )}));
    }
</script>


<Select 
    label           = "Año"
    items           = { generateYears() }
    bind:value      = { value }
    onValueChange   = { onValueChange }
    placeholder     = "Selecciona año"
    class           = { className }
/>
