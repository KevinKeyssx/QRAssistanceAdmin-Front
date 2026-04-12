<script lang="ts">
    import { 
        createMutation, 
        useQueryClient 
    }                     from '@tanstack/svelte-query';
    import { toast }      from 'svelte-sonner';
    import Dialog         from '$lib/components/shared/Dialog.svelte';
    import { 
        LDS_CLASSES 
    }                     from '$lib/utils/classes';
    import type { 
        Member 
    }                     from '$lib/models/member/member.model';
    import connectRequest, { 
        isApiError 
    }                     from '$lib/services/fetch.service';
    import { METHOD }     from '$lib/services/http-codes';

    // ─── Props ────────────────────────────────────────────────────────────────
    let { open, member, onClose }: {
        open    : boolean;
        member  : Member | null; // null significa modo creación
        onClose : () => void;
    } = $props();

    const queryClient = useQueryClient();

    // ─── Estado local ─────────────────────────────────────────────────────────
    let name            = $state( '' );
    let last_name       = $state( '' );
    let selectedClasses = $state<string[]>( [] );
    let saveFinger      = $state( false );

    // Modo
    const isEdit = $derived( !!member );

    $effect( () => {
        if ( open ) {
            if ( member ) {
                name            = member.name;
                last_name       = member.last_name;
                selectedClasses = [ ...member.classes ];
                saveFinger      = member.saveFinger;
            } else {
                name            = '';
                last_name       = '';
                selectedClasses = [];
                saveFinger      = false;
            }
        }
    });

    // ─── Lógica de Clases ─────────────────────────────────────────────────────
    const compatibleClasses = $derived.by( () => {
        if ( selectedClasses.length === 0 ) return null;
        const firstClass = LDS_CLASSES.find( c => c.slug === selectedClasses[ 0 ] );
        return firstClass ? firstClass.classCompatible : null;
    });

    function toggleClass( slug: string ): void {
        if ( selectedClasses.includes( slug ) ) {
            selectedClasses = selectedClasses.filter( s => s !== slug );
        } else if ( selectedClasses.length === 0 ) {
            selectedClasses = [ slug ];
        } else if ( selectedClasses.length === 1 ) {
            if ( compatibleClasses && compatibleClasses.includes( slug ) ) {
                selectedClasses = [ ...selectedClasses, slug ];
            } else {
                // Si no es compatible, reemplazamos la anterior (opcional, el usuario pidió deshabilitar)
                // Pero el toggleClass del usuario previene la selección si no es compatible.
            }
        }
    }

    function isClassDisabled( slug: string ): boolean {
        if ( selectedClasses.includes( slug ) ) return false;
        if ( selectedClasses.length === 0 ) return false;
        if ( selectedClasses.length === 2 ) return true;
        
        // Si hay una seleccionada, solo habilitar las compatibles
        return !compatibleClasses?.includes( slug );
    }

    // ─── Mutaciones ───────────────────────────────────────────────────────────
    const mutation = createMutation( () => ({
        mutationFn: async () => {
            const body = {
                name,
                last_name,
                classes: selectedClasses,
                saveFinger
            };

            const result = await connectRequest<Member>({
                endpoint: isEdit ? `members/update?id=${ member?._id }` : 'members/create',
                method: isEdit ? METHOD.PUT : METHOD.POST,
                isInternal: true,
                body
            });

            if ( isApiError( result ) ) throw result;
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [ 'members' ] });
            toast.success( isEdit ? 'Miembro actualizado correctamente' : 'Miembro creado correctamente' );
            onClose();
        },
        onError: ( error ) => {
            toast.error( String( error ) );
        }
    }));

    function handleSubmit() {
        if ( !name.trim() || !last_name.trim() || selectedClasses.length === 0 ) {
            toast.error( 'Por favor completa todos los campos requeridos.' );
            return;
        }
        mutation.mutate();
    }
</script>

<!-- ─── Dialog: Crear / Editar Miembro ────────────────────────────────────── -->
<Dialog
    open        = { open }
    title       = { isEdit ? 'Actualizar miembro' : 'Agregar nuevo miembro' }
    description = { isEdit ? 'Modifica los datos del miembro y guarda los cambios.' : 'Ingresa los datos del nuevo miembro para registrarlo en el sistema.' }
    onClose     = { onClose }
>
    <div class="flex flex-col gap-6">
        <!-- Campos de Texto -->
        <div class="grid grid-cols-2 gap-4">
            <div>
                <label for="member-name" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Nombre <span class="text-red-500">*</span>
                </label>

                <input
                    id          = "member-name"
                    type        = "text"
                    bind:value={ name }
                    placeholder = "Ej: Juan"
                    class       = "w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all
                        bg-gray-50 dark:bg-gray-700/60 text-gray-900 dark:text-white
                        border-2 border-gray-200 dark:border-gray-600
                        focus:border-lds-navy dark:focus:border-lds-gold"
                />
            </div>

            <div>
                <label for="member-lastname" class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Apellido <span class="text-red-500">*</span>
                </label>

                <input
                    id          = "member-lastname"
                    type        = "text"
                    bind:value={ last_name }
                    placeholder = "Ej: Pérez"
                    class       = "w-full px-4 py-3 rounded-xl text-sm font-medium outline-none transition-all
                        bg-gray-50 dark:bg-gray-700/60 text-gray-900 dark:text-white
                        border-2 border-gray-200 dark:border-gray-600
                        focus:border-lds-navy dark:focus:border-lds-gold"
                />
            </div>
        </div>

        <!-- Selección de Clases -->
        <div>
            <div class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3 flex justify-between">
                <div>
                    Selección de Clases <span class="text-red-500">*</span>
                </div>

                <span class="bg-lds-navy dark:bg-lds-gold text-white px-2 py-1 rounded-full normal-case font-normal text-xs items-center">
                    Máximo 2 clases
                </span>
            </div>

            <div class="grid grid-cols-2 gap-2">
                {#each LDS_CLASSES as cls ( cls.slug )}
                    {@const isActive   = selectedClasses.includes( cls.slug )}
                    {@const isDisabled = isClassDisabled( cls.slug )}
                    {@const Icon       = cls.icon}

                    <button
                        onclick  = { () => toggleClass( cls.slug ) }
                        disabled = { isDisabled && !isActive }
                        class    = "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                            { isActive 
                                ? 'bg-lds-navy/5 border-lds-navy dark:bg-lds-gold/5 dark:border-lds-gold' 
                                : 'bg-transparent border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600' }
                            { isDisabled && !isActive ? 'opacity-30 cursor-not-allowed grayscale' : 'cursor-pointer active:scale-[0.98]' }"
                    >
                        <div class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 { isActive ? 'text-lds-navy dark:text-lds-gold' : 'text-gray-400' }">
                            <Icon />
                        </div>

                        <span class="text-xs font-bold { isActive ? 'text-lds-navy dark:text-lds-gold' : 'text-gray-600 dark:text-gray-400 text-pretty' } leading-tight uppercase">
                            { cls.label }
                        </span>
                    </button>
                {/each}
            </div>
        </div>

        <!-- Opciones adicionales -->
        <div class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl border border-gray-200 dark:border-gray-600">
            <input
                id      = "member-savefinger"
                type    = "checkbox"
                bind:checked={ saveFinger }
                class   = "w-5 h-5 accent-lds-navy dark:accent-lds-gold cursor-pointer"
            />

            <label for="member-savefinger" class="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                Huella digital ya registrada
            </label>
        </div>

        <!-- Botones de Acción -->
        <div class="flex gap-3 justify-end mt-2">
            <button
                onclick = { onClose }
                class   = "px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300
                    bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                    transition-all active:scale-95"
            >
                Cancelar
            </button>

            <button
                id       = "confirm-member-action"
                onclick  = { handleSubmit }
                disabled = { mutation.isPending }
                class    = "px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm
                    bg-lds-navy dark:bg-lds-gold text-white dark:text-gray-900
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:opacity-90 transition-all active:scale-95"
            >
                { mutation.isPending ? 'Guardando...' : ( isEdit ? 'Actualizar Miembro' : 'Registrar Miembro' ) }
            </button>
        </div>
    </div>
</Dialog>
