<script setup lang="ts">
useTheme();

const applicationsStore = useApplicationsStore();
const companiesStore = useCompaniesStore();
const settingsStore = useSettingsStore();

if (!applicationsStore.loaded) await applicationsStore.fetchAll();
if (!companiesStore.loaded) await companiesStore.fetchAll();
if (!settingsStore.data) await settingsStore.fetch();

const drawerOpen = ref(false);
const route = useRoute();

watch(
    () => route.path,
    () => {
        drawerOpen.value = false;
    },
);
</script>

<template>
    <div class="flex min-h-screen bg-jt-base text-jt-fg">
        <aside
            class="sticky top-0 hidden h-screen w-64 shrink-0 self-start overflow-y-auto border-r border-jt-line bg-jt-base md:flex md:flex-col"
        >
            <LayoutSidebar />
        </aside>

        <Transition
            enter-active-class="transition duration-150"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition duration-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                v-if="drawerOpen"
                class="fixed inset-0 z-40 bg-black/60 md:hidden"
                @click="drawerOpen = false"
            />
        </Transition>
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="-translate-x-full"
            enter-to-class="translate-x-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="translate-x-0"
            leave-to-class="-translate-x-full"
        >
            <aside
                v-if="drawerOpen"
                class="fixed inset-y-0 left-0 z-50 w-64 border-r border-jt-line bg-jt-base shadow-xl md:hidden"
            >
                <LayoutSidebar @navigate="drawerOpen = false" />
            </aside>
        </Transition>

        <div class="flex min-w-0 flex-1 flex-col">
            <LayoutTopBar @open-sidebar="drawerOpen = true" />
            <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                <slot />
            </main>
        </div>

        <UiToastHost />
        <UiConfirmDialog />
    </div>
</template>
