<script setup lang='ts'>
// 超时记录
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { View, Clock, Warning } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";
import { useAreaStore } from "@/store/modules/area";
import { usePageSearch } from "@/utils/useAreaFilter";

// 🔥 新增：导入超时记录 API
import { 
  getOvertimeRecordsList as getOvertimeRecordsListApi,
  exportOvertimeRecords as exportOvertimeRecordsApi,
  calculateOvertimeDuration,
  getOvertimeSeverity,
  formatMaterialStatus,
  formatDateTime,
  validateExportParams,
  getDefaultExportDateRange,
  isOvertime,
  getOvertimeDays,
  type OvertimeRecordData,
  type OvertimeRecordQueryParams,
  type ExportParams
} from '@/api/overtime';

defineOptions({
  name: "OvertimeRecord"
});

// 初始化 areaStore
const areaStore = useAreaStore();


// 响应式数据
const loading = ref(false);
const tableData = ref<OvertimeRecordData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 导出相关的响应式数据
const exportDialogVisible = ref(false);
const exportForm = ref<ExportParams>({
  startDate: '',
  endDate: ''
});
const exportLoading = ref(false);

// 🔥 使用页面搜索工具类
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
    materialCode: '',
    materialName: '',
    operatorName: '',
    materialStatus: undefined as number | undefined,
    lentOutTimeStart: '',
    lentOutTimeEnd: '',
    plannedReturnTimeStart: '',
    plannedReturnTimeEnd: '',
    actualReturnTimeStart: '',
    actualReturnTimeEnd: ''
  },
  // 搜索回调函数
  () => {
    currentPage.value = 1;
    getOvertimeRecordsList();
  }
);


// 🔥 修改：获取超时记录列表（使用 API 方法）
const getOvertimeRecordsList = async () => {
  loading.value = true;
  try {
    // 🔥 使用 API 方法和类型，包含区域筛选
    const params: OvertimeRecordQueryParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value
    };
    
    console.log('超时记录搜索参数:', params);
    
    const response = await getOvertimeRecordsListApi(params);
    
    if (response.code === 200) {
      tableData.value = response.data.records;
      total.value = response.data.total;
      console.log('获取到的超时记录数据:', tableData.value);
    } else {
      ElMessage.error(response.msg || '获取数据失败');
    }
    
  } catch (error) {
    ElMessage.error('获取超时记录列表失败，请检查网络连接');
    console.error('获取超时记录列表错误:', error);
  } finally {
    loading.value = false;
  }
};

// 查看记录详情
const handleView = (row: OvertimeRecordData) => {
  ElMessage.info(`查看超时记录: ${row.materialName}`);
  // 这里可以打开详情弹窗或跳转到详情页
};

// 🔥 新增：导出记录（使用工具函数）
const handleExport = () => {
  // 打开导出弹窗
  exportDialogVisible.value = true;
  
  // 🔥 使用工具函数获取默认日期范围
  exportForm.value = getDefaultExportDateRange();
};

// 🔥 新增：确认导出（使用 API 方法和验证工具函数）
const confirmExport = async () => {
  // 🔥 使用工具函数验证参数
  const validation = validateExportParams(exportForm.value);
  if (!validation.valid) {
    ElMessage.error(validation.message);
    return;
  }
  
  try {
    exportLoading.value = true;
    // 🔥 使用 API 方法导出
    await exportOvertimeRecordsApi(exportForm.value);
    exportDialogVisible.value = false;
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error('导出失败，请稍后重试');
    console.error('导出失败:', error);
  } finally {
    exportLoading.value = false;
  }
};

// 🔥 新增：取消导出
const cancelExport = () => {
  exportDialogVisible.value = false;
  exportForm.value = {
    startDate: '',
    endDate: ''
  };
};

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getOvertimeRecordsList();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  getOvertimeRecordsList();
};


// 生命周期
onMounted(() => {
  getOvertimeRecordsList();
});
</script>

<template>
  <div class="overtime-records-container">
    <div class="content">
      <div class="main-content">
        <!-- 功能提示卡片 -->
        <el-card class="info-card" style="margin-bottom: 20px;">
          <el-alert
            title="超时记录说明"
            type="warning"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>显示所有超过计划归还时间的物料借用记录，帮助监控物料使用情况和及时回收。</p>
            </template>
          </el-alert>
        </el-card>

        <!-- 表格区域 -->
        <el-card class="table-card">
          <template #header>
            <div class="card-header">
              <span class="title">
                <el-icon style="margin-right: 5px; color: #e6a23c;">
                  <Warning />
                </el-icon>
                超时记录列表
              </span>
              <div class="header-actions">
                <el-tag type="danger" size="large">
                  总计超时: {{ total }} 条
                </el-tag>
              </div>
            </div>
          </template>

          <el-table 
            :data="tableData" 
            v-loading="loading"
            style="width: 100%"
            stripe
            border
          >
            <el-table-column prop="id" label="记录ID" width="80" />
            <el-table-column prop="cabinetCode" label="柜子编号" width="120" />
            <el-table-column prop="cabinetName" label="柜子名称" width="150" show-overflow-tooltip />
            <el-table-column prop="materialCode" label="物料编号" width="120" />
            <el-table-column prop="materialName" label="物料名称" width="150" show-overflow-tooltip />
            <el-table-column label="物料状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag 
                  :type="formatMaterialStatus(row.materialStatus).type"
                  size="small"
                >
                  {{ formatMaterialStatus(row.materialStatus).label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operatorName" label="借用人" width="100" />
            <el-table-column label="借出时间" width="160">
              <template #default="{ row }">
                <div class="time-info">
                  <el-icon><Clock /></el-icon>
                  <span>{{ formatDateTime(row.lentOutTime) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="计划归还时间" width="160">
              <template #default="{ row }">
                <div class="time-info planned-time">
                  <el-icon><Clock /></el-icon>
                  <span>{{ formatDateTime(row.plannedReturnTime) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="实际归还时间" width="160">
              <template #default="{ row }">
                <div class="time-info" v-if="row.actualReturnTime">
                  <el-icon><Clock /></el-icon>
                  <span>{{ formatDateTime(row.actualReturnTime) }}</span>
                </div>
                <el-tag type="danger" size="small" v-else>
                  未归还
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="超时程度" width="120" align="center">
              <template #default="{ row }">
                <el-tag 
                  :type="getOvertimeSeverity(row.plannedReturnTime, row.actualReturnTime).type"
                  size="small"
                >
                  {{ getOvertimeSeverity(row.plannedReturnTime, row.actualReturnTime).text }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="超时时长" width="130" align="center">
              <template #default="{ row }">
                <el-tag 
                  type="danger" 
                  size="small"
                  v-if="calculateOvertimeDuration(row.plannedReturnTime, row.actualReturnTime) !== '未超时'"
                >
                  {{ calculateOvertimeDuration(row.plannedReturnTime, row.actualReturnTime) }}
                </el-tag>
                <el-tag type="success" size="small" v-else>
                  未超时
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="View"
                  @click="handleView(row)"
                >
                  查看详情
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
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.overtime-records-container {
  height: calc(100vh - 80px);
  
  .content {
    padding: 20px;
    overflow-y: auto;
    background-color: #f5f7fa;
    
    .main-content {
      .info-card {
        .el-alert {
          border: none;
          background-color: #fef7e0;
          
          p {
            margin: 0;
            color: #606266;
            font-size: 14px;
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
            display: flex;
            align-items: center;
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
    
    &.planned-time {
      .el-icon {
        color: #e6a23c;
      }
    }
  }
}

// 响应式调整
@media (max-width: 1200px) {
  .overtime-records-container {
    .content {
      padding: 10px;
    }
  }
}
</style>