<script setup lang='ts'>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Delete, View, Setting } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";
import { transformPcaToTree } from "@/utils/area";

defineOptions({
  name: "CabinetManagement"
});

// 柜子数据接口（根据API返回数据调整）
interface CabinetData {
  id: number;
  cabinetCode: string;
  cabinetName: string;
  province: string;
  city: string;
  district: string;
  address: string;
  onlineStatus: number | null; // 1-在线, 0-离线, null-未知
  createTime?: string;
  updatedTime?: string;
}

// API响应接口
interface ApiResponse {
  code: number;
  msg: string;
  data: {
    records: CabinetData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

// 响应式数据
const loading = ref(false);
const tableData = ref<CabinetData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

//以下为省市区下拉框的实现
// 🔥 添加省市区数据源
const areaData = transformPcaToTree();
// 🔥 省份选项
const provinceOptions = computed(() => {
  return areaData.map(item => ({
    label: item.label,
    value: item.label
  }));
});
// 🔥 城市选项
const cityOptions = computed(() => {
  if (!deviceForm.value.province) return [];
  const province = areaData.find(item => item.label === deviceForm.value.province);
  return province ? province.children.map(item => ({
    label: item.label,
    value: item.label
  })) : [];
});
// 🔥 区域选项
const districtOptions = computed(() => {
  if (!deviceForm.value.province || !deviceForm.value.city) return [];
  const province = areaData.find(item => item.label === deviceForm.value.province);
  if (!province) return [];
  const city = province.children.find(item => item.label === deviceForm.value.city);
  return city ? city.children.map(item => ({
    label: item.label,
    value: item.label
  })) : [];
});
// 🔥 省份改变时清空城市和区域
const handleProvinceChange = () => {
  deviceForm.value.city = '';
  deviceForm.value.district = '';
};
// 🔥 城市改变时清空区域
const handleCityChange = () => {
  deviceForm.value.district = '';
};


// 分离区域筛选和表单搜索
const areaFilter = ref({
  province: '',
  city: '',
  district: ''
});
// 搜索表单（修改为新的字段）
const searchForm = ref({
  cabinetCode: '',
  cabinetName: '',
  //onlineStatus: null as number | null 
});

// 处理区域搜索事件，左侧areaSelect组件
const handleAreaSearch = (area: AreaNode) => {
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
  
  ElMessage.info(`区域筛选已设置为: ${label}`);
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  getCabinetList();
};

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    cabinetCode: '',
    cabinetName: '',
    //onlineStatus: null
  };
  handleSearch();
};
// 清空所有筛选条件
const handleClearAll = () => {
  searchForm.value = {
    cabinetCode: '',
    cabinetName: '',
    //onlineStatus: null
  };
  areaFilter.value = {
    province: '',
    city: '',
    district: ''
  };
  handleSearch();
};

// 新增设备相关数据
const dialogVisible = ref(false);
const dialogTitle = ref('新增设备');
const isEdit = ref(false);
// 设备表单数据
const deviceForm = ref({
  cabinetCode: '',
  cabinetName: '',
  province: '',
  city: '',
  district: '',
  address: '',
  // maxTemperature: null,//此处默认
  // minTemperature: null,//此处默认
  // maxHumidity: null,//此处默认
  // minHumidity: null,//此处默认
  // operationMode: 0,//此处默认
  // maxTemperatureDifference: null//此处默认
});
// 表单验证规则
const deviceFormRules = {
  cabinetCode: [
    { required: true, message: '请输入设备编号', trigger: 'blur' },
    { min: 2, max: 20, message: '设备编号长度为2-20个字符', trigger: 'blur' }
  ],
  cabinetName: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { min: 2, max: 50, message: '设备名称长度为2-50个字符', trigger: 'blur' }
  ],
  province: [
    { required: true, message: '请输入省份', trigger: 'change' }
  ],
  city: [
    { required: true, message: '请输入城市', trigger: 'change' }
  ],
  district: [
    { required: true, message: '请输入区域', trigger: 'change' }
  ],
  address: [
    { required: true, message: '请输入具体地址', trigger: 'blur' }
  ]
};
const deviceFormRef = ref();

// 从api获取数据
const getCabinetListApi = async (params: any = {}) => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // 添加搜索参数
    if (params.cabinetCode) queryParams.append('cabinetCode', params.cabinetCode);
    // 最终生成类似: /api/power/cabinet/page?cabinetCode=2
    if (params.cabinetName) queryParams.append('cabinetName', params.cabinetName);
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    // if (params.onlineStatus !== null && params.onlineStatus !== undefined) {
    //   queryParams.append('onlineStatus', params.onlineStatus.toString());
    // }
    
    // 构建完整的URL
    const baseUrl = `/api/power/cabinet/page`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('API请求URL:', url); // 添加日志查看请求URL
    
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
    console.error('API请求失败:', error);
    throw error;
  }
};

// 获取柜子列表
const getCabinetList = async () => {
  loading.value = true;
  try {
    // 调用真实的API
    const response = await getCabinetListApi({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value
    });
    
    // 处理API响应
    if (response.code === 200) {
      tableData.value = response.data.records;
      total.value = response.data.total;
      console.log('获取到的柜子数据:', tableData.value);
    } else {
      ElMessage.error(response.msg || '获取数据失败');
    }
    
  } catch (error) {
    ElMessage.error('获取柜子列表失败，请检查网络连接');
    console.error('获取柜子列表错误:', error);
    
    // 失败时显示模拟数据作为备用
    //tableData.value = mockData;
    //total.value = mockData.length;
  } finally {
    loading.value = false;
  }
};


// 打开新增设备弹窗
const handleAddDevice = () => {
  dialogTitle.value = '新增设备';
  isEdit.value = false;
  resetDeviceForm();
  dialogVisible.value = true;
  // 🔥 清除表单验证
  nextTick(() => {
    if (deviceFormRef.value) {
      deviceFormRef.value.clearValidate();
    }
  });
};
// 重置表单，取消新增设备时使用
const resetDeviceForm = () => {
  deviceForm.value = {
    cabinetCode: '',
    cabinetName: '',
    province: '',
    city: '',
    district: '',
    address: '',
    // maxTemperature: null,
    // minTemperature: null,
    // maxHumidity: null,
    // minHumidity: null,
    // operationMode: 0,
    // maxTemperatureDifference: null
  };
  if (deviceFormRef.value) {
    deviceFormRef.value.clearValidate();
  }
};
// 取消操作
const handleCancel = () => {
  dialogVisible.value = false;
  resetDeviceForm();
};
// 确认提交
const handleConfirm = async () => {
  if (!deviceFormRef.value) return;
  
  try {
    await deviceFormRef.value.validate();
    
    if (isEdit.value) {
      // 编辑设备
      await updateDevice();
    } else {
      // 新增设备
      await addDevice();
    }
    
    dialogVisible.value = false;
    resetDeviceForm();// 重置表单
    getCabinetList(); // 刷新列表
    
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};
// 新增设备API调用
const addDevice = async () => {
  try {
    // 这里调用新增设备的API
    // 构建请求体数据
    const requestData = {
      cabinetCode: deviceForm.value.cabinetCode,
      cabinetName: deviceForm.value.cabinetName,
      province: deviceForm.value.province,
      city: deviceForm.value.city,
      district: deviceForm.value.district,
      address: deviceForm.value.address,
      onlineStatus: 0, // 新增时默认在线状态为离线
      createTime: new Date().toISOString(),
      updatedTime: new Date().toISOString()
      // maxTemperature: deviceForm.value.maxTemperature,
      // minTemperature: deviceForm.value.minTemperature,
      // maxHumidity: deviceForm.value.maxHumidity,
      // minHumidity: deviceForm.value.minHumidity,
      // operationMode: deviceForm.value.operationMode,
      // maxTemperatureDifference: deviceForm.value.maxTemperatureDifference
    };
    
    console.log('发送新增设备请求:', requestData);

    // 发送POST请求到后端API
    const response = await fetch('/api/power/cabinet/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 如果需要认证，添加token
        // 'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // 处理API响应
    if (result.code === 200) {
      ElMessage.success('设备新增成功');
      console.log('新增设备成功:', result);
    } else {
      ElMessage.error(result.msg || '设备新增失败');
      throw new Error(result.msg || '设备新增失败');
    }
    
  } catch (error) {
    ElMessage.error('设备新增失败，请检查网络连接');
    console.error('新增设备错误:', error);
    throw error;
  }
};
// 更新设备API调用
const updateDevice = async () => {
  try {
    // 这里调用更新设备的API
    // const response = await updateDeviceApi(deviceForm.value);
    
    ElMessage.success('设备更新成功');
    console.log('更新设备数据:', deviceForm.value);
    
  } catch (error) {
    ElMessage.error('设备更新失败');
    console.error('更新设备错误:', error);
    throw error;
  }
};



// 一键开柜
const handleOpenCabinet = async (row: CabinetData) => {
  // 检查设备在线状态
  if (row.onlineStatus !== 1) {
    ElMessage.warning('设备离线，无法执行开柜操作');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要对设备 "${row.cabinetName}" 执行一键开柜操作吗？`,
      '开柜确认',
      {
        confirmButtonText: '确定开柜',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 这里调用开柜API
    // await openCabinetApi(row.id);
    
    ElMessage.success('开柜命令已发送，请检查设备状态');
    
  } catch {
    ElMessage.info('已取消开柜操作');
  }
};

// 删除柜子API调用
const deleteCabinetApi = async (id: number) => {
  try {
    const response = await fetch(`/api/power/cabinet/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // 如果需要认证，添加token
        // 'Authorization': `Bearer ${getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('删除设备API请求失败:', error);
    throw error;
  }
};
// 删除柜子（修改注释和提示文本）
const handleDelete = async (row: CabinetData) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除设备 "${row.cabinetName}" 吗？删除后无法恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 调用删除API
    const result = await deleteCabinetApi(row.id);
    
    // 处理API响应
    if (result.code === 200) {
      ElMessage.success('设备删除成功');
      console.log('删除设备成功:', result);
      // 刷新列表
      getCabinetList();
    } else {
      ElMessage.error(result.msg || '设备删除失败');
    }
    
  } catch (error) {
    if (error !== 'cancel') { // 用户取消删除时不显示错误信息
      ElMessage.error('设备删除失败，请检查网络连接');
      console.error('删除设备错误:', error);
    } else {
      ElMessage.info('已取消删除');
    }
  }
};

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getCabinetList();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  getCabinetList();
};

// 面板大小改变回调，已弃用
const handlePanelResize = (width: number) => {
  console.log('Panel width changed to:', width);
  // 可以在这里保存用户的布局偏好到 localStorage
  localStorage.setItem('cabinet-sidebar-width', width.toString());
};

// 生命周期（修改函数调用）
onMounted(() => {
  getCabinetList();
});
</script>

<template>
  <div class="cabinet-management-container">
    <div>
      <!-- 添加事件监听 -->
      <AreaSelect @area-search="handleAreaSearch" />
    </div>
    <div class="content">
      <div class="main-content">
        <!-- 搜索区域（修改为柜子相关字段） -->
        <el-card class="search-card">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item label="设备编号">
              <el-input 
                v-model="searchForm.cabinetCode" 
                placeholder="请输入设备编号" 
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="设备名称">
              <el-input 
                v-model="searchForm.cabinetName" 
                placeholder="请输入设备名称" 
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <!-- <el-form-item label="在线状态">
              <el-select 
                v-model="searchForm.onlineStatus" 
                placeholder="请选择状态"
                clearable
                style="width: 120px"
              >
                <el-option label="在线" value="1" />
                <el-option label="离线" value="0" />
              </el-select>
            </el-form-item> -->
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

        <!-- 表格区域（修改表头和数据绑定） -->
        <el-card class="table-card">
          <template #header>
            <div class="card-header">
              <span class="title">设备列表</span>
              <el-button type="primary" size="small" @click="handleAddDevice">
                新增设备
              </el-button>
            </div>
          </template>

          <el-table 
            :data="tableData" 
            v-loading="loading"
            style="width: 100%"
            stripe
            border
          >
            <el-table-column prop="cabinetCode" label="设备编号" min-width="100" />
            <el-table-column prop="cabinetName" label="设备名称" min-width="100" />
            <el-table-column label="省市区" min-width="170">
              <template #default="{ row }">
                {{ `${row.province}${row.city}${row.district}` }}
              </template>
            </el-table-column>
            <el-table-column prop="address" label="具体地址" min-width="220" show-overflow-tooltip />
            <el-table-column label="在线状态" min-width="100" align="center">
              <template #default="{ row }">
                <el-tag 
                  :type="row.onlineStatus === 1 ? 'success' : row.onlineStatus === 0 ? 'danger' : 'info'"
                >
                  {{ row.onlineStatus === 1 ? '在线' : row.onlineStatus === 0 ? '离线' : '未知' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="300" fixed="right">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="Setting"
                  @click="handleOpenCabinet(row)"
                  :disabled="row.onlineStatus !== 1"
                >
                  一键开柜
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  :icon="Delete"
                  @click="handleDelete(row)"
                >
                  删除
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
    
    <!-- 新增/编辑设备弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form
        ref="deviceFormRef"
        :model="deviceForm"
        :rules="deviceFormRules"
        label-width="120px"
        label-position="right"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备编号" prop="cabinetCode">
              <el-input
                v-model="deviceForm.cabinetCode"
                placeholder="请输入设备编号"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="cabinetName">
              <el-input
                v-model="deviceForm.cabinetName"
                placeholder="请输入设备名称"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="省份" prop="province">
              <el-select
                v-model="deviceForm.province"
                placeholder="请选择省份"
                style="width: 100%"
                @change="handleProvinceChange"
              >
                <el-option
                  v-for="option in provinceOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="城市" prop="city">
              <el-select
                v-model="deviceForm.city"
                placeholder="请选择城市"
                style="width: 100%"
                :disabled="!deviceForm.province"
                @change="handleCityChange"
              >
                <el-option
                  v-for="option in cityOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="区域" prop="district">
              <el-select
                v-model="deviceForm.district"
                placeholder="请选择区域"
                style="width: 100%"
                :disabled="!deviceForm.city"
              >
                <el-option
                  v-for="option in districtOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="具体地址" prop="address">
          <el-input
            v-model="deviceForm.address"
            placeholder="请输入具体地址"
            clearable
          />
        </el-form-item>
        
        <!-- <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最高温度">
              <el-input-number
                v-model="deviceForm.maxTemperature"
                :min="-50"
                :max="100"
                :precision="2"
                placeholder="最高温度"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最低温度">
              <el-input-number
                v-model="deviceForm.minTemperature"
                :min="-50"
                :max="100"
                :precision="2"
                placeholder="最低温度"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最高湿度">
              <el-input-number
                v-model="deviceForm.maxHumidity"
                :min="0"
                :max="100"
                :precision="2"
                placeholder="最高湿度"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最低湿度">
              <el-input-number
                v-model="deviceForm.minHumidity"
                :min="0"
                :max="100"
                :precision="2"
                placeholder="最低湿度"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="运行模式">
              <el-select v-model="deviceForm.operationMode" style="width: 100%">
                <el-option label="自动模式" :value="0" />
                <el-option label="手动模式" :value="1" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大温差">
              <el-input-number
                v-model="deviceForm.maxTemperatureDifference"
                :min="0"
                :max="50"
                :precision="2"
                placeholder="最大温差"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row> -->
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </div>
      </template>
    </el-dialog>    
  </div>
</template>

<style lang='scss' scoped>
.cabinet-management-container {
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
            margin-bottom: 18px; // 设置换行时的行距
            margin-right: 12px;  // 设置同行表单项之间的间距
          }
          
          // 最后一行不需要底部间距
          // .el-form-item:last-child,
          // .el-form-item:nth-last-child(-n+2) { // 最后两个表单项（按钮）
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

// 表格样式调整
:deep(.el-table) {
  .el-button + .el-button {
    margin-left: 4px;
  }
}
</style>