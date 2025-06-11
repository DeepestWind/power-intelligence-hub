<script setup lang="ts">
import { ref } from "vue";
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";

defineOptions({
  name: "Welcome"
});

const areaSelectRef = ref();
const selectedAreaInfo = ref<AreaNode | null>(null);

// 手动刷新地区数据
const refreshArea = () => {
  areaSelectRef.value?.refreshAreaData();
};

// 处理区域搜索事件
const handleAreaSearch = (area: AreaNode) => {
  selectedAreaInfo.value = area;
  console.log('接收到区域搜索事件:', area);
};

// 获取区域级别文本
const getAreaLevelText = (code: string) => {
  if (code.endsWith('0000')) {
    return '省级';
  } else if (code.endsWith('00')) {
    return '市级';
  } else {
    return '区/县级';
  }
};

// 获取区域级别标签类型
const getAreaLevelType = (code: string) => {
  if (code.endsWith('0000')) {
    return 'danger';  // 省级 - 红色
  } else if (code.endsWith('00')) {
    return 'warning'; // 市级 - 橙色
  } else {
    return 'success'; // 区/县级 - 绿色
  }
};
</script>

<template>
  <div class="app-container">
    <!-- 左侧区域选择器 -->
    <div class="area-select-panel">
      <AreaSelect 
        ref="areaSelectRef" 
        @area-search="handleAreaSearch"
      />
    </div>
    
    <!-- 右侧显示选中区域信息 -->
    <div class="content-panel">
      <el-card class="selected-info-card">
        <template #header>
          <div class="card-header">
            <span>选中区域信息</span>
            <el-button type="primary" size="small" @click="refreshArea">
              刷新数据
            </el-button>
          </div>
        </template>
        
        <div v-if="selectedAreaInfo" class="area-info">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="区域名称">
              <el-tag type="primary" size="large">
                {{ selectedAreaInfo.label }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="区域代码">
              <el-tag type="info">
                {{ selectedAreaInfo.code }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="区域级别">
              <el-tag :type="getAreaLevelType(selectedAreaInfo.code)">
                {{ getAreaLevelText(selectedAreaInfo.code) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="子区域数量">
              <el-badge :value="selectedAreaInfo.children?.length || 0" type="success">
                <span>个子区域</span>
              </el-badge>
            </el-descriptions-item>
          </el-descriptions>
          
          <!-- 显示子区域列表 -->
          <div v-if="selectedAreaInfo.children && selectedAreaInfo.children.length > 0" class="children-list">
            <h4>子区域列表：</h4>
            <div class="children-tags">
              <el-tag 
                v-for="child in selectedAreaInfo.children" 
                :key="child.code"
                class="child-tag"
                type="success"
                size="small"
              >
                {{ child.label }}
              </el-tag>
            </div>
          </div>
          
          <!-- 模拟搜索结果 -->
          <div class="search-simulation">
            <h4>模拟搜索结果：</h4>
            <el-alert
              :title="`正在搜索 '${selectedAreaInfo.label}' 区域内的所有设备...`"
              type="info"
              :closable="false"
              show-icon
            />
            <div class="mock-results">
              <p>📍 搜索范围：{{ selectedAreaInfo.label }}</p>
              <p>🔍 搜索类型：设备、用户、物料</p>
              <p>⏰ 搜索时间：{{ new Date().toLocaleString() }}</p>
            </div>
          </div>
        </div>
        
        <div v-else class="no-selection">
          <el-empty description="请在左侧选择一个区域" />
        </div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  padding: 0;
  display: flex;
  height: calc(100vh - 80px);
}

.area-select-panel {
  width: 300px;
  border-right: 1px solid #e4e7ed;
  background-color: #fff;
}

.content-panel {
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

.selected-info-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    span {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }
  }
}

.area-info {
  .children-list {
    margin-top: 20px;
    
    h4 {
      margin-bottom: 10px;
      color: #606266;
      font-size: 14px;
    }
    
    .children-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .child-tag {
        margin: 0;
      }
    }
  }
  
  .search-simulation {
    margin-top: 20px;
    
    h4 {
      margin-bottom: 10px;
      color: #606266;
      font-size: 14px;
    }
    
    .mock-results {
      margin-top: 15px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 6px;
      border-left: 4px solid #409eff;
      
      p {
        margin: 8px 0;
        font-size: 14px;
        color: #606266;
        
        &:first-child {
          margin-top: 0;
        }
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

.no-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

/* 深度样式调整 */
:deep(.el-tree) {
  border-right: none;
}
</style>