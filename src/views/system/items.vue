<script setup lang='ts'>
import { ref, onMounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Delete, View, Setting, Plus } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area"; // 添加类型导入
import { useAreaStore } from "@/store/modules/area";
import { useAreaSelect } from "@/utils/useAreaSelect";
import { usePageSearch } from "@/utils/useAreaFilter";

// 🔥 新增：导入物料相关的 API 方法和类型
import { 
  getMaterialList as getMaterialListApi, 
  addMaterial as addMaterialApi, 
  updateMaterial as updateMaterialApi, 
  deleteMaterial as deleteMaterialApi,
  type MaterialData,
  type MaterialFormData,
  type MaterialQueryParams
} from '@/api/item';

// 🔥 新增：导入柜子相关的 API 方法和类型（复用）
import { 
  getCabinetList as getCabinetListApi,
  type CabinetData
} from '@/api/cabinet';

defineOptions({
  name: "ItemsManagement"
});


// 响应式数据
const loading = ref(false);
const tableData = ref<MaterialData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);


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
    //cabinetCode: '',
    cabinetName: '',
    materialCode: '',
    materialName: '',
    //rfid: '',
    //experimentDate: '',
    //isDelete: ''
  },
  // 搜索回调函数
  () => {
    currentPage.value = 1;
    getItemList();
  }
);

// 🔥 新增：柜子选择相关数据
const cabinetSelectDialogVisible = ref(false);
const cabinetListData = ref<CabinetData[]>([]);
const cabinetLoading = ref(false);
const cabinetCurrentPage = ref(1);
const cabinetPageSize = ref(10);
const cabinetTotal = ref(0);

// 🔥 新增：柜子搜索表单
const cabinetSearchForm = ref({
  cabinetCode: '',
  cabinetName: ''
});

// 物料表单数据
const itemForm = ref<MaterialFormData>({
  cabinetId: null,
  cabinetCode: '',
  cabinetName: '',
  materialCode: '',
  materialName: '',
  rfid: '',
  experimentDate: '',
  province: '',
  city: '',
  district: '',
  address: '',
  isDelete: 1
});

const {
  provinceOptions,
  cityOptions,
  districtOptions,
  handleProvinceChange,
  handleCityChange,
  validateAreaPermission,
  initAreaSelectData,
  hasPermissionData
} = useAreaSelect(itemForm);

const handleItemProvinceChange = () => {
  handleProvinceChange(itemForm.value);
};

const handleItemCityChange = () => {
  handleCityChange(itemForm.value);
};


// 新增物料相关数据
const dialogVisible = ref(false);
const dialogTitle = ref('新增物料');
const isEdit = ref(false);
const currentEditItem = ref<MaterialData | null>(null);

// 🔥 修改表单验证规则，改为下拉选择并添加权限验证
const validateAreaPermissionRule = (rule: any, value: any, callback: any) => {
  const { province, city, district } = itemForm.value;
  
  if (province) {
    if (!validateAreaPermission(province, city, district)) {
      callback(new Error('您没有权限在该区域创建物料'));
    } else {
      callback();
    }
  } else {
    callback();
  }
};
// 🔥 修改：表单验证规则（移除柜子相关字段的手动验证）
const itemFormRules = {
  // 🔥 新增：柜子选择验证
  cabinetId: [
    { required: true, message: '请选择所属柜子', trigger: 'change' }
  ],
  // 🔥 保留：物料相关字段验证
  materialCode: [
    { required: true, message: '请输入物料编号', trigger: 'blur' },
    { min: 3, max: 20, message: '物料编号长度为3-20个字符', trigger: 'blur' }
  ],
  materialName: [
    { required: true, message: '请输入物料名称', trigger: 'blur' },
    { min: 2, max: 50, message: '物料名称长度为2-50个字符', trigger: 'blur' }
  ],
  rfid: [
    { required: true, message: '请输入RFID标签', trigger: 'blur' }
  ],
  experimentDate: [
    { required: true, message: '请选择实验日期', trigger: 'change' }
  ]
};

const itemFormRef = ref();

// 状态选项
const deleteStatusOptions = [
  { label: '正常', value: 1 },
  { label: '已删除', value: 0 }
];


// 🔥 修改：获取物料列表（使用 API 方法）
const getItemList = async () => {
  loading.value = true;
  try {
    // 🔥 使用 API 方法和类型
    const params: MaterialQueryParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value
    };
    
    console.log('物料搜索参数:', params);

    const response = await getMaterialListApi(params);
    
    if (response.code === 200) {
      tableData.value = response.data.records;
      total.value = response.data.total;
      console.log('获取到的物料数据:', tableData.value);
    } else {
      ElMessage.error(response.msg || '获取数据失败');
    }
    
  } catch (error) {
    ElMessage.error('获取物料列表失败，请检查网络连接');
    console.error('获取物料列表错误:', error);
  } finally {
    loading.value = false;
  }
};

// 🔥 新增：获取柜子列表
const getCabinetList = async () => {
  cabinetLoading.value = true;
  try {
    const response = await getCabinetListApi({
      pageNum: cabinetCurrentPage.value,
      pageSize: cabinetPageSize.value,
      ...cabinetSearchForm.value
    });
    
    if (response.code === 200) {
      cabinetListData.value = response.data.records;
      cabinetTotal.value = response.data.total;
      console.log('获取到的柜子数据:', cabinetListData.value);
    } else {
      ElMessage.error(response.msg || '获取柜子列表失败');
    }
    
  } catch (error) {
    ElMessage.error('获取柜子列表失败，请检查网络连接');
    console.error('获取柜子列表错误:', error);
  } finally {
    cabinetLoading.value = false;
  }
};

// 🔥 新增：打开柜子选择弹窗
const handleSelectCabinet = () => {
  cabinetSelectDialogVisible.value = true;
  cabinetCurrentPage.value = 1;
  cabinetSearchForm.value = {
    cabinetCode: '',
    cabinetName: ''
  };
  getCabinetList();
};

// 🔥 新增：确认选择柜子
const handleConfirmCabinetSelect = (cabinet: CabinetData) => {
  itemForm.value.cabinetId = cabinet.id;
  itemForm.value.cabinetCode = cabinet.cabinetCode;
  itemForm.value.cabinetName = cabinet.cabinetName;
  itemForm.value.province = cabinet.province;
  itemForm.value.city = cabinet.city;
  itemForm.value.district = cabinet.district;
  itemForm.value.address = cabinet.address;
  
  cabinetSelectDialogVisible.value = false;
  
  ElMessage.success(`已选择柜子: ${cabinet.cabinetName}`);
  console.log('选择的柜子:', cabinet);
};

// 🔥 新增：清空选择的柜子
const handleClearCabinetSelect = () => {
  itemForm.value.cabinetId = null;
  itemForm.value.cabinetCode = '';
  itemForm.value.cabinetName = '';
  itemForm.value.province = '';
  itemForm.value.city = '';
  itemForm.value.district = '';
  itemForm.value.address = '';
  
  ElMessage.info('已清空柜子选择');
};

// 🔥 新增：柜子搜索
const handleCabinetSearch = () => {
  cabinetCurrentPage.value = 1;
  getCabinetList();
};

// 🔥 新增：重置柜子搜索
const handleCabinetReset = () => {
  cabinetSearchForm.value = {
    cabinetCode: '',
    cabinetName: ''
  };
  handleCabinetSearch();
};

// 🔥 新增：柜子列表分页
const handleCabinetPageChange = (page: number) => {
  cabinetCurrentPage.value = page;
  getCabinetList();
};

const handleCabinetSizeChange = (size: number) => {
  cabinetPageSize.value = size;
  cabinetCurrentPage.value = 1;
  getCabinetList();
};


// 打开新增物料弹窗
const handleAddItem = () => {
  // 检查是否有权限数据
  if (!hasPermissionData.value) {
    ElMessage.warning('权限数据未加载，请稍后再试');
    return;
  }

  dialogTitle.value = '新增物料';
  isEdit.value = false;
  resetItemForm();
  dialogVisible.value = true;

  // 清除表单验证
  nextTick(() => {
    if (itemFormRef.value) {
      itemFormRef.value.clearValidate();
    }
  });
};

// 🔥 修改：重置表单
const resetItemForm = () => {
  itemForm.value = {
    cabinetId: null,
    cabinetCode: '',
    cabinetName: '',
    materialCode: '',
    materialName: '',
    rfid: '',
    experimentDate: '',
    province: '',
    city: '',
    district: '',
    address: '',
    isDelete: 1
  };
  currentEditItem.value = null;
  if (itemFormRef.value) {
    itemFormRef.value.clearValidate();
  }
};

// 取消操作
const handleCancel = () => {
  dialogVisible.value = false;
  resetItemForm();
};

// 🔥 修改：确认提交（移除省市区权限验证）
const handleConfirm = async () => {
  if (!itemFormRef.value) return;
  
  try {
    await itemFormRef.value.validate();
    
    if (isEdit.value) {
      await updateItem();
    } else {
      await addItem();
    }
    
    dialogVisible.value = false;
    resetItemForm();
    getItemList();
    
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 🔥 修改：新增物料（使用 API 方法）
const addItem = async () => {
  try {
    // 🔥 使用 API 方法
    const result = await addMaterialApi(itemForm.value);
    
    if (result.code === 200) {
      ElMessage.success('物料新增成功');
      console.log('新增物料成功:', result);
    } else {
      ElMessage.error(result.msg || '物料新增失败');
      throw new Error(result.msg || '物料新增失败');
    }
    
  } catch (error) {
    ElMessage.error('物料新增失败，请检查网络连接');
    console.error('新增物料错误:', error);
    throw error;
  }
};

// 🔥 修改：更新物料（使用 API 方法）
const updateItem = async () => {
  try {
    if (!currentEditItem.value?.id) {
      throw new Error('缺少物料ID，无法更新');
    }

    const requestData: MaterialFormData = {
      ...itemForm.value,
      id: currentEditItem.value.id
    };
    
    // 🔥 使用 API 方法
    const result = await updateMaterialApi(requestData);
    
    if (result.code === 200) {
      ElMessage.success('物料更新成功');
      console.log('更新物料成功:', result);
    } else {
      ElMessage.error(result.msg || '物料更新失败');
      throw new Error(result.msg || '物料更新失败');
    }
    
  } catch (error) {
    ElMessage.error('物料更新失败，请检查网络连接');
    console.error('更新物料错误:', error);
    throw error;
  }
};


// 🔥 修改：删除物料（使用 API 方法）
const handleDelete = async (row: MaterialData) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除物料 "${row.materialName}" 吗？删除后无法恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 🔥 使用 API 方法
    const result = await deleteMaterialApi(row.id);
    
    if (result.code === 200) {
      ElMessage.success('物料删除成功');
      console.log('删除物料成功:', result);
      getItemList();
    } else {
      ElMessage.error(result.msg || '物料删除失败');
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('物料删除失败，请检查网络连接');
      console.error('删除物料错误:', error);
    } else {
      ElMessage.info('已取消删除');
    }
  }
};

// 🔥 修改：编辑物料
const handleEdit = (row: MaterialData) => {
  dialogTitle.value = '编辑物料';
  isEdit.value = true;
  currentEditItem.value = row;
  
  // 填充表单数据
  itemForm.value = {
    cabinetId: row.cabinetId,
    cabinetCode: row.cabinetCode,
    cabinetName: row.cabinetName,
    materialCode: row.materialCode,
    materialName: row.materialName,
    rfid: row.rfid,
    experimentDate: row.experimentDate,
    province: row.province,
    city: row.city,
    district: row.district,
    address: row.address,
    isDelete: row.isDelete
  };
  
  dialogVisible.value = true;
};

// 查看物料详情
const handleView = (row: MaterialData) => {
  ElMessage.info(`查看物料: ${row.materialName}`);
};

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getItemList();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  getItemList();
};

// 格式化删除状态
const formatDeleteStatus = (isDelete: number) => {
  return isDelete === 1 ? '正常' : '已删除';
};

// 生命周期
onMounted(async () => {
  // 🔥 使用工具类初始化权限数据
  await initAreaSelectData();
  // 获取物料列表
  await getItemList();
});
</script>

<template>
  <div class="items-management-container">
    <!-- 添加事件监听 -->
    <AreaSelect @area-search="handleAreaSearch" />
    
    <div class="content">
      <div class="main-content">
        <!-- 搜索区域 -->
        <el-card class="search-card">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <!-- <el-form-item label="柜子编号">
              <el-input 
                v-model="searchForm.cabinetCode" 
                placeholder="请输入柜子编号" 
                clearable
                style="width: 150px"
              />
            </el-form-item> -->
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
            <!-- <el-form-item label="RFID标签">
              <el-input 
                v-model="searchForm.rfid" 
                placeholder="请输入RFID标签" 
                clearable
                style="width: 150px"
              />
            </el-form-item> -->
            <!-- 移除省市区输入框 -->
            <!-- <el-form-item label="实验日期">
              <el-date-picker
                v-model="searchForm.experimentDate"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 150px"
              />
            </el-form-item> -->
            <!-- <el-form-item label="状态">
              <el-select 
                v-model="searchForm.isDelete" 
                placeholder="请选择状态"
                clearable
                style="width: 100px"
              >
                <el-option
                  v-for="option in deleteStatusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item> -->
            <el-form-item>
              <el-button type="primary" @click="handleSearch">
                搜索
              </el-button>
              <el-button @click="handleReset">
                重置
              </el-button>
              <!-- 🔥 修改10：可选择添加清空所有按钮 -->
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
              <span class="title">物料列表</span>
              <el-button type="primary" size="small" :icon="Plus" @click="handleAddItem">
                新增物料
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
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="cabinetCode" label="柜子编号" width="120" />
            <el-table-column prop="cabinetName" label="柜子名称" width="150" />
            <el-table-column prop="materialCode" label="物料编号" width="120" />
            <el-table-column prop="materialName" label="物料名称" width="150" />
            <el-table-column prop="rfid" label="RFID标签" width="120" />
            <el-table-column label="实验日期" width="120">
              <template #default="{ row }">
                {{ new Date(row.experimentDate).toLocaleDateString() }}
              </template>
            </el-table-column>
            <el-table-column label="省市区" width="200">
              <template #default="{ row }">
                {{ `${row.province}${row.city}${row.district}` }}
              </template>
            </el-table-column>
            <el-table-column prop="address" label="地址" min-width="200" show-overflow-tooltip />
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.isDelete === 1 ? 'success' : 'danger'">
                  {{ formatDeleteStatus(row.isDelete) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">
                {{ new Date(row.createTime).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="240" fixed="right">
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
                  :icon="Edit"
                  @click="handleEdit(row)"
                >
                  编辑
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
    
    <!-- 新增/编辑物料弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form 
        ref="itemFormRef" 
        :model="itemForm" 
        :rules="itemFormRules" 
        label-width="120px"
      >
        <!-- 🔥 修改：柜子选择区域 -->
        <el-form-item label="所属柜子" prop="cabinetId">
          <div class="cabinet-select-area">
            <div v-if="itemForm.cabinetId" class="selected-cabinet">
              <el-card class="cabinet-info-card">
                <div class="cabinet-info">
                  <div class="cabinet-main">
                    <span class="cabinet-name">{{ itemForm.cabinetName }}</span>
                    <span class="cabinet-code">{{ itemForm.cabinetCode }}</span>
                  </div>
                  <div class="cabinet-location">
                    <span class="location-text">
                      {{ `${itemForm.province}${itemForm.city}${itemForm.district}` }}
                    </span>
                  </div>
                  <div class="cabinet-address">
                    <span class="address-text">{{ itemForm.address }}</span>
                  </div>
                </div>
                <div class="cabinet-actions">
                  <el-button 
                    type="primary" 
                    size="small" 
                    @click="handleSelectCabinet"
                  >
                    重新选择
                  </el-button>
                  <el-button 
                    type="danger" 
                    size="small" 
                    @click="handleClearCabinetSelect"
                  >
                    清空选择
                  </el-button>
                </div>
              </el-card>
            </div>
            <div v-else class="empty-cabinet">
              <el-empty 
                description="请选择所属柜子" 
                :image-size="80"
              >
                <el-button 
                  type="primary" 
                  @click="handleSelectCabinet"
                >
                  选择柜子
                </el-button>
              </el-empty>
            </div>
          </div>
        </el-form-item>
        <!-- <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="柜子编号" prop="cabinetCode">
              <el-input
                v-model="itemForm.cabinetCode"
                placeholder="请输入柜子编号"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="柜子名称" prop="cabinetName">
              <el-input
                v-model="itemForm.cabinetName"
                placeholder="请输入柜子名称"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row> -->

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物料编号" prop="materialCode">
              <el-input
                v-model="itemForm.materialCode"
                placeholder="请输入物料编号"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="物料名称" prop="materialName">
              <el-input
                v-model="itemForm.materialName"
                placeholder="请输入物料名称"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="RFID标签" prop="rfid">
              <el-input
                v-model="itemForm.rfid"
                placeholder="请输入RFID标签"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="实验日期" prop="experimentDate">
              <el-date-picker
                v-model="itemForm.experimentDate"
                type="date"
                placeholder="选择实验日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 🔥 修改：省市区改为下拉选择 -->
        <!-- 🔥 删除：省市区选择和地址输入 -->
        <!-- <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="省份" prop="province">
              <el-select
                v-model="itemForm.province"
                placeholder="请选择省份"
                style="width: 100%"
                @change="handleItemProvinceChange"
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
          <el-col :span="8">
            <el-form-item label="城市" prop="city">
              <el-select
                v-model="itemForm.city"
                placeholder="请选择城市"
                style="width: 100%"
                :disabled="!itemForm.province"
                @change="handleItemCityChange"
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
          <el-col :span="8">
            <el-form-item label="区域" prop="district">
              <el-select
                v-model="itemForm.district"
                placeholder="请选择区域"
                style="width: 100%"
                :disabled="!itemForm.city"
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
        </el-row> -->

        <!-- <el-row>
          <el-col :span="24">
            <el-form-item label="地址" prop="address">
              <el-input
                v-model="itemForm.address"
                type="textarea"
                :rows="3"
                placeholder="请输入详细地址"
              />
            </el-form-item>
          </el-col>
        </el-row> -->

        <!-- <el-row>
          <el-col :span="12">
            <el-form-item label="状态" prop="isDelete">
              <el-select
                v-model="itemForm.isDelete"
                placeholder="请选择状态"
                style="width: 100%"
              >
                <el-option
                  v-for="option in deleteStatusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row> -->
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 🔥 新增：柜子选择弹窗 -->
    <el-dialog
      v-model="cabinetSelectDialogVisible"
      title="选择柜子"
      width="1000px"
      :close-on-click-modal="false"
    >
      <!-- 柜子搜索区域 -->
      <div class="cabinet-search-area">
        <el-form :model="cabinetSearchForm" :inline="true">
          <el-form-item label="设备编号">
            <el-input 
              v-model="cabinetSearchForm.cabinetCode" 
              placeholder="请输入设备编号" 
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="设备名称">
            <el-input 
              v-model="cabinetSearchForm.cabinetName" 
              placeholder="请输入设备名称" 
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleCabinetSearch">
              搜索
            </el-button>
            <el-button @click="handleCabinetReset">
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 柜子列表表格 -->
      <el-table 
        :data="cabinetListData" 
        v-loading="cabinetLoading"
        style="width: 100%"
        stripe
        border
        max-height="400px"
      >
        <el-table-column prop="cabinetCode" label="设备编号" width="120" />
        <el-table-column prop="cabinetName" label="设备名称" width="150" />
        <el-table-column label="省市区" width="200">
          <template #default="{ row }">
            {{ `${row.province}${row.city}${row.district}` }}
          </template>
        </el-table-column>
        <el-table-column prop="address" label="具体地址" min-width="220" show-overflow-tooltip />
        <el-table-column label="在线状态" width="100" align="center">
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
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small"
              @click="handleConfirmCabinetSelect(row)"
            >
              选择
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 柜子列表分页 -->
      <div class="cabinet-pagination">
        <el-pagination
          v-model:current-page="cabinetCurrentPage"
          v-model:page-size="cabinetPageSize"
          :page-sizes="[10, 20, 50]"
          :total="cabinetTotal"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleCabinetSizeChange"
          @current-change="handleCabinetPageChange"
        />
      </div>
    </el-dialog>    

  </div>
</template>

<style lang='scss' scoped>
.items-management-container {
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

// 🔥 新增：柜子选择相关样式
.cabinet-select-area {
  .selected-cabinet {
    .cabinet-info-card {
      .cabinet-info {
        .cabinet-main {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          
          .cabinet-name {
            font-size: 16px;
            font-weight: 500;
            color: #303133;
            margin-right: 12px;
          }
          
          .cabinet-code {
            font-size: 14px;
            color: #909399;
            background: #f5f7fa;
            padding: 2px 8px;
            border-radius: 4px;
          }
        }
        
        .cabinet-location {
          margin-bottom: 4px;
          
          .location-text {
            font-size: 14px;
            color: #606266;
          }
        }
        
        .cabinet-address {
          .address-text {
            font-size: 12px;
            color: #909399;
            line-height: 1.4;
          }
        }
      }
      
      .cabinet-actions {
        margin-top: 12px;
        text-align: right;
        
        .el-button + .el-button {
          margin-left: 8px;
        }
      }
    }
  }
  
  .empty-cabinet {
    text-align: center;
    padding: 20px;
  }
}
// 🔥 新增：柜子选择弹窗样式
.cabinet-search-area {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.cabinet-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

// 表格样式调整
:deep(.el-table) {
  .el-button + .el-button {
    margin-left: 4px;
  }
}

// 弹窗样式
:deep(.el-dialog) {
  .dialog-footer {
    text-align: center;
  }
}

// 表格样式调整
:deep(.el-table) {
  .el-button + .el-button {
    margin-left: 4px;
  }
}

// 弹窗样式
:deep(.el-dialog) {
  .dialog-footer {
    text-align: center;
  }
}
</style>