<script setup lang='ts'>
// 超时记录
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { View, Clock, Warning } from '@element-plus/icons-vue';

defineOptions({
  name: "OvertimeRecord"
});

// 超时记录数据接口
interface OvertimeRecordData {
  id: number;
  cabinetId: number;
  cabinetCode: string;
  cabinetName: string;
  materialId: number;
  materialCode: string;
  materialName: string;
  materialStatus: number;
  lentOutTime: string;
  plannedReturnTime: string;
  actualReturnTime: string | null;
  operatorName: string;
  createTime: string;
  updatedTime: string;
}

// API响应接口
interface ApiResponse {
  code: number;
  msg: string;
  data: {
    records: OvertimeRecordData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

// 响应式数据
const loading = ref(false);
const tableData = ref<OvertimeRecordData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 从API获取超时记录列表
const getOvertimeRecordsApi = async (params: any = {}) => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    
    // 只添加分页参数
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // 构建完整的URL
    const baseUrl = `/api/power/material-status/overdueRecords`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('超时记录API请求URL:', url);
    
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
    console.error('超时记录API请求失败:', error);
    throw error;
  }
};

// 获取超时记录列表
const getOvertimeRecordsList = async () => {
  loading.value = true;
  try {
    // 只传递分页参数
    const searchParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    };
    
    console.log('超时记录搜索参数:', searchParams);
    
    const response = await getOvertimeRecordsApi(searchParams);
    
    // 处理API响应
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

// 计算超时时长
const calculateOvertimeDuration = (plannedReturnTime: string, actualReturnTime: string | null) => {
  const planned = new Date(plannedReturnTime);
  const actual = actualReturnTime ? new Date(actualReturnTime) : new Date();
  
  if (actual <= planned) {
    return '未超时';
  }
  
  const diffMs = actual.getTime() - planned.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}天${diffHours}小时`;
  } else if (diffHours > 0) {
    return `${diffHours}小时${diffMinutes}分钟`;
  } else {
    return `${diffMinutes}分钟`;
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

// 获取超时严重程度
const getOvertimeSeverity = (plannedReturnTime: string, actualReturnTime: string | null) => {
  const planned = new Date(plannedReturnTime);
  const actual = actualReturnTime ? new Date(actualReturnTime) : new Date();
  
  if (actual <= planned) {
    return { type: 'success' as const, text: '未超时' };
  }
  
  const diffHours = (actual.getTime() - planned.getTime()) / (1000 * 60 * 60);
  
  if (diffHours <= 2) {
    return { type: 'warning' as const, text: '轻微超时' };
  } else if (diffHours <= 24) {
    return { type: 'danger' as const, text: '严重超时' };
  } else {
    return { type: 'danger' as const, text: '极度超时' };
  }
};

// 格式化物料状态
const formatMaterialStatus = (status: number) => {
  const statusMap = {
    0: { label: '借出', type: 'warning' as const },
    1: { label: '归还', type: 'success' as const },
    2: { label: '丢失', type: 'danger' as const },
    3: { label: '损坏', type: 'danger' as const }
  };
  
  return statusMap[status] || { label: '未知', type: 'info' as const };
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