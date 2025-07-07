<script setup lang='ts'>
// 下架记录
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { View, Download, Search, RemoveFilled } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";
import { useAreaStore } from "@/store/modules/area";
import { usePageSearch } from "@/utils/useAreaFilter";

// 🔥 新增：导入 API 方法和类型
import { 
  getOffshelvingList as getOffshelvingListApi, 
  exportOffshelvingRecords as exportOffshelvingRecordsApi,
  calculateOffshelfDuration,
  formatDateTime,
  getReasonType,
  validateExportParams,
  getDefaultExportDateRange,
  type OffshelvingData,
  type OffshelvingQueryParams,
  type ExportParams
} from '@/api/offshelving';

defineOptions({
  name: "OffshelvingRecord"
});

// 初始化 areaStore
const areaStore = useAreaStore();


// 响应式数据
const loading = ref(false);
const tableData = ref<OffshelvingData[]>([]);
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
    materialName: '',
    cabinetName: '',
    startTime: '',
    endTime: ''
  },
  // 搜索回调函数
  () => {
    currentPage.value = 1;
    getOffshelvingList();
  }
);


// 🔥 修改：获取下架记录列表（使用 API 方法）
const getOffshelvingList = async () => {
  loading.value = true;
  try {
    // 🔥 使用 API 方法和类型
    const params: OffshelvingQueryParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value
    };
    
    console.log('下架记录搜索参数:', params);
    
    const response = await getOffshelvingListApi(params);
    
    if (response.code === 200) {
      tableData.value = response.data.records;
      total.value = response.data.total;
      console.log('获取到的下架记录数据:', tableData.value);
    } else {
      ElMessage.error(response.msg || '获取数据失败');
    }
    
  } catch (error) {
    ElMessage.error('获取下架记录列表失败，请检查网络连接');
    console.error('获取下架记录列表错误:', error);
  } finally {
    loading.value = false;
  }
};


// 查看记录详情
const handleView = (row: OffshelvingData) => {
  ElMessage.info(`查看下架记录: ${row.materialName}`);
  // 这里可以打开详情弹窗或跳转到详情页
};

// 🔥 修改：导出记录（使用工具函数）
const handleExport = () => {
  // 打开导出弹窗
  exportDialogVisible.value = true;
  
  // 🔥 使用工具函数获取默认日期范围
  exportForm.value = getDefaultExportDateRange();
};

// 🔥 修改：确认导出（使用 API 方法和验证工具函数）
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
    await exportOffshelvingRecordsApi(exportForm.value);
    exportDialogVisible.value = false;
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error('导出失败，请稍后重试');
    console.error('导出失败:', error);
  } finally {
    exportLoading.value = false;
  }
};

// 取消导出
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
  getOffshelvingList();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  getOffshelvingList();
};


// 生命周期
onMounted(() => {
  getOffshelvingList();
});
</script>

<template>
  <div class="offshelf-records-container">
    <!-- 🔥 可以启用区域选择器，因为API已支持 -->
    <!-- <div>
      <AreaSelect @area-search="handleAreaSearch" />
    </div> -->
    
    <div class="content">
      <div class="main-content">
        <!-- 搜索区域 -->
        <!-- <el-card class="search-card">
          <el-form :model="searchForm" :inline="true" class="search-form">
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
            </el-form-item>
          </el-form>
        </el-card> -->

        <!-- 表格区域 -->
        <el-card class="table-card">
          <template #header>
            <div class="card-header">
              <span class="title">下架记录列表</span>
              <div class="header-actions">
                <el-button type="success" size="small" :icon="Download" @click="handleExport">
                  导出记录
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
          >
            <el-table-column prop="id" label="记录ID" width="80" />
            <el-table-column prop="cabinetCode" label="柜子编号" width="120" />
            <el-table-column prop="cabinetName" label="柜子名称" width="150" show-overflow-tooltip />
            <el-table-column prop="materialCode" label="物料编号" width="120" />
            <el-table-column prop="materialName" label="物料名称" width="150" show-overflow-tooltip />
            <el-table-column prop="operatorName" label="操作员" width="100" />
            <el-table-column label="备注信息" width="150">
              <template #default="{ row }">
                <el-tag 
                  :type="getReasonType(row.reason || row.remark).type"
                  size="small"
                >
                  {{ getReasonType(row.reason || row.remark).text }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="下架时间" width="160">
              <template #default="{ row }">
                <div class="time-info">
                  <el-icon><RemoveFilled /></el-icon>
                  <span>{{ formatDateTime(row.createTime) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="已下架时长" width="120" align="center">
              <template #default="{ row }">
                <el-tag type="info" size="small">
                  {{ calculateOffshelfDuration(row.createTime) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="更新时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.updatedTime) }}
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
    
    <!-- 导出弹窗 -->
    <el-dialog
      v-model="exportDialogVisible"
      title="导出下架记录"
      width="500px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="exportForm" label-width="100px" label-position="right">
        <el-form-item label="开始日期" required>
          <el-date-picker
            v-model="exportForm.startDate"
            type="date"
            placeholder="选择开始日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            :disabledDate="(date) => date > new Date()"
          />
        </el-form-item>
        <el-form-item label="结束日期" required>
          <el-date-picker
            v-model="exportForm.endDate"
            type="date"
            placeholder="选择结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
            :disabledDate="(date) => date > new Date() || (exportForm.startDate && date < new Date(exportForm.startDate))"
          />
        </el-form-item>
        
        <!-- 提示信息 -->
        <el-alert
          title="导出说明"
          type="info"
          :closable="false"
          style="margin-top: 15px"
        >
          <template #default>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
              <li>导出的数据将包含指定日期范围内的所有下架记录</li>
              <li>日期范围不能超过365天</li>
              <li>文件格式为Excel (.xlsx)</li>
              <li>导出可能需要几秒钟时间，请耐心等待</li>
            </ul>
          </template>
        </el-alert>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelExport" :disabled="exportLoading">
            取消
          </el-button>
          <el-button 
            type="primary" 
            @click="confirmExport"
            :loading="exportLoading"
            :disabled="!exportForm.startDate || !exportForm.endDate"
          >
            {{ exportLoading ? '导出中...' : '确认导出' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang='scss' scoped>
.offshelf-records-container {
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

// 导出弹窗样式
:deep(.el-dialog) {
  .dialog-footer {
    text-align: center;
  }
  
  .el-alert {
    ul {
      li {
        margin: 3px 0;
        color: #606266;
      }
    }
  }
}
</style>