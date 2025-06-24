<script setup lang='ts'>
// 下架记录
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { View, Download, Search, RemoveFilled } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";
import { useAreaStore } from "@/store/modules/area";

defineOptions({
  name: "OffshelvingRecord"
});

// 初始化 areaStore
const areaStore = useAreaStore();

// 下架记录数据接口
interface ShelfOutRecordData {
  id: number;
  userId: number;
  cabinetId: number;
  materialId: number;
  cabinetCode: string;
  cabinetName: string;
  materialCode: string;
  materialName: string;
  operatorName: string;
  province: string;
  city: string | null;
  district: string | null;
  address: string | null;
  shelfOutTime: string;  
  createTime: string;
  updatedTime: string;
  remark: string;        
}

// API响应接口
interface ApiResponse {
  code: number;
  msg: string;
  data: {
    records: ShelfOutRecordData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

// 响应式数据
const loading = ref(false);
const tableData = ref<ShelfOutRecordData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 导出相关的响应式数据
const exportDialogVisible = ref(false);
const exportForm = ref({
  startDate: '',
  endDate: ''
});
const exportLoading = ref(false);

// 分离区域筛选和表单搜索
const areaFilter = ref({
  province: '',
  city: '',
  district: ''
});

// 搜索表单
const searchForm = ref({
  materialName: '',
  cabinetName: '',
  startTime: '',
  endTime: ''
});

// 处理区域搜索事件
const handleAreaSearch = (area: AreaNode) => {
  console.log('🎯 offshelving.vue 接收到区域搜索事件:', area);
  
  // 清空区域筛选
  areaFilter.value = { province: '', city: '', district: '' };
  
  // 设置新的区域筛选
  fillAreaFilter(area);
  
  // 自动执行搜索
  handleSearch();
};

const fillAreaFilter = (area: AreaNode) => {
  const code = area.code;
  const label = area.label;
  
  if (code.endsWith('0000')) {
    areaFilter.value.province = label;
  } else if (code.endsWith('00')) {
    areaFilter.value.city = label;
  } else {
    areaFilter.value.district = label;
  }
  
  console.log('区域筛选已设置:', areaFilter.value);
  ElMessage.info(`区域筛选已设置为: ${label}`);
};

// 从API获取下架记录列表
const getShelfOutRecordsApi = async (params: any = {}) => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    if (params.materialName) queryParams.append('materialName', params.materialName);
    if (params.cabinetName) queryParams.append('cabinetName', params.cabinetName);
    if (params.startTime) queryParams.append('startTime', params.startTime);
    if (params.endTime) queryParams.append('endTime', params.endTime);
    // 构建完整的URL
    const baseUrl = `/api/power/shelf-out-records/page`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('下架记录API请求URL:', url);
    
    // 发送GET请求
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse = await response.json();
    return data;
    
  } catch (error) {
    console.error('下架记录API请求失败:', error);
    throw error;
  }
};

// 获取下架记录列表
const getShelfOutRecordsList = async () => {
  loading.value = true;
  try {
    // 合并区域筛选和表单搜索条件
    const searchParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      materialName: searchForm.value.materialName,
      cabinetName: searchForm.value.cabinetName,
      startTime: searchForm.value.startTime,
      endTime: searchForm.value.endTime
    };
    // 过滤空值
    const filteredParams = Object.fromEntries(
      Object.entries(searchParams).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
    );
    
    console.log('下架记录搜索参数:', searchParams);
    
    const response = await getShelfOutRecordsApi(searchParams);
    
    // 处理API响应
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

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  getShelfOutRecordsList();
};

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    materialName: '',
    cabinetName: '',
    startTime: '',
    endTime: ''
  };
  handleSearch();
};
// 清空所有筛选条件
const handleClearAll = () => {
  searchForm.value = {
    materialName: '',
    cabinetName: '',
    startTime: '',
    endTime: ''
  };
  handleSearch();
};

// 查看记录详情
const handleView = (row: ShelfOutRecordData) => {
  ElMessage.info(`查看下架记录: ${row.materialName}`);
  // 这里可以打开详情弹窗或跳转到详情页
};

// 导出记录
const handleExport = () => {
  // 打开导出弹窗
  exportDialogVisible.value = true;
  
  // 设置默认日期范围（最近30天）
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  exportForm.value = {
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  };
};

// 确认导出
const confirmExport = async () => {
  if (!exportForm.value.startDate || !exportForm.value.endDate) {
    ElMessage.error('请选择导出日期范围');
    return;
  }
  
  // 验证日期范围
  const startDate = new Date(exportForm.value.startDate);
  const endDate = new Date(exportForm.value.endDate);
  
  if (startDate > endDate) {
    ElMessage.error('开始日期不能大于结束日期');
    return;
  }
  
  // 验证日期范围不超过365天
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 365) {
    ElMessage.error('导出日期范围不能超过365天');
    return;
  }
  
  try {
    exportLoading.value = true;
    await downloadShelfOutRecords(exportForm.value.startDate, exportForm.value.endDate);
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

// 调用导出API
const downloadShelfOutRecords = async (startDate: string, endDate: string) => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
    
    // 构建完整的URL
    const url = `/api/power/shelf-out-records/download/shelfOut?${queryParams.toString()}`;
    
    console.log('导出API请求URL:', url);
    
    // 发送GET请求
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // 获取文件名
    const contentDisposition = response.headers.get('Content-Disposition');
    let fileName = '下架记录.xlsx'; // 默认文件名
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1].replace(/['"]/g, '');
      }
    }
    
    // 如果文件名没有扩展名，添加.xlsx
    if (!fileName.includes('.')) {
      fileName += '.xlsx';
    }
    
    // 获取文件blob
    const blob = await response.blob();
    
    // 创建下载链接
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    console.log('文件下载成功:', fileName);
    
  } catch (error) {
    console.error('导出API请求失败:', error);
    throw error;
  }
};

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getShelfOutRecordsList();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  getShelfOutRecordsList();
};

// 计算下架时长（从下架到现在）
const calculateOffshelfDuration = (createTime: string) => {
  const offshelved = new Date(createTime);
  const now = new Date();
  const diffMs = now.getTime() - offshelved.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}天${diffHours}小时`;
  } else {
    return `${diffHours}小时`;
  }
};

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 根据下架原因判断类型
const getReasonType = (remark: string) => {
  if (!remark) return { type: 'info' as const, text: '无备注' };
  
  if (remark.includes('维修') || remark.includes('损坏') || remark.includes('破损')) {
    return { type: 'danger' as const, text: remark };
  } else if (remark.includes('过期') || remark.includes('失效') || remark.includes('老化')) {
    return { type: 'warning' as const, text: remark };
  } else if (remark.includes('调拨') || remark.includes('转移') || remark.includes('调整')) {
    return { type: 'primary' as const, text: remark };
  } else {
    return { type: 'info' as const, text: remark };
  }
};

// 生命周期
onMounted(() => {
  getShelfOutRecordsList();
});
</script>

<template>
  <div class="offshelf-records-container">
    <!-- 暂时隐藏区域选择器，因为后端不支持 -->
    <!-- <div>
      <AreaSelect @area-search="handleAreaSearch" />
    </div> -->
    
    <div class="content">
      <div class="main-content">
        <!-- 搜索区域 -->
        <el-card class="search-card">
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
        </el-card>

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
            <!-- <el-table-column label="下架数量" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="danger" size="large">
                  {{ row.offshelfQuantity }}
                </el-tag>
              </template>
            </el-table-column> -->
            <el-table-column prop="operatorName" label="操作员" width="100" />
            <el-table-column label="备注信息" width="150">
              <template #default="{ row }">
                <el-tag 
                  :type="getReasonType(row.reason).type"
                  size="small"
                >
                  {{ row.reason }}
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