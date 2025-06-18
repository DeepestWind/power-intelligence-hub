<script setup lang='ts'>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { View, Download, Search, Clock } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";
import { useAreaStore } from "@/store/modules/area";

defineOptions({
  name: "BorrowRecords"
});

// 初始化 areaStore
const areaStore = useAreaStore();

// 领用记录数据接口
interface BorrowRecordData {
  id: number;
  cabinetId: number;
  cabinetCode: string;
  cabinetName: string;
  materialId: number;
  materialCode: string;
  materialName: string;
  usageQuantity: number;
  borrowName: string;
  createTime: string;
  updatedTime: string;
}

// API响应接口
interface ApiResponse {
  code: number;
  msg: string;
  data: {
    records: BorrowRecordData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

// 响应式数据
const loading = ref(false);
const tableData = ref<BorrowRecordData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 分离区域筛选和表单搜索
const areaFilter = ref({
  province: '',
  city: '',
  district: ''
});

// 搜索表单
const searchForm = ref({
  cabinetCode: '',
  cabinetName: '',
  materialCode: '',
  materialName: '',
  borrowName: '',
  createTimeStart: '',
  createTimeEnd: '',
  usageQuantityMin: null as number | null, 
  usageQuantityMax: null as number | null
});

// 处理区域搜索事件
const handleAreaSearch = (area: AreaNode) => {
  console.log('🎯 borrow-records.vue 接收到区域搜索事件:', area);
  
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

// 从API获取领用记录列表
const getBorrowRecordsApi = async (params: any = {}) => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    
    // 添加搜索参数
    if (params.cabinetCode) queryParams.append('cabinetCode', params.cabinetCode);
    if (params.cabinetName) queryParams.append('cabinetName', params.cabinetName);
    if (params.materialCode) queryParams.append('materialCode', params.materialCode);
    if (params.materialName) queryParams.append('materialName', params.materialName);
    if (params.borrowName) queryParams.append('borrowName', params.borrowName);
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    if (params.createTimeStart) queryParams.append('createTimeStart', params.createTimeStart);
    if (params.createTimeEnd) queryParams.append('createTimeEnd', params.createTimeEnd);
    if (params.usageQuantityMin) queryParams.append('usageQuantityMin', params.usageQuantityMin);
    if (params.usageQuantityMax) queryParams.append('usageQuantityMax', params.usageQuantityMax);
    
    // 构建完整的URL
    const baseUrl = `/api/power/borrowed-records/borrowRecords`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('领用记录API请求URL:', url);
    
    // 发送GET请求
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // 如果需要认证，添加token
        // 'Authorization': `Bearer ${getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ApiResponse = await response.json();
    return data;
    
  } catch (error) {
    console.error('领用记录API请求失败:', error);
    throw error;
  }
};

// 获取领用记录列表
const getBorrowRecordsList = async () => {
  loading.value = true;
  try {
    // 合并区域筛选和表单搜索条件
    const searchParams = {
      page: currentPage.value,
      size: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value
    };
    
    console.log('领用记录搜索参数:', searchParams);
    
    const response = await getBorrowRecordsApi(searchParams);
    
    // 处理API响应
    if (response.code === 200) {
      tableData.value = response.data.records;
      total.value = response.data.total;
      console.log('获取到的领用记录数据:', tableData.value);
    } else {
      ElMessage.error(response.msg || '获取数据失败');
    }
    
  } catch (error) {
    ElMessage.error('获取领用记录列表失败，请检查网络连接');
    console.error('获取领用记录列表错误:', error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  getBorrowRecordsList();
};

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    cabinetCode: '',
    cabinetName: '',
    materialCode: '',
    materialName: '',
    borrowName: '',
    createTimeStart: '',
    createTimeEnd: '',
    usageQuantityMin: null,
    usageQuantityMax: null
  };
  handleSearch();
};

// 清空所有筛选条件
const handleClearAll = () => {
  searchForm.value = {
    cabinetCode: '',
    cabinetName: '',
    materialCode: '',
    materialName: '',
    borrowName: '',
    createTimeStart: '',
    createTimeEnd: '',
    usageQuantityMin: null,
    usageQuantityMax: null
  };
  areaFilter.value = {
    province: '',
    city: '',
    district: ''
  };
  handleSearch();
};

// 查看记录详情
const handleView = (row: BorrowRecordData) => {
  ElMessage.info(`查看领用记录: ${row.materialName}`);
  // 这里可以打开详情弹窗或跳转到详情页
};

// 导出记录
const handleExport = () => {
  ElMessage.info('导出功能开发中...');
  // 这里可以实现导出功能
};

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getBorrowRecordsList();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  getBorrowRecordsList();
};

// 计算领用时长（从领用到现在）
const calculateBorrowDuration = (createTime: string) => {
  const borrowed = new Date(createTime);
  const now = new Date();
  const diffMs = now.getTime() - borrowed.getTime();
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

// 根据领用时长判断状态
const getBorrowStatus = (createTime: string) => {
  const borrowed = new Date(createTime);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - borrowed.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) {
    return { type: 'success' as const, text: '正常' };
  } else if (diffDays <= 7) {
    return { type: 'warning' as const, text: '提醒' };
  } else {
    return { type: 'danger' as const, text: '超期' };
  }
};


// 生命周期
onMounted(() => {
  getBorrowRecordsList();
});
</script>

<template>
  <div class="borrow-records-container">
    <div>
      <!-- 区域选择器 -->
      <AreaSelect @area-search="handleAreaSearch" />
    </div>
    
    <div class="content">
      <div class="main-content">
        <!-- 搜索区域 -->
        <el-card class="search-card">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item label="柜子编号">
              <el-input 
                v-model="searchForm.cabinetCode" 
                placeholder="请输入柜子编号" 
                clearable
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item label="柜子名称">
              <el-input 
                v-model="searchForm.cabinetName" 
                placeholder="请输入柜子名称" 
                clearable
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item label="物料编号">
              <el-input 
                v-model="searchForm.materialCode" 
                placeholder="请输入物料编号" 
                clearable
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item label="物料名称">
              <el-input 
                v-model="searchForm.materialName" 
                placeholder="请输入物料名称" 
                clearable
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item label="领用人">
              <el-input 
                v-model="searchForm.borrowName" 
                placeholder="请输入领用人" 
                clearable
                style="width: 120px"
              />
            </el-form-item>
            <el-form-item label="领用数量">
              <el-input-number
                v-model="searchForm.usageQuantityMin"
                placeholder="最小数量"
                :min="0"
                :controls="false"
                style="width: 100px"
              />
            </el-form-item>
            <el-form-item label="至">
              <el-input-number
                v-model="searchForm.usageQuantityMax"
                placeholder="最大数量"
                :min="0"
                :controls="false"
                style="width: 100px"
              />
            </el-form-item>
            <el-form-item label="领用时间">
              <el-date-picker
                v-model="searchForm.createTimeStart"
                type="datetime"
                placeholder="开始时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="至">
              <el-date-picker
                v-model="searchForm.createTimeEnd"
                type="datetime"
                placeholder="结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
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
              <span class="title">领用记录列表</span>
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
            <el-table-column label="领用数量" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="primary" size="large">
                  {{ row.usageQuantity }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="borrowName" label="领用人" width="100" />
            <el-table-column label="领用时间" width="160">
              <template #default="{ row }">
                <div class="time-info">
                  <el-icon><Clock /></el-icon>
                  <span>{{ formatDateTime(row.createTime) }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="已借用时长" width="120" align="center">
              <template #default="{ row }">
                <el-tag 
                  :type="getBorrowStatus(row.createTime).type" 
                  size="small"
                >
                  {{ calculateBorrowDuration(row.createTime) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="借用状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag 
                  :type="getBorrowStatus(row.createTime).type"
                >
                  {{ getBorrowStatus(row.createTime).text }}
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
  </div>
</template>

<style lang='scss' scoped>
.borrow-records-container {
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
          
          // .el-form-item:last-child,
          // .el-form-item:nth-last-child(-n+2) {
          //   margin-bottom: 0;
          // }
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