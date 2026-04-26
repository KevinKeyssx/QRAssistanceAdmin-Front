<script lang="ts">
    import { DatePicker }       from "bits-ui";
    import { type DateValue }   from "@internationalized/date";


    interface Props {
        value?          : DateValue | any;
        fixedWeeks?     : boolean;
        class?          : string;
        placeholder?    : DateValue;
        minValue?       : DateValue;
        maxValue?       : DateValue;
        onValueChange?  : ( value: DateValue | undefined ) => void;
    }


    let {
        value       = $bindable(),
        fixedWeeks  = true,
        class: className = '',
        minValue,
        maxValue,
        ...rest
    }: Props = $props();
</script>

<div class={className}>
    <DatePicker.Root
        weekdayFormat="short"
        locale="es-ES"
        {fixedWeeks}
        {minValue}
        {maxValue}
        bind:value
        {...rest as any}
    >
        <DatePicker.Input
            class="flex h-[42px] w-full min-w-[150px] items-center rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 transition-all focus-within:ring-2 focus-within:ring-lds-navy dark:focus-within:ring-lds-gold focus-within:border-lds-navy dark:focus-within:border-lds-gold shadow-sm outline-none"
        >
            {#snippet children({ segments })}
                <div class="flex-1 flex gap-px items-center">
                    {#each segments as { part, value }, i (part + i)}
                        <div class="inline-block select-none">
                            {#if part === "literal"}
                                <DatePicker.Segment {part} class="text-gray-400 dark:text-gray-500 p-px">
                                    {value}
                                </DatePicker.Segment>
                            {:else}
                                <DatePicker.Segment
                                    {part}
                                    class="rounded-[5px] px-1 py-0.5 hover:bg-gray-200 dark:hover:bg-gray-800 focus:bg-gray-200 dark:focus:bg-gray-800 focus:text-lds-navy dark:focus:text-lds-gold aria-[valuetext=Empty]:text-gray-400 dark:aria-[valuetext=Empty]:text-gray-500 focus-visible:ring-0 focus-visible:outline-none transition-colors"
                                >
                                    {value}
                                </DatePicker.Segment>
                            {/if}
                        </div>
                    {/each}
                </div>
                <DatePicker.Trigger class="text-gray-500 hover:text-lds-navy dark:text-gray-400 dark:hover:text-lds-gold transition-colors ml-2 p-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 outline-none">
                    <svg class="size-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </DatePicker.Trigger>
            {/snippet}
        </DatePicker.Input>

        <DatePicker.Portal>
            <DatePicker.Content sideOffset={6} class="z-50">
                <DatePicker.Calendar class="bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 w-fit">
                    {#snippet children({ months, weekdays })}
                        <DatePicker.Header class="flex items-center justify-between mb-4">
                            <DatePicker.PrevButton
                                class="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 inline-flex size-9 items-center justify-center transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-lds-navy dark:focus-visible:ring-lds-gold"
                            >
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                                </svg>
                            </DatePicker.PrevButton>

                            <DatePicker.Heading class="text-[15px] font-bold text-gray-900 dark:text-white capitalize" />

                            <DatePicker.NextButton
                                class="rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 inline-flex size-9 items-center justify-center transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-lds-navy dark:focus-visible:ring-lds-gold"
                            >
                                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </DatePicker.NextButton>
                        </DatePicker.Header>

                        <div class="flex flex-col space-y-4 pt-1 sm:flex-row sm:space-x-4 sm:space-y-0">
                            {#each months as month, i (i)}
                                <DatePicker.Grid class="w-full border-collapse select-none space-y-1">
                                    <DatePicker.GridHead>
                                        <DatePicker.GridRow class="mb-2 flex w-full justify-between">
                                            {#each weekdays as day, i (i)}
                                                <DatePicker.HeadCell
                                                    class="text-gray-500 dark:text-gray-400 font-semibold w-9 rounded-md text-[11px] uppercase tracking-wider"
                                                >
                                                    <div>{day.slice(0, 2)}</div>
                                                </DatePicker.HeadCell>
                                            {/each}
                                        </DatePicker.GridRow>
                                    </DatePicker.GridHead>
                                    <DatePicker.GridBody>
                                        {#each month.weeks as weekDates, i (i)}
                                            <DatePicker.GridRow class="flex w-full mt-1">
                                                {#each weekDates as date, i (i)}
                                                    <DatePicker.Cell {date} month={month.value} class="p-0 relative size-9 text-center text-sm">
                                                        <DatePicker.Day
                                                            class="rounded-lg text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700
                                                                   data-selected:bg-lds-navy dark:data-selected:bg-lds-gold data-selected:text-white dark:data-selected:text-gray-900 data-selected:hover:bg-lds-navy/90 dark:data-selected:hover:bg-lds-gold/90
                                                                   data-disabled:text-gray-400 dark:data-disabled:text-gray-600 data-disabled:pointer-events-none
                                                                   data-unavailable:text-gray-400 dark:data-unavailable:text-gray-600 data-unavailable:line-through
                                                                   data-outside-month:text-gray-400 dark:data-outside-month:text-gray-500 data-outside-month:pointer-events-none
                                                                   group relative inline-flex size-9 items-center justify-center whitespace-nowrap bg-transparent p-0 text-sm font-medium transition-all active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-lds-navy dark:focus-visible:ring-lds-gold"
                                                        >
                                                            <div class="bg-lds-navy dark:bg-lds-gold group-data-selected:bg-white group-data-today:block absolute bottom-[3px] hidden size-1 rounded-full"></div>
                                                            {date.day}
                                                        </DatePicker.Day>
                                                    </DatePicker.Cell>
                                                {/each}
                                            </DatePicker.GridRow>
                                        {/each}
                                    </DatePicker.GridBody>
                                </DatePicker.Grid>
                            {/each}
                        </div>
                    {/snippet}
                </DatePicker.Calendar>
            </DatePicker.Content>
        </DatePicker.Portal>
    </DatePicker.Root>
</div>
