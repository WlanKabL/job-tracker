<script setup lang="ts">
const { toasts, dismiss } = useToast();

const variantClasses = {
    success: "border-jt-success/30 bg-jt-success-soft text-jt-success",
    error: "border-jt-danger/30 bg-jt-danger-soft text-jt-danger",
    info: "border-jt-info/30 bg-jt-info-soft text-jt-info",
} as const;

const iconByType = {
    success: "i-lucide-check-circle-2",
    error: "i-lucide-alert-circle",
    info: "i-lucide-info",
} as const;
</script>

<template>
    <Teleport to="body">
        <div class="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
            <TransitionGroup
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 translate-x-4"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0 translate-x-4"
            >
                <div
                    v-for="toast in toasts"
                    :key="toast.id"
                    :class="[
                        'pointer-events-auto flex items-start gap-3 rounded-md border px-3 py-2 text-sm shadow-lg backdrop-blur-md',
                        variantClasses[toast.type],
                    ]"
                >
                    <Icon :name="iconByType[toast.type]" class="mt-0.5 h-4 w-4 shrink-0" />
                    <span class="flex-1">{{ toast.message }}</span>
                    <button
                        type="button"
                        class="-mr-1 rounded p-1 hover:bg-black/10"
                        aria-label="Schließen"
                        @click="dismiss(toast.id)"
                    >
                        <Icon name="i-lucide-x" class="h-3 w-3" />
                    </button>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>
