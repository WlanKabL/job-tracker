<script setup lang="ts">
const { state, close } = useConfirm();
const t = useT();
</script>

<template>
    <UiModal
        :open="state.open"
        :title="state.title"
        size="sm"
        :close-on-backdrop="false"
        @close="close(false)"
    >
        <p class="text-sm text-jt-fg-soft whitespace-pre-line">{{ state.body }}</p>
        <template #footer>
            <UiButton variant="ghost" @click="close(false)">
                {{ state.cancelLabel ?? t.common.cancel }}
            </UiButton>
            <UiButton
                :variant="state.variant === 'danger' ? 'danger' : 'brand'"
                @click="close(true)"
            >
                {{ state.confirmLabel ?? t.common.confirm }}
            </UiButton>
        </template>
    </UiModal>
</template>
