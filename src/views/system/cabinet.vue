<script setup lang='ts'>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Delete, View, Setting, Box } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";
import { useAreaStore } from "@/store/modules/area"; // 导入 AreaStore
import { useAreaSelect } from "@/utils/useAreaSelect";
import { usePageSearch } from "@/utils/useAreaFilter"; 


// 导入 API 方法和类型
import { 
  getCabinetList as getCabinetListApi, 
  addCabinet as addCabinetApi, 
  updateCabinet as updateCabinetApi, 
  deleteCabinet as deleteCabinetApi,
  getOnlineDevices as getOnlineDevicesApi,
  openCabinet as openCabinetApi,
  checkDeviceStatus as checkDeviceStatusApi,
  type CabinetData,
  type CabinetFormData,
  type CabinetQueryParams
} from '@/api/cabinet';

// 🔥 新增：导入物品相关API
import { 
  getMaterialDetailsByCabinetId as getMaterialDetailsByCabinetIdApi,
  type MaterialData
} from '@/api/item';

defineOptions({
  name: "CabinetManagement"
});

// 使用 AreaStore
const areaStore = useAreaStore();


// 响应式数据
const loading = ref(false);
const tableData = ref<CabinetData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 设备表单数据
const deviceForm = ref<CabinetFormData>({
  cabinetCode: '',
  cabinetName: '',
  province: '',
  city: '',
  district: '',
  address: '',
});
//以下为省市区下拉框的实现
// 使用通用的省市区选择器工具类
const {
  provinceOptions,
  cityOptions,
  districtOptions,
  handleProvinceChange,
  handleCityChange,
  validateAreaPermission,
  initAreaSelectData,
  hasPermissionData
} = useAreaSelect(deviceForm);

// 使用页面搜索工具类
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
  },
  // 搜索回调函数
  () => {
    currentPage.value = 1;
    getCabinetList();
  }
);

// 新增设备相关数据
const dialogVisible = ref(false);
const dialogTitle = ref('新增设备');
const isEdit = ref(false);

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

// 🔥 新增：查看柜子物品相关数据
const viewDialogVisible = ref(false);
const currentViewCabinet = ref<CabinetData | null>(null);
const cabinetMaterials = ref<MaterialData[]>([]);
const materialsLoading = ref(false);

// 🔥 新增：查看柜子功能
const handleView = async (row: CabinetData) => {
  try {
    console.log('查看设备:', row);
    currentViewCabinet.value = { ...row };
    viewDialogVisible.value = true;
    
    // 加载柜子物品
    await loadCabinetMaterials(row.id);
    
  } catch (error) {
    console.error('查看设备详情错误:', error);
    ElMessage.error('加载设备详情失败');
    viewDialogVisible.value = false;
  }
};
// 🔥 新增：加载柜子物品列表
const loadCabinetMaterials = async (cabinetId: number) => {
  materialsLoading.value = true;
  try {
    const result = await getMaterialDetailsByCabinetIdApi(cabinetId);
    
    if (result.code === 200) {
      // 🔥 修改：过滤掉已删除的物品
      cabinetMaterials.value = result.data.filter(item => item.isDelete === 1);
      console.log('获取柜子物品详细信息成功:', cabinetMaterials.value);
    } else {
      ElMessage.error(result.msg || '获取柜子物品失败');
      cabinetMaterials.value = [];
    }
    
  } catch (error) {
    ElMessage.error('获取柜子物品失败，请检查网络连接');
    console.error('获取柜子物品错误:', error);
    cabinetMaterials.value = [];
  } finally {
    materialsLoading.value = false;
  }
};

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

// 🔥 新增：关闭查看弹窗
const closeViewDialog = () => {
  viewDialogVisible.value = false;
  currentViewCabinet.value = null;
  cabinetMaterials.value = [];
};

// 更新设备在线状态（使用 API 方法）
const updateDeviceOnlineStatus = async () => {
  try {
    console.log('开始更新设备在线状态...');
    
    // 使用 API 方法
    const response = await getOnlineDevicesApi();
    
    if (response.code === 200) {
      const onlineDeviceCodes = response.data;
      console.log('在线设备列表:', onlineDeviceCodes);
      
      tableData.value = tableData.value.map(device => {
        const isOnline = onlineDeviceCodes.includes(device.cabinetCode);
        return {
          ...device,
          onlineStatus: isOnline ? 1 : 0
        };
      });
      
      console.log('设备在线状态更新完成');
      
      const onlineCount = tableData.value.filter(device => device.onlineStatus === 1).length;
      const totalCount = tableData.value.length;
      console.log(`在线状态更新完成: ${onlineCount}/${totalCount} 设备在线`);
      
    } else {
      console.error('获取在线设备列表失败:', response.msg);
      ElMessage.error(response.msg || '获取在线设备列表失败');
    }
    
  } catch (error) {
    console.error('更新设备在线状态失败:', error);
    ElMessage.error('更新设备在线状态失败，请检查网络连接');
  }
};

// 检查单个设备状态（使用 API 方法）
const handleCheckDeviceStatus = async (row: CabinetData) => {
  const loadingMessage = ElMessage({
    message: `正在检查设备 "${row.cabinetName}" 的在线状态...`,
    type: 'info',
    duration: 0
  });
  
  try {
    // 使用 API 方法
    const result = await checkDeviceStatusApi(row.cabinetCode);
    
    loadingMessage.close();
    
    if (result.code === 200) {
      const isOnline = result.data;
      const statusText = isOnline ? '在线' : '离线';
      const statusType = isOnline ? 'success' : 'warning';
      
      const deviceIndex = tableData.value.findIndex(device => device.cabinetCode === row.cabinetCode);
      if (deviceIndex !== -1) {
        tableData.value[deviceIndex].onlineStatus = isOnline ? 1 : 0;
      }
      
      ElMessage({
        message: `设备 "${row.cabinetName}" 当前状态：${statusText}`,
        type: statusType,
        duration: 3000
      });
      
      console.log(`设备 ${row.cabinetCode} 状态检查完成:`, statusText);
      
    } else {
      ElMessage.error(result.msg || '设备状态检查失败');
      console.error('设备状态检查失败:', result);
    }
    
  } catch (error) {
    loadingMessage.close();
    ElMessage.error('设备状态检查失败，请检查网络连接');
    console.error('设备状态检查API调用失败:', error);
  }
};

// 获取柜子列表（使用 API 方法）
const getCabinetList = async () => {
  loading.value = true;
  try {
    // 使用 API 方法和类型
    const params: CabinetQueryParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value
    };
    
    const response = await getCabinetListApi(params);
    
    if (response.code === 200) {
      tableData.value = response.data.records.map(item => ({
        ...item,
        onlineStatus: null
      }));
      total.value = response.data.total;
      console.log('获取到的柜子数据:', tableData.value);
      
      await updateDeviceOnlineStatus();
      
    } else {
      ElMessage.error(response.msg || '获取数据失败');
    }
    
  } catch (error) {
    ElMessage.error('获取柜子列表失败，请检查网络连接');
    console.error('获取柜子列表错误:', error);
  } finally {
    loading.value = false;
  }
};



// 打开新增设备弹窗
const handleAddDevice = () => {
  // 检查是否有权限数据
  if (!hasPermissionData.value) {
    ElMessage.warning('权限数据未加载，请稍后再试');
    return;
  }
  
  dialogTitle.value = '新增设备';
  isEdit.value = false;
  resetDeviceForm();
  dialogVisible.value = true;
  
  // 清除表单验证
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

    // 使用工具类的权限验证
    const { province, city, district } = deviceForm.value;
    if (!validateAreaPermission(province, city, district)) {
      ElMessage.error('您没有权限在该区域新增设备，请重新选择');
      return;
    }
    
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


// 新增设备（使用 API 方法）
const addDevice = async () => {
  try {
    // 使用 API 方法
    const result = await addCabinetApi(deviceForm.value);
    
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
// 更新设备（使用 API 方法）
const updateDevice = async () => {
  try {
    // 使用 API 方法
    const result = await updateCabinetApi(deviceForm.value);
    
    if (result.code === 200) {
      ElMessage.success('设备更新成功');
      console.log('更新设备成功:', result);
    } else {
      ElMessage.error(result.msg || '设备更新失败');
      throw new Error(result.msg || '设备更新失败');
    }
    
  } catch (error) {
    ElMessage.error('设备更新失败，请检查网络连接');
    console.error('更新设备错误:', error);
    throw error;
  }
};



// 一键开柜（使用 API 方法）
const handleOpenCabinet = async (row: CabinetData) => {
  if (row.onlineStatus === null || row.onlineStatus === undefined) {
    ElMessage.warning('设备状态未知，无法执行开柜操作');
    return;
  }
  
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
    
    const loadingMessage = ElMessage({
      message: '正在发送开柜命令...',
      type: 'info',
      duration: 0
    });
    
    try {
      // 使用 API 方法
      const result = await openCabinetApi(row.cabinetCode, 'open');
      
      loadingMessage.close();
      
      if (result.code === 200) {
        ElMessage.success(`设备 "${row.cabinetName}" 开柜命令发送成功！`);
        console.log('开柜成功:', result);
        
        setTimeout(() => {
          updateDeviceOnlineStatus();
        }, 2000);
        
      } else {
        ElMessage.error(result.msg || '开柜命令发送失败');
        console.error('开柜失败:', result);
      }
      
    } catch (error) {
      loadingMessage.close();
      ElMessage.error('开柜命令发送失败，请检查网络连接');
      console.error('开柜API调用失败:', error);
    }
    
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消开柜操作');
    }
  }
};

// 删除柜子（使用 API 方法）
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
    
    // 使用 API 方法
    const result = await deleteCabinetApi(row.id);
    
    if (result.code === 200) {
      ElMessage.success('设备删除成功');
      console.log('删除设备成功:', result);
      getCabinetList();
    } else {
      ElMessage.error(result.msg || '设备删除失败');
    }
    
  } catch (error) {
    if (error !== 'cancel') {
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


// 生命周期（修改函数调用）
onMounted(async () => {
  // 使用工具类初始化权限数据
  await initAreaSelectData();
  // 获取柜子列表数据
  await getCabinetList();
  
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

              <div class="header-actions">
                <!-- 刷新在线状态按钮 -->
                <el-button 
                  type="success" 
                  size="small" 
                  @click="updateDeviceOnlineStatus"
                  :loading="loading"
                >
                  刷新状态
                </el-button>
                <el-button type="primary" size="small" @click="handleAddDevice">
                  新增设备
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
                  :type="row.onlineStatus === 1 ? 'success' : 
                        row.onlineStatus === 0 ? 'danger' : 'info'"
                >
                  {{ row.onlineStatus === 1 ? '在线' : 
                    row.onlineStatus === 0 ? '离线' : '未知' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="300" fixed="right">
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
                  type="info" 
                  size="small" 
                  :icon="View"
                  @click="handleCheckDeviceStatus(row)"
                >
                  检查状态
                </el-button>                
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
                @change="handleProvinceChange(deviceForm)"
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
                @change="handleCityChange(deviceForm)"
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
        
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </div>
      </template>
    </el-dialog>   

    <!-- 🔥 新增：查看柜子物品弹窗 -->
    <el-dialog
      v-model="viewDialogVisible"
      :title="`${currentViewCabinet?.cabinetName || ''} - 柜子详情`"
      width="800px"
      :close-on-click-modal="false"
      @close="closeViewDialog"
    >
      <div class="cabinet-view-container">
        <!-- 柜子基本信息 -->
        <div class="cabinet-info-section">
          <div class="cabinet-basic-info">
            <div class="info-row">
              <div class="info-item">
                <span class="label">设备编号:</span>
                <span class="value">{{ currentViewCabinet?.cabinetCode }}</span>
              </div>
              <div class="info-item">
                <span class="label">设备名称:</span>
                <span class="value">{{ currentViewCabinet?.cabinetName }}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="info-item">
                <span class="label">所在地区:</span>
                <span class="value">{{ currentViewCabinet?.province }}{{ currentViewCabinet?.city }}{{ currentViewCabinet?.district }}</span>
              </div>
              <div class="info-item">
                <span class="label">具体地址:</span>
                <span class="value">{{ currentViewCabinet?.address }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 物品列表 -->
        <div class="materials-section">
          <div class="section-header">
            <h3 class="section-title">物品列表</h3>
            <el-tag type="info" size="small">
              共 {{ cabinetMaterials.length }} 件物品
            </el-tag>
          </div>
          
          <div class="materials-content" v-loading="materialsLoading">
            <div v-if="cabinetMaterials.length > 0" class="materials-list">
              <div 
                v-for="(material, index) in cabinetMaterials" 
                :key="material.id"
                class="material-item"
              >
                <div class="material-icon">
                  <el-icon><Box /></el-icon>
                </div>
                <div class="material-info">
                  <div class="material-header">
                    <span class="material-name">{{ material.materialName }}</span>
                    <el-tag type="primary" size="small">{{ material.materialCode }}</el-tag>
                  </div>
                  <div class="material-details">
                    <div class="detail-item">
                      <span class="detail-label">RFID:</span>
                      <span class="detail-value">{{ material.rfid }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">实验日期:</span>
                      <span class="detail-value">{{ material.experimentDate }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">创建时间:</span>
                      <span class="detail-value">{{ formatDateTime(material.createTime) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="empty-materials">
              <el-icon class="empty-icon"><Box /></el-icon>
              <span class="empty-text">该柜子暂无物品</span>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeViewDialog">关闭</el-button>
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
          // 头部操作按钮样式
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

.cabinet-view-container {
  .cabinet-info-section {
    margin-bottom: 20px;
    
    .cabinet-basic-info {
      background-color: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      
      .info-row {
        display: flex;
        margin-bottom: 12px;
        gap: 40px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .info-item {
          flex: 1;
          display: flex;
          align-items: center;
          
          .label {
            color: #606266;
            font-weight: 500;
            margin-right: 8px;
            min-width: 80px;
          }
          
          .value {
            color: #303133;
            font-weight: 400;
          }
        }
      }
    }
  }
  
  .materials-section {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      .section-title {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: #303133;
      }
    }
    
    .materials-content {
      .materials-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 16px;
        max-height: 400px;
        overflow-y: auto;
        
        .material-item {
          background-color: #ffffff;
          border: 1px solid #e4e7ed;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.3s ease;
          
          &:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            border-color: #409eff;
          }
          
          .material-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background-color: #f0f9ff;
            border-radius: 50%;
            margin-bottom: 12px;
            
            .el-icon {
              font-size: 20px;
              color: #409eff;
            }
          }
          
          .material-info {
            .material-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              
              .material-name {
                font-weight: 500;
                color: #303133;
                font-size: 14px;
              }
            }
            
            .material-details {
              .detail-item {
                display: flex;
                margin-bottom: 6px;
                
                &:last-child {
                  margin-bottom: 0;
                }
                
                .detail-label {
                  color: #909399;
                  font-size: 12px;
                  min-width: 70px;
                }
                
                .detail-value {
                  color: #606266;
                  font-size: 12px;
                  flex: 1;
                }
              }
            }
          }
        }
      }
      
      .empty-materials {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: #909399;
        
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .empty-text {
          font-size: 14px;
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