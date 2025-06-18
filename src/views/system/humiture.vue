<script setup lang='ts'>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox, FormRules } from 'element-plus';
import { Edit, View, Setting } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";

defineOptions({
  name: "HumitureSettings"
});

// 温湿度设备数据接口
interface HumitureData {
  id: number;
  cabinetCode: string;
  cabinetName: string;
  province: string;
  city: string;
  district: string;
  address: string;
  maxTemperature: number | null;
  minTemperature: number | null;
  maxHumidity: number | null;
  minHumidity: number | null;
  operationMode: number; // 0-自动模式, 1-手动模式
  maxTemperatureDifference: number | null;
  onlineStatus: number | null; // 1-在线, 0-离线, null-未知
  createTime?: string;
  updatedTime?: string;
}

// API响应接口
interface ApiResponse {
  code: number;
  msg: string;
  data: {
    records: HumitureData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

// 响应式数据
const loading = ref(false);
const tableData = ref<HumitureData[]>([]);
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
  operationMode: '',
  onlineStatus: ''
});

// 处理区域搜索事件
const handleAreaSearch = (area: AreaNode) => {
  console.log('🎯 humiture.vue 接收到区域搜索事件:', area);
  
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

// 编辑温湿度设置相关数据
const dialogVisible = ref(false);
const dialogTitle = ref('温湿度设置');

// 温湿度设置表单数据
const humitureForm = ref({
  id: null,
  cabinetCode: '',
  cabinetName: '',
  maxTemperature: null,
  minTemperature: null,
  maxHumidity: null,
  minHumidity: null,
  operationMode: 0,
  maxTemperatureDifference: null
});

// 表单验证规则
const humitureFormRules = {
  maxTemperature: [
    { required: true, message: '请输入最高温度', trigger: 'blur' },
    { type: 'number', min: -50, max: 100, message: '温度范围为-50°C到100°C', trigger: 'blur' }
  ],
  minTemperature: [
    { required: true, message: '请输入最低温度', trigger: 'blur' },
    { type: 'number', min: -50, max: 100, message: '温度范围为-50°C到100°C', trigger: 'blur' }
  ],
  maxHumidity: [
    { required: true, message: '请输入最高湿度', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '湿度范围为0%到100%', trigger: 'blur' }
  ],
  minHumidity: [
    { required: true, message: '请输入最低湿度', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '湿度范围为0%到100%', trigger: 'blur' }
  ],
  maxTemperatureDifference: [
    { required: true, message: '请输入最大温差', trigger: 'blur' },
    { type: 'number', min: 0, max: 50, message: '温差范围为0°C到50°C', trigger: 'blur' }
  ],
  operationMode: [
    { required: true, message: '请选择运行模式', trigger: 'change' }
  ]
} as FormRules;

const humitureFormRef = ref();

// 运行模式选项
const operationModeOptions = [
  { label: '自动模式', value: 0 },
  { label: '手动模式', value: 1 }
];

// 在线状态选项
const onlineStatusOptions = [
  { label: '在线', value: 1 },
  { label: '离线', value: 0 },
  { label: '未知', value: null }
];

// 从API获取温湿度设备列表
const getHumitureListApi = async (params: any = {}) => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // 添加搜索参数
    if (params.cabinetCode) queryParams.append('cabinetCode', params.cabinetCode);
    if (params.cabinetName) queryParams.append('cabinetName', params.cabinetName);
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    if (params.operationMode !== '' && params.operationMode !== undefined) {
      queryParams.append('operationMode', params.operationMode);
    }
    if (params.onlineStatus !== '' && params.onlineStatus !== undefined) {
      queryParams.append('onlineStatus', params.onlineStatus);
    }
    
    // 构建完整的URL
    const baseUrl = `/api/power/cabinet/page`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('温湿度API请求URL:', url);
    
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
    console.error('温湿度API请求失败:', error);
    throw error;
  }
};

// 获取温湿度设备列表
const getHumitureList = async () => {
  loading.value = true;
  try {
    // 合并区域筛选和表单搜索条件
    const searchParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value
    };
    
    console.log('温湿度搜索参数:', searchParams);
    
    const response = await getHumitureListApi(searchParams);
    
    // 处理API响应
    if (response.code === 200) {
      tableData.value = response.data.records;
      total.value = response.data.total;
      console.log('获取到的温湿度设备数据:', tableData.value);
    } else {
      ElMessage.error(response.msg || '获取数据失败');
    }
    
  } catch (error) {
    ElMessage.error('获取温湿度设备列表失败，请检查网络连接');
    console.error('获取温湿度设备列表错误:', error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  getHumitureList();
};

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    cabinetCode: '',
    cabinetName: '',
    operationMode: '',
    onlineStatus: ''
  };
  handleSearch();
};

// 清空所有筛选条件
const handleClearAll = () => {
  searchForm.value = {
    cabinetCode: '',
    cabinetName: '',
    operationMode: '',
    onlineStatus: ''
  };
  areaFilter.value = {
    province: '',
    city: '',
    district: ''
  };
  handleSearch();
};

// 打开温湿度设置弹窗
const handleEditHumiture = (row: HumitureData) => {
  dialogTitle.value = `${row.cabinetName} - 温湿度设置`;
  
  // 填充表单数据
  humitureForm.value = {
    id: row.id,
    cabinetCode: row.cabinetCode,
    cabinetName: row.cabinetName,
    maxTemperature: row.maxTemperature,
    minTemperature: row.minTemperature,
    maxHumidity: row.maxHumidity,
    minHumidity: row.minHumidity,
    operationMode: row.operationMode,
    maxTemperatureDifference: row.maxTemperatureDifference
  };
  
  dialogVisible.value = true;
};

// 重置表单
const resetHumitureForm = () => {
  humitureForm.value = {
    id: null,
    cabinetCode: '',
    cabinetName: '',
    maxTemperature: null,
    minTemperature: null,
    maxHumidity: null,
    minHumidity: null,
    operationMode: 0,
    maxTemperatureDifference: null
  };
  if (humitureFormRef.value) {
    humitureFormRef.value.clearValidate();
  }
};

// 取消操作
const handleCancel = () => {
  dialogVisible.value = false;
  resetHumitureForm();
};

// 确认提交
const handleConfirm = async () => {
  if (!humitureFormRef.value) return;
  
  try {
    await humitureFormRef.value.validate();
    
    // 自定义验证：最低温度不能大于最高温度
    if (humitureForm.value.minTemperature >= humitureForm.value.maxTemperature) {
      ElMessage.error('最低温度不能大于或等于最高温度');
      return;
    }
    
    // 自定义验证：最低湿度不能大于最高湿度
    if (humitureForm.value.minHumidity >= humitureForm.value.maxHumidity) {
      ElMessage.error('最低湿度不能大于或等于最高湿度');
      return;
    }
    
    await updateHumiture();
    
    dialogVisible.value = false;
    resetHumitureForm();
    getHumitureList(); // 刷新列表
    
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 更新温湿度设置API调用
const updateHumiture = async () => {
  try {
    // 构建请求体数据
    const requestData = {
      id: humitureForm.value.id,
      maxTemperature: humitureForm.value.maxTemperature,
      minTemperature: humitureForm.value.minTemperature,
      maxHumidity: humitureForm.value.maxHumidity,
      minHumidity: humitureForm.value.minHumidity,
      operationMode: humitureForm.value.operationMode,
      maxTemperatureDifference: humitureForm.value.maxTemperatureDifference,
      updatedTime: new Date().toISOString()
    };
    
    console.log('发送温湿度设置更新请求:', requestData);

    // 发送PUT请求到后端API
    const response = await fetch('/api/power/cabinet/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // 处理API响应
    if (result.code === 200) {
      ElMessage.success('温湿度设置更新成功');
      console.log('温湿度设置更新成功:', result);
    } else {
      ElMessage.error(result.msg || '温湿度设置更新失败');
      throw new Error(result.msg || '温湿度设置更新失败');
    }
    
  } catch (error) {
    ElMessage.error('温湿度设置更新失败，请检查网络连接');
    console.error('温湿度设置更新错误:', error);
    throw error;
  }
};

// 查看设备详情
const handleView = (row: HumitureData) => {
  ElMessage.info(`查看设备: ${row.cabinetName}`);
  // 这里可以打开详情弹窗或跳转到详情页
};

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getHumitureList();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  getHumitureList();
};

// 格式化运行模式
const formatOperationMode = (mode: number) => {
  const option = operationModeOptions.find(opt => opt.value === mode);
  return option ? option.label : '未知';
};

// 生命周期
onMounted(() => {
  getHumitureList();
});
</script>

<template>
  <div class="humiture-settings-container">
    <div>
      <!-- 区域选择器 -->
      <AreaSelect @area-search="handleAreaSearch" />
    </div>
    <div class="content">
      <div class="main-content">
        <!-- 搜索区域 -->
        <el-card class="search-card">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item label="设备编号">
              <el-input 
                v-model="searchForm.cabinetCode" 
                placeholder="请输入设备编号" 
                clearable
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="设备名称">
              <el-input 
                v-model="searchForm.cabinetName" 
                placeholder="请输入设备名称" 
                clearable
                style="width: 180px"
              />
            </el-form-item>
            <el-form-item label="运行模式">
              <el-select 
                v-model="searchForm.operationMode" 
                placeholder="请选择运行模式"
                clearable
                style="width: 120px"
              >
                <el-option
                  v-for="option in operationModeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="在线状态">
              <el-select 
                v-model="searchForm.onlineStatus" 
                placeholder="请选择状态"
                clearable
                style="width: 120px"
              >
                <el-option
                  v-for="option in onlineStatusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">
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
              <span class="title">温湿度设备列表</span>
            </div>
          </template>

          <el-table 
            :data="tableData" 
            v-loading="loading"
            style="width: 100%"
            stripe
            border
          >
            <el-table-column prop="cabinetCode" label="设备编号" width="120" />
            <el-table-column prop="cabinetName" label="设备名称" width="150" />
            <el-table-column label="省市区" width="200">
              <template #default="{ row }">
                {{ `${row.province}${row.city}${row.district}` }}
              </template>
            </el-table-column>
            <el-table-column prop="address" label="具体地址" min-width="200" show-overflow-tooltip />
            <el-table-column label="温度范围(°C)" width="150" align="center">
              <template #default="{ row }">
                <span v-if="row.minTemperature !== null && row.maxTemperature !== null">
                  {{ row.minTemperature }}° ~ {{ row.maxTemperature }}°
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="湿度范围(%)" width="150" align="center">
              <template #default="{ row }">
                <span v-if="row.minHumidity !== null && row.maxHumidity !== null">
                  {{ row.minHumidity }}% ~ {{ row.maxHumidity }}%
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="最大温差(°C)" width="120" align="center">
              <template #default="{ row }">
                <span v-if="row.maxTemperatureDifference !== null">
                  {{ row.maxTemperatureDifference }}°
                </span>
                <span v-else class="text-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column label="运行模式" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.operationMode === 0 ? 'success' : 'warning'">
                  {{ formatOperationMode(row.operationMode) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="在线状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag 
                  :type="row.onlineStatus === 1 ? 'success' : row.onlineStatus === 0 ? 'danger' : 'info'"
                >
                  {{ row.onlineStatus === 1 ? '在线' : row.onlineStatus === 0 ? '离线' : '未知' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="更新时间" width="160">
              <template #default="{ row }">
                {{ row.updatedTime ? new Date(row.updatedTime).toLocaleString() : '--' }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="View"
                  @click="handleView(row)"
                >
                  查看
                </el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  :icon="Setting"
                  @click="handleEditHumiture(row)"
                >
                  设置
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
    
    <!-- 温湿度设置弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        ref="humitureFormRef"
        :model="humitureForm"
        :rules="humitureFormRules"
        label-width="140px"
        label-position="right"
      >
        <!-- 设备信息展示 -->
        <el-row>
          <el-col :span="24">
            <el-alert
              :title="`正在为设备 ${humitureForm.cabinetName}(${humitureForm.cabinetCode}) 配置温湿度参数`"
              type="info"
              :closable="false"
              show-icon
              style="margin-bottom: 20px"
            />
          </el-col>
        </el-row>
        
        <!-- 温度设置 -->
        <el-row>
          <el-col :span="24">
            <el-divider content-position="left">
              <el-icon><Setting /></el-icon>
              温度设置
            </el-divider>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最低温度(°C)" prop="minTemperature">
              <el-input-number
                v-model="humitureForm.minTemperature"
                :min="-50"
                :max="100"
                :precision="2"
                placeholder="最低温度"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高温度(°C)" prop="maxTemperature">
              <el-input-number
                v-model="humitureForm.maxTemperature"
                :min="-50"
                :max="100"
                :precision="2"
                placeholder="最高温度"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row>
          <el-col :span="12">
            <el-form-item label="最大温差(°C)" prop="maxTemperatureDifference">
              <el-input-number
                v-model="humitureForm.maxTemperatureDifference"
                :min="0"
                :max="50"
                :precision="2"
                placeholder="最大温差"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 湿度设置 -->
        <el-row>
          <el-col :span="24">
            <el-divider content-position="left">
              <el-icon><Setting /></el-icon>
              湿度设置
            </el-divider>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最低湿度(%)" prop="minHumidity">
              <el-input-number
                v-model="humitureForm.minHumidity"
                :min="0"
                :max="100"
                :precision="2"
                placeholder="最低湿度"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高湿度(%)" prop="maxHumidity">
              <el-input-number
                v-model="humitureForm.maxHumidity"
                :min="0"
                :max="100"
                :precision="2"
                placeholder="最高湿度"
                style="width: 100%"
                controls-position="right"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 运行模式设置 -->
        <el-row>
          <el-col :span="24">
            <el-divider content-position="left">
              <el-icon><Setting /></el-icon>
              运行模式
            </el-divider>
          </el-col>
        </el-row>
        
        <el-row>
          <el-col :span="12">
            <el-form-item label="运行模式" prop="operationMode">
              <el-select 
                v-model="humitureForm.operationMode" 
                placeholder="请选择运行模式"
                style="width: 100%"
              >
                <el-option
                  v-for="option in operationModeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <!-- 参数说明 -->
        <el-row>
          <el-col :span="24">
            <el-alert
              title="参数说明"
              type="warning"
              :closable="false"
              style="margin-top: 15px"
            >
              <template #default>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>温度范围：-50°C 到 100°C，最低温度必须小于最高温度</li>
                  <li>湿度范围：0% 到 100%，最低湿度必须小于最高湿度</li>
                  <li>温差控制：设备内部最大允许温差，范围 0°C 到 50°C</li>
                  <li>自动模式：系统根据设定参数自动调节温湿度</li>
                  <li>手动模式：需要人工干预控制温湿度设备</li>
                </ul>
              </template>
            </el-alert>
          </el-col>
        </el-row>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirm">保存设置</el-button>
        </div>
      </template>
    </el-dialog>    
  </div>
</template>

<style lang='scss' scoped>
.humiture-settings-container {
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
  
  .text-muted {
    color: #909399;
    font-style: italic;
  }
}

// 弹窗样式
:deep(.el-dialog) {
  .dialog-footer {
    text-align: center;
  }
  
  .el-divider {
    margin: 15px 0;
    
    .el-divider__text {
      background-color: #f5f7fa;
      color: #606266;
      font-weight: 500;
    }
  }
}

// 覆盖 AreaSelect 组件内部的样式
:deep(.area-tree) {
  background-color: transparent;
  
  .el-tree-node__content {
    overflow: hidden;
    
    .el-tree-node__label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>