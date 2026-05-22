<script setup lang="ts">
interface Props {
    open: boolean;
    title?: string;
    size?: "sm" | "md" | "lg" | "xl";
    closeOnBackdrop?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    size: "md",
    closeOnBackdrop: true,
});

const emit = defineEmits<{ close: [] }>();

const sizeClasses: Record<NonNullable<Props["size"]>, string> = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
};

const onKeydown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && props.open) emit("close");
};

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));

const onBackdrop = () => {
    if (props.closeOnBackdrop) emit("close");
};
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-150"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="open"
                class="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 overflow-y-auto"
                @click.self="onBackdrop"
            >
                <Transition
                    enter-active-class="transition duration-150 ease-out"
                    enter-from-class="opacity-0 scale-95 translate-y-2"
                    enter-to-class="opacity-100 scale-100 translate-y-0"
                >
                    <div
                        v-if="open"
                        :class="[
                            'mt-12 w-full rounded-xl border border-jt-line bg-jt-base shadow-2xl',
                            sizeClasses[size],
                        ]"
                        role="dialog"
                        aria-modal="true"
                    >
                        <header
                            v-if="title || $slots.header"
                            class="flex items-center justify-between gap-3 border-b border-jt-line-faint px-5 py-3"
                        >
                            <slot name="header">
                                <h2 class="text-base font-semibold text-jt-fg">{{ title }}</h2>
                            </slot>
                            <button
                                type="button"
                                class="rounded p-1 text-jt-fg-muted hover:bg-jt-surface-hover hover:text-jt-fg"
                                aria-label="Schließen"
                                @click="emit('close')"
                            >
                                <Icon name="i-lucide-x" class="h-4 w-4" />
                            </button>
                        </header>
                        <div class="p-5">
                            <slot />
                        </div>
                        <footer
                            v-if="$slots.footer"
                            class="flex items-center justify-end gap-2 border-t border-jt-line-faint bg-jt-surface px-5 py-3"
                        >
                            <slot name="footer" />
                        </footer>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
