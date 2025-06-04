<script setup lang='ts'>
import AreaSelect from "@/components/AreaSelect/index.vue";

defineOptions({
  name: "userManager"
});
</script>

<template>
  <div class="customer-user-container">
    <div class="sidebar">
      <AreaSelect />
    </div>
    <div class="content">
      <div class="main-content">
        <h2>用户管理</h2>
        <p>这里是用户管理的主要内容区域</p>
        <!-- 其他内容 -->
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.customer-user-container {
  display: flex;
  height: calc(100vh - 80px);
  
  .sidebar {
    width: 300px;
    border-right: 1px solid #e4e7ed;
    padding: 10px;
    overflow-y: auto;
    background-color: #fafafa;
  }
  
  .content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    
    .main-content {
      h2 {
        margin-bottom: 20px;
        color: #303133;
      }
    }
  }
}

// 覆盖 AreaSelect 组件内部的样式
:deep(.area-tree) {
  background-color: transparent;
}

</style>