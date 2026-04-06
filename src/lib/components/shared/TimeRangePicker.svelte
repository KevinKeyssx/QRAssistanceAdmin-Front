<script lang="ts">
    import { TimeRangeField } from "bits-ui";
    import type { TimeValue } from "bits-ui";

    interface TimeRange {
        start: TimeValue | undefined;
        end: TimeValue | undefined;
    }

    interface Props {
        value?          : TimeRange | any;
        class?          : string;
        placeholder?    : TimeValue;
        name?           : string;
        required?       : boolean;
        disabled?       : boolean;
    }

    let {
        value       = $bindable(),
        class: className = '',
        ...rest
    }: Props = $props();
</script>

<div class={className}>
    <TimeRangeField.Root
        bind:value
        locale="es-ES"
        class="group flex w-full flex-col gap-1.5"
        {...rest as any}
    >
        <div class="flex h-[42px] w-full min-w-[240px] items-center rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 transition-all focus-within:ring-2 focus-within:ring-lds-navy dark:focus-within:ring-lds-gold focus-within:border-lds-navy dark:focus-within:border-lds-gold shadow-sm outline-none">
            {#each ["start", "end"] as const as type (type)}
                <TimeRangeField.Input {type} class="flex items-center outline-none">
                    {#snippet children({ segments })}
                        <div class="flex gap-px items-center">
                            {#each segments as { part, value }, i (part + i)}
                                <div class="inline-block select-none">
                                    {#if part === "literal"}
                                        <TimeRangeField.Segment {part} class="text-gray-400 dark:text-gray-500 p-px">
                                            {value}
                                        </TimeRangeField.Segment>
                                    {:else}
                                        <TimeRangeField.Segment
                                            {part}
                                            class="rounded-[5px] px-1 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-800 focus:bg-gray-200 dark:focus:bg-gray-800 focus:text-lds-navy dark:focus:text-lds-gold aria-[valuetext=Empty]:text-gray-400 dark:aria-[valuetext=Empty]:text-gray-500 focus-visible:ring-0 focus-visible:outline-none transition-colors"
                                        >
                                            {value}
                                        </TimeRangeField.Segment>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/snippet}
                </TimeRangeField.Input>
                {#if type === "start"}
                    <div aria-hidden="true" class="text-gray-400 dark:text-gray-500 px-3 font-medium">
                        —
                    </div>
                {/if}
            {/each}
            
            <div class="text-gray-500 dark:text-gray-400 ml-auto p-[2px]">
                <svg class="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
        </div>
    </TimeRangeField.Root>
</div>
