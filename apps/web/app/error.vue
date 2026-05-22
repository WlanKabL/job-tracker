<script setup lang="ts">
import { t } from "~/i18n/de";

interface ErrorPayload {
    statusCode: number;
    statusMessage?: string;
    message?: string;
}

const props = defineProps<{ error: ErrorPayload }>();

const goHome = () => clearError({ redirect: "/" });
</script>

<template>
    <div class="flex min-h-screen flex-col items-center justify-center bg-jt-base p-6 text-jt-fg">
        <div class="max-w-md text-center">
            <div class="mb-4 font-mono text-7xl font-bold text-jt-brand">
                {{ props.error.statusCode }}
            </div>
            <h1 class="mb-2 text-2xl font-semibold">
                {{ props.error.statusMessage ?? t.errors.title }}
            </h1>
            <p class="mb-6 text-jt-fg-muted">
                {{ props.error.message ?? t.errors.description }}
            </p>
            <button
                type="button"
                class="rounded-md bg-jt-brand px-4 py-2 text-jt-brand-text transition hover:bg-jt-brand-hover"
                @click="goHome"
            >
                {{ t.errors.backHome }}
            </button>
        </div>
    </div>
</template>
