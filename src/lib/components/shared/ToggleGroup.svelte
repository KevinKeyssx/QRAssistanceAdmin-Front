<script lang="ts">
    import { ToggleGroup } from "bits-ui";

    interface Option {
        label: string;
        value: string;
    }

    interface Props {
        value?      : string;
        options     : Option[] | string[];
        class?      : string;
        disabled?   : boolean;
        name?       : string;
    }

    let {
        value = $bindable(),
        options = [],
        class: className = '',
        disabled = false,
        ...rest
    }: Props = $props();

    // Helper to normalize options to array of objects
    let normalizedOptions = $derived(
        options.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt)
    );
</script>

<div class={className}>
    <ToggleGroup.Root
        bind:value
        type="single"
        {disabled}
        class="inline-flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm"
        {...rest}
    >
        {#each normalizedOptions as option}
            <ToggleGroup.Item 
                value={option.value}
                class="px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 bg-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lds-navy focus-visible:ring-offset-2 focus-visible:ring-offset-gray-100 dark:focus-visible:ring-lds-gold dark:focus-visible:ring-offset-gray-800 data-[state=on]:bg-lds-navy dark:data-[state=on]:bg-lds-gold data-[state=on]:text-white dark:data-[state=on]:text-white data-[state=on]:shadow-sm active:scale-95"
            >
                {option.label}
            </ToggleGroup.Item>
        {/each}
    </ToggleGroup.Root>
</div>
