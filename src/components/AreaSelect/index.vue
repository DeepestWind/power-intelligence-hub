<template>
  <el-tree
    class="area-tree"
    :data="areaData"
    :props="defaultProps"
    :default-expand-all="false"
    :expand-on-click-node="true"
    @node-click="handleNodeClick"
    v-loading="loading"
    element-loading-text="加载地区数据..."
  />
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from "vue";
import { useAreaStore } from "@/store/modules/area";
import { getAreaDataByUserType, transformPcaToTree } from "@/utils/area";
import type { AreaNode } from "@/utils/area";
import { ElMessage } from 'element-plus';

// 使用 area store
const areaStore = useAreaStore();
const loading = ref(false);

// 计算属性获取区域数据
const areaData = computed(() => areaStore.getCurrentAreaData);

// 获取用户权限信息
const userAreaType = computed(() => areaStore.getCurrentAreaType);
const userAreaCode = computed(() => areaStore.getCurrentAreaCode);

const handleNodeClick = (data: AreaNode) => {
  areaStore.setSelectedArea(data);
  console.log('选中的地区:', data);
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
  const areatype = areaStore.getCurrentAreaType;
  const areacode = areaStore.getCurrentAreaCode;
console.log(areacode);
  areaStore.loadAreaData(areatype,areacode);
});
// 初始化地区数据
const initAreaData = async () => {
  try {
    loading.value = true;
    
    const areaType = userAreaType.value;
    const areaCode = userAreaCode.value;
    
    console.log('用户权限信息:', { areaType, areaCode });
    
    // 检查用户权限信息是否有效
    if (!areaType || !areaCode) {
      console.warn('用户权限信息不完整，使用默认地区数据');
      // 如果没有权限信息，可能需要重新登录或使用默认数据
      const defaultAreaData = transformPcaToTree();
      areaStore.setAreaData(defaultAreaData.slice(0, 5)); // 只显示前5个省份作为示例
      return;
    }

    // 使用 store 中的 loadAreaData 方法
    areaStore.loadAreaData(areaType, areaCode);

    // 检查是否成功加载了数据
    if (areaStore.hasAreaData) {
      // 如果有权限数据，默认展开第一个节点
      const currentData = areaStore.getCurrentAreaData;
      if (currentData && currentData.length > 0) {
        areaStore.setSelectedArea(currentData[0]);
      }
      console.log('成功加载用户地区数据');
    } else {
      console.warn('未找到用户权限对应的地区数据');
      ElMessage.warning('未找到您的权限范围内的地区数据');
    }
    
  } catch (error) {
    console.error('初始化地区数据失败:', error);
    ElMessage.error('加载地区数据失败，请刷新页面重试');
    
    // 出错时使用空数据
    areaStore.setAreaData([]);
  } finally {
    loading.value = false;
  }
};

// 监听用户权限变化，重新加载地区数据
watch([userAreaType, userAreaCode], ([newType, newCode], [oldType, oldCode]) => {
  if (newType !== oldType || newCode !== oldCode) {
    console.log('用户权限发生变化，重新加载地区数据');
    initAreaData();
  }
}, { immediate: false });

// 组件挂载时初始化
onMounted(async () => {
  console.log('AreaSelect 组件挂载，开始初始化地区数据');
  await initAreaData();
});
// 提供给父组件调用的方法
defineExpose({
  refreshAreaData: initAreaData
});
</script>

<style scoped>
.area-tree {
  min-width: 200px !important;
  width: auto;
  border-right: 1px solid #e4e7ed;
  padding: 10px;
  height: calc(100vh - 80px);
  overflow-y: auto;
  background-color: #fff;
}

/* 加载状态样式 */
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
}

/* 树节点样式优化 */
:deep(.el-tree-node__content) {
  padding: 8px 0;
  font-size: 14px;
}

:deep(.el-tree-node__content:hover) {
  background-color: #f5f7fa;
}

:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: #e6f7ff;
  color: #1890ff;
  font-weight: 500;
}

/* 空数据提示 */
.area-tree:empty::after {
  content: "暂无地区数据";
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  color: #999;
  font-size: 14px;
}
</style>