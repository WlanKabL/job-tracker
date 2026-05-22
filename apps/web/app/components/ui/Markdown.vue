<script setup lang="ts">
import { marked } from "marked";

interface Props {
    source: string;
}

const props = defineProps<Props>();

marked.setOptions({ gfm: true, breaks: true });

const html = computed(() => (props.source ? marked.parse(props.source) as string : ""));
</script>

<template>
    <article
        v-if="source"
        class="prose prose-sm max-w-none text-jt-fg prose-headings:text-jt-fg prose-strong:text-jt-fg prose-a:text-jt-brand prose-code:text-jt-fg prose-code:rounded prose-code:bg-jt-surface prose-code:px-1 prose-code:py-0.5 prose-li:my-0 prose-p:my-2 prose-pre:bg-jt-surface prose-pre:border prose-pre:border-jt-line"
        v-html="html"
    />
    <p v-else class="text-sm italic text-jt-fg-faint">—</p>
</template>
