<script setup lang='ts'>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { View, Download, Search } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";
import { useAreaStore } from "@/store/modules/area";

defineOptions({
  name: "ReturnRecords"
});

// 初始化 areaStore
const areaStore = useAreaStore();

// 归还记录数据接口
interface ReturnRecordData {
  id: number;
  cabinetId: number;
  cabinetCode: string;
  cabinetName: string;
  materialId: number;
  materialCode: string;
  materialName: string;
  usageQuantity: number;
  returnQuantity: number;
  lentOutTime: string;
  actualReturnTime: string;
  borrowName: string;
  returnName: string;
  createTime: string;
  updatedTime: string;
}

// API响应接口
interface ApiResponse {
  code: number;
  msg: string;
  data: {
    records: ReturnRecordData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

// 响应式数据
const loading = ref(false);
const tableData = ref<ReturnRecordData[]>([]);
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
  returnName: '',
  lentOutTimeStart: '',
  lentOutTimeEnd: '',
  actualReturnTimeStart: '',
  actualReturnTimeEnd: ''
});

// 处理区域搜索事件
const handleAreaSearch = (area: AreaNode) => {
  console.log('🎯 return-records.vue 接收到区域搜索事件:', area);
  
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

// 从API获取归还记录列表
const getReturnRecordsApi = async (params: any = {}) => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // 添加搜索参数
    if (params.cabinetCode) queryParams.append('cabinetCode', params.cabinetCode);
    if (params.cabinetName) queryParams.append('cabinetName', params.cabinetName);
    if (params.materialCode) queryParams.append('materialCode', params.materialCode);
    if (params.materialName) queryParams.append('materialName', params.materialName);
    if (params.borrowName) queryParams.append('borrowName', params.borrowName);
    if (params.returnName) queryParams.append('returnName', params.returnName);
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    if (params.lentOutTimeStart) queryParams.append('lentOutTimeStart', params.lentOutTimeStart);
    if (params.lentOutTimeEnd) queryParams.append('lentOutTimeEnd', params.lentOutTimeEnd);
    if (params.actualReturnTimeStart) queryParams.append('actualReturnTimeStart', params.actualReturnTimeStart);
    if (params.actualReturnTimeEnd) queryParams.append('actualReturnTimeEnd', params.actualReturnTimeEnd);
    
    // 构建完整的URL
    const baseUrl = `/api/power/returned-records/returnRecords`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('归还记录API请求URL:', url);
    
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
    console.error('归还记录API请求失败:', error);
    throw error;
  }
};

// 获取归还记录列表
const getReturnRecordsList = async () => {
  loading.value = true;
  try {
    // 合并区域筛选和表单搜索条件
    const searchParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value
    };
    
    console.log('归还记录搜索参数:', searchParams);
    
    const response = await getReturnRecordsApi(searchParams);
    
    // 处理API响应
    if (response.code === 200) {
      tableData.value = response.data.records;
      total.value = response.data.total;
      console.log('获取到的归还记录数据:', tableData.value);
    } else {
      ElMessage.error(response.msg || '获取数据失败');
    }
    
  } catch (error) {
    ElMessage.error('获取归还记录列表失败，请检查网络连接');
    console.error('获取归还记录列表错误:', error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  getReturnRecordsList();
};

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    cabinetCode: '',
    cabinetName: '',
    materialCode: '',
    materialName: '',
    borrowName: '',
    returnName: '',
    lentOutTimeStart: '',
    lentOutTimeEnd: '',
    actualReturnTimeStart: '',
    actualReturnTimeEnd: ''
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
    returnName: '',
    lentOutTimeStart: '',
    lentOutTimeEnd: '',
    actualReturnTimeStart: '',
    actualReturnTimeEnd: ''
  };
  areaFilter.value = {
    province: '',
    city: '',
    district: ''
  };
  handleSearch();
};

// 查看记录详情
const handleView = (row: ReturnRecordData) => {
  ElMessage.info(`查看归还记录: ${row.materialName}`);
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
  getReturnRecordsList();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  getReturnRecordsList();
};

// 计算借用时长
const calculateUsageDuration = (lentOutTime: string, actualReturnTime: string) => {
  const lentOut = new Date(lentOutTime);
  const returned = new Date(actualReturnTime);
  const diffMs = returned.getTime() - lentOut.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}天${diffHours}小时`;
  } else {
    return `${diffHours}小时`;
  }
};

// 检查是否完全归还
const isFullyReturned = (usageQuantity: number, returnQuantity: number) => {
  return usageQuantity === returnQuantity;
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

// 生命周期
onMounted(() => {
  getReturnRecordsList();
});
</script>

<template>
  <div class="return-records-container">
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
            <el-form-item label="借用人">
              <el-input 
                v-model="searchForm.borrowName" 
                placeholder="请输入借用人" 
                clearable
                style="width: 120px"
              />
            </el-form-item>
            <el-form-item label="归还人">
              <el-input 
                v-model="searchForm.returnName" 
                placeholder="请输入归还人" 
                clearable
                style="width: 120px"
              />
            </el-form-item>
            <el-form-item label="借出时间">
              <el-date-picker
                v-model="searchForm.lentOutTimeStart"
                type="datetime"
                placeholder="开始时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="至">
              <el-date-picker
                v-model="searchForm.lentOutTimeEnd"
                type="datetime"
                placeholder="结束时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="归还时间">
              <el-date-picker
                v-model="searchForm.actualReturnTimeStart"
                type="datetime"
                placeholder="开始时间"
                format="YYYY-MM-DD HH:mm"
                value-format="YYYY-MM-DD HH:mm:ss"
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="至">
              <el-date-picker
                v-model="searchForm.actualReturnTimeEnd"
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
              <span class="title">归还记录列表</span>
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
            <el-table-column prop="cabinetName" label="柜子名称" width="150" />
            <el-table-column prop="materialCode" label="物料编号" width="120" />
            <el-table-column prop="materialName" label="物料名称" width="150" show-overflow-tooltip />
            <el-table-column label="数量信息" width="120" align="center">
              <template #default="{ row }">
                <div class="quantity-info">
                  <div>借出: {{ row.usageQuantity }}</div>
                  <div>归还: {{ row.returnQuantity }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="归还状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag 
                  :type="isFullyReturned(row.usageQuantity, row.returnQuantity) ? 'success' : 'warning'"
                >
                  {{ isFullyReturned(row.usageQuantity, row.returnQuantity) ? '完全归还' : '部分归还' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="borrowName" label="借用人" width="100" />
            <el-table-column prop="returnName" label="归还人" width="100" />
            <el-table-column label="借出时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.lentOutTime) }}
              </template>
            </el-table-column>
            <el-table-column label="归还时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.actualReturnTime) }}
              </template>
            </el-table-column>
            <el-table-column label="借用时长" width="120" align="center">
              <template #default="{ row }">
                <el-tag type="info" size="small">
                  {{ calculateUsageDuration(row.lentOutTime, row.actualReturnTime) }}
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
.return-records-container {
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
  
  .quantity-info {
    font-size: 12px;
    line-height: 1.2;
    
    div {
      margin: 2px 0;
    }
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .search-form {
    .el-form-item {
      width: auto !important;
      
      .el-input,
      .el-date-picker {
        width: 140px !important;
      }
    }
  }
}

@media (max-width: 1200px) {
  .search-form {
    .el-form-item {
      .el-input,
      .el-date-picker {
        width: 120px !important;
      }
    }
  }
}
</style>