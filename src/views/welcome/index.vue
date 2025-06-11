<script setup lang="ts">
import { ref } from "vue";
import AreaSelect from "@/components/AreaSelect/index.vue";

defineOptions({
  name: "Welcome"
});
const areaSelectRef = ref();

// 手动刷新地区数据
const refreshArea = () => {
  areaSelectRef.value?.refreshAreaData();
};
</script>

<template>
  <div class="app-container">
    <AreaSelect ref="areaSelectRef" />
  </div>
</template>

<style scoped>
.app-container {
  padding: 0;
  display: flex;
  justify-content: flex-start;
}

:deep(.el-tree) {
  min-width: 200px !important;
  width: auto;
  border-right: 1px solid #e4e7ed;
  padding: 10px;
  height: calc(100vh - 80px);
  overflow-y: auto;
}
</style>
