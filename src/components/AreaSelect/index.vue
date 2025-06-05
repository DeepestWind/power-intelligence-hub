<template>
  <el-tree
    class="area-tree"
    :data="areaData"
    :props="defaultProps"
    :default-expand-all="false"
    :expand-on-click-node="true"
    @node-click="handleNodeClick"
  />
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useAreaStore } from "@/store/modules/area";
import type { AreaNode } from "@/utils/area";

// 使用 area store
const areaStore = useAreaStore();

// 计算属性获取区域数据
const areaData = computed(() => areaStore.getCurrentAreaData);

const handleNodeClick = (data: AreaNode) => {
  areaStore.setSelectedArea(data);
};

const defaultProps = {
  children: "children",
  label: "label"
};

// 模拟从登录接口获取用户类型数据
onMounted(() => {
  // 这里应该从用户登录状态或API获取真实的用户类型数据
  // 现在先用模拟数据测试
  // 示例1: 省级用户 - 显示某个省的所有数据
  //areaStore.setUserType({ type: 'province', code: '010000' }); // 北京市
  // 示例2: 市级用户 - 显示某个市及其父省
  // areaStore.setUserType({ type: 'city', code: '010100' }); // 北京市区
  // 示例3: 区级用户 - 显示某个区及其父级
  // areaStore.setUserType({ type: "district", code: "330101" }); // 东城区
  areaStore.loadAreaData();
});
</script>

<style scoped>
.area-tree {
  width: 100%;
  max-width: none;
}
</style>
