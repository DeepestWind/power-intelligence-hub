<script setup lang='ts'>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { View, Edit, Search, RefreshRight } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import { usePageSearch } from "@/utils/useAreaFilter";

// 导入API方法和类型
import { 
  getMaintainRecordList as getMaintainRecordListApi,
  type MaintainRecordData,
  type MaintainRecordQueryParams
} from '@/api/maintain';

// ==================== 响应式数据 ====================

// 表格数据
const loading = ref(false);
const tableData = ref<MaintainRecordData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 时间范围
const timeRange = ref<[string, string] | null>(null);

// 使用通用的搜索和区域过滤工具
const {
  areaFilter,
  searchForm,
  handleAreaSearch,
  handleSearch,
  handleReset,
  handleClearAll
} = usePageSearch(
  // 初始搜索数据
  {
    cabinetCode: '',
    cabinetName: '',
    materialName: '',
    maintainName: '',
    startTime: '',
    endTime: ''
  },
  // 搜索回调函数
  () => {
    currentPage.value = 1;
    getMaintainRecordList();
  }
);

// ==================== 方法 ====================

/**
 * 获取维修记录列表
 */
const getMaintainRecordList = async () => {
  loading.value = true;
  try {
    const queryParams: MaintainRecordQueryParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value      
      // cabinetCode: searchForm.value.cabinetCode || undefined,
      // cabinetName: searchForm.value.cabinetName || undefined,
      // materialName: searchForm.value.materialName || undefined,
      // maintainName: searchForm.value.maintainName || undefined,
      // startTime: timeRange.value?.[0] || undefined,
      // endTime: timeRange.value?.[1] || undefined
    };

    const response = await getMaintainRecordListApi(queryParams);
    
    if (response.code === 200) {
      tableData.value = response.data.records;
      total.value = response.data.total || 0;
      console.log('获取维修记录列表成功:', response.data);
    } else {
      ElMessage.error(response.msg || '获取数据失败');
    }
    
  } catch (error) {
    ElMessage.error('获取维修记录列表失败，请检查网络连接');
    console.error('获取维修记录列表错误:', error);
  } finally {
    loading.value = false;
  }
};

/**
 * 处理时间范围变化
 */
const handleTimeRangeChange = (value: [string, string] | null) => {
  timeRange.value = value;
};

/**
 * 格式化日期时间
 */
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-';
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * 刷新列表
 */
const handleRefresh = () => {
  getMaintainRecordList();
};

/**
 * 查看详情
 */
const handleView = (row: MaintainRecordData) => {
  ElMessage.info(`查看维修记录详情: ${row.id}`);
  console.log('查看维修记录:', row);
  // TODO: 实现查看详情功能
};

/**
 * 编辑记录
 */
const handleEdit = (row: MaintainRecordData) => {
  ElMessage.info(`编辑维修记录: ${row.id}`);
  console.log('编辑维修记录:', row);
  // TODO: 实现编辑功能
};

/**
 * 分页大小变化
 */
const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1;
  getMaintainRecordList();
};

/**
 * 当前页变化
 */
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  getMaintainRecordList();
};

// ==================== 生命周期 ====================

onMounted(() => {
  getMaintainRecordList();
});
</script>

<template>
  <div class="maintain-records-container">
    <!-- 左侧区域选择器 -->
    <div>
      <AreaSelect @area-search="handleAreaSearch" />
    </div>
    
    <div class="content">
      <div class="main-content">
        <!-- 搜索区域 -->
        <el-card class="search-card">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <!-- <el-form-item label="柜子编码">
              <el-input
                v-model="searchForm.cabinetCode"
                placeholder="请输入柜子编码"
                clearable
                style="width: 200px"
              />
            </el-form-item> -->
            
            <el-form-item label="柜子名称">
              <el-input
                v-model="searchForm.cabinetName"
                placeholder="请输入柜子名称"
                clearable
                style="width: 200px"
              />
            </el-form-item>
            
            <el-form-item label="物料名称">
              <el-input
                v-model="searchForm.materialName"
                placeholder="请输入物料名称"
                clearable
                style="width: 200px"
              />
            </el-form-item>
            
            <!-- <el-form-item label="维修人员">
              <el-input
                v-model="searchForm.maintainName"
                placeholder="请输入维修人员姓名"
                clearable
                style="width: 200px"
              />
            </el-form-item> -->
            
            <el-form-item label="开始时间">
              <el-date-picker
                v-model="searchForm.startTime"
                type="date"
                placeholder="选择开始时间"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 180px"
              />
            </el-form-item>
            
            <el-form-item label="结束时间">
              <el-date-picker
                v-model="searchForm.endTime"
                type="date"
                placeholder="选择结束时间"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 180px"
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="handleSearch">
                搜索
              </el-button>
              <el-button @click="handleReset">
                重置
              </el-button>
              <el-button @click="handleClearAll">
                清空所有
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 表格区域 -->
        <el-card class="table-card">
          <template #header>
            <div class="card-header">
              <span class="title">维修记录列表</span>
              <div class="header-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="handleRefresh"
                  :loading="loading"
                >
                  刷新
                </el-button>
              </div>
            </div>
          </template>

          <el-table 
            :data="tableData" 
            v-loading="loading"
            style="width: 100%"
            stripe
            border
            empty-text="暂无维修记录"
          >
            <!-- <el-table-column prop="id" label="记录ID" width="80" /> -->
            <el-table-column prop="cabinetCode" label="柜子编号" width="120" />
            <el-table-column prop="cabinetName" label="柜子名称" width="150" show-overflow-tooltip />
            <el-table-column prop="materialCode" label="物料编号" width="120" />
            <el-table-column prop="materialName" label="物料名称" width="150" show-overflow-tooltip />
            <el-table-column prop="maintainName" label="维修人员" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="success" size="small">
                  {{ row.maintainName }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">
                <div class="time-info">
                  <span>{{ formatDateTime(row.createTime) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="更新时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.updatedTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right" align="center">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="View"
                  @click="handleView(row)"
                >
                  查看详情
                </el-button>
                <el-button 
                  type="warning" 
                  size="small" 
                  :icon="Edit"
                  @click="handleEdit(row)"
                >
                  编辑
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.maintain-records-container {
  display: flex;
  height: calc(100vh - 80px);
  
  .content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background-color: #f5f7fa;
    
    .main-content {
      .search-card {
        margin-bottom: 20px;
        
        .search-form {
          .el-form-item {
            margin-bottom: 18px;
            margin-right: 12px;
          }
        }
      }
      
      .table-card {
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .title {
            font-size: 16px;
            font-weight: 500;
            color: #303133;
          }
          
          .header-actions {
            display: flex;
            gap: 10px;
          }
        }
        
        .pagination-container {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }
      }
    }
  }
}

// 表格样式调整
:deep(.el-table) {
  .el-button + .el-button {
    margin-left: 4px;
  }
  
  .time-info {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    
    .el-icon {
      color: #909399;
    }
  }
}
</style>