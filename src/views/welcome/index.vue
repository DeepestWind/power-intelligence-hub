<script setup lang="ts">
import { ref } from "vue";
import AreaSelect from "@/components/AreaSelect/index.vue";

defineOptions({
  name: "Welcome"
});
</script>

<template>
  <div class="app-container">
      <AreaSelect />
  </div>
</template>

<style scoped>
.app-container {
  padding: 0;
  display: flex;
  justify-content: flex-start;
}

:deep(.el-tree) {
  max-width: 300px !important;
  width: 300px;
  border-right: 1px solid #e4e7ed;
  padding: 10px;
  height: calc(100vh - 80px);
  overflow-y: auto;
}
</style>