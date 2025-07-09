<script setup lang='ts'>
// 购买记录
import { ref, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormRules, FormInstance } from 'element-plus';
import { View, Download, Search, ShoppingCart, Plus, Edit, Close } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";
import { useAreaStore } from "@/store/modules/area";
import { usePageSearch } from "@/utils/useAreaFilter";
import { useUserStore } from "@/store/modules/user";

// 导入购买记录 API
import { 
  getPurchaseRecordList as getPurchaseRecordListApi,
  addPurchaseRecord as addPurchaseRecordApi,
  updatePurchaseRecord as updatePurchaseRecordApi,
  type PurchaseRecordData,
  type PurchaseRecordFormData,
  type PurchaseRecordQueryParams
} from '@/api/purchase';

// 导入柜子列表 API
import { 
  getCabinetList as getCabinetListApi,
  type CabinetData
} from '@/api/cabinet';

// 导入物料列表 API
import { 
  getMaterialList as getMaterialListApi,
  getMaterialsByCabinetId as getMaterialsByCabinetIdApi,
  getMaterialDetailsByCabinetId as getMaterialDetailsByCabinetIdApi,
  type MaterialData
} from '@/api/item';

defineOptions({
  name: "PurchaseRecord"
});

// 初始化用户store
const userStore = useUserStore();
// 初始化 areaStore
const areaStore = useAreaStore();

// 响应式数据
const loading = ref(false);
const tableData = ref<PurchaseRecordData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 弹窗相关
const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const formRef = ref<FormInstance>();

// 表单数据
const formData = ref<PurchaseRecordFormData>({
  employeeId: '',
  cabinetId: 0,
  materialId: 0,
  cabinetCode: '',
  cabinetName: '',
  materialCode: '',
  materialName: '',
  quantity: 1,
  remark: '',
  operatorName: ''
});
// 当前编辑的记录
const currentEditRecord = ref<PurchaseRecordData | null>(null);

// 选择器数据
const cabinetOptions = ref<CabinetData[]>([]);
const materialOptions = ref<MaterialData[]>([]);
const cabinetLoading = ref(false);
const materialLoading = ref(false);

// 表单验证规则
const formRules: FormRules = {
  cabinetId: [
    { required: true, message: '请选择柜子', trigger: 'change' }
  ],
  materialId: [
    { required: true, message: '请选择物料', trigger: 'change' }
  ],
  quantity: [
    { required: true, message: '请输入购买数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '数量必须大于0', trigger: 'blur' }
  ]
};

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
    materialName: '',
    cabinetName: '',
    startTime: '',
    endTime: ''
  },
  // 搜索回调函数
  () => {
    currentPage.value = 1;
    getPurchaseRecordList();
  }
);

// 获取购买记录列表（使用 API 方法）
const getPurchaseRecordList = async () => {
  loading.value = true;
  try {
    // 使用 API 方法和类型，包含区域筛选
    const params: PurchaseRecordQueryParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value
    };
    
    console.log('购买记录搜索参数:', params);
    
    const response = await getPurchaseRecordListApi(params);
    
    // 处理API响应
    if (response.code === 200) {
      tableData.value = response.data.records;
      total.value = response.data.total;
      console.log('获取到的购买记录数据:', tableData.value);
    } else {
      ElMessage.error(response.msg || '获取数据失败');
    }
    
  } catch (error) {
    ElMessage.error('获取购买记录列表失败，请检查网络连接');
    console.error('获取购买记录列表错误:', error);
  } finally {
    loading.value = false;
  }
};

// 格式化日期时间
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

// 查看记录详情
const handleView = (row: PurchaseRecordData) => {
  ElMessage.info(`查看购买记录: ${row.materialName}`);
  console.log('查看购买记录:', row);
  // TODO: 实现查看详情功能
};

// 添加购买记录
const handleAdd = async () => {
  dialogTitle.value = '添加购买记录';
  isEdit.value = false;
  resetForm();
  
  // 🔥 自动填充当前用户信息
  formData.value.employeeId = userStore.employeeId;
  formData.value.operatorName = userStore.userName;
  
  // 加载柜子和物料选项
  await loadCabinetOptions();
  
  dialogVisible.value = true;
};
// 编辑购买记录
const handleEdit = async (row: PurchaseRecordData) => {
  dialogTitle.value = '编辑购买记录';
  isEdit.value = true;
  currentEditRecord.value = { ...row };
  
  // 填充表单数据
  formData.value = {
    id: row.id,
    employeeId: userStore.employeeId,// 从当前用户获取
    cabinetId: row.cabinetId,
    materialId: row.materialId,
    cabinetCode: row.cabinetCode,
    cabinetName: row.cabinetName,
    materialCode: row.materialCode,
    materialName: row.materialName,
    quantity: row.quantity,
    remark: row.remark || '',
    operatorName: userStore.userName 
  };
  
  // 加载选项
  await loadCabinetOptions();
  if (row.cabinetId) {
    await loadMaterialsByCabinet(row.cabinetId);
  }  
  //await loadMaterialOptions();
  
  dialogVisible.value = true;
  
  // 清除验证
  nextTick(() => {
    if (formRef.value) {
      formRef.value.clearValidate();
    }
  });
};
// 加载柜子选项
const loadCabinetOptions = async () => {
  cabinetLoading.value = true;
  try {
    const response = await getCabinetListApi({
      pageNum: 1,
      pageSize: 1000 // 获取所有柜子
    });
    
    if (response.code === 200) {
      cabinetOptions.value = response.data.records;
    } else {
      ElMessage.error('获取柜子列表失败');
    }
  } catch (error) {
    ElMessage.error('获取柜子列表失败，请检查网络连接');
    console.error('获取柜子列表错误:', error);
  } finally {
    cabinetLoading.value = false;
  }
};

// 加载物料选项
const loadMaterialOptions = async () => {
  materialLoading.value = true;
  try {
    const response = await getMaterialListApi({
      pageNum: 1,
      pageSize: 1000 // 获取所有物料
    });
    
    if (response.code === 200) {
      materialOptions.value = response.data.records;
    } else {
      ElMessage.error('获取物料列表失败');
    }
  } catch (error) {
    ElMessage.error('获取物料列表失败，请检查网络连接');
    console.error('获取物料列表错误:', error);
  } finally {
    materialLoading.value = false;
  }
};

// 柜子选择变化
const handleCabinetChange = async (cabinetId: number) => {
  const selectedCabinet = cabinetOptions.value.find(item => item.id === cabinetId);
  if (selectedCabinet) {
    formData.value.cabinetCode = selectedCabinet.cabinetCode;
    formData.value.cabinetName = selectedCabinet.cabinetName;

    // 🔥 新增：根据柜子ID加载该柜子的物品列表
    await loadMaterialsByCabinet(cabinetId);
    
    // 🔥 新增：清空之前选择的物料
    formData.value.materialId = 0;
    formData.value.materialCode = '';
    formData.value.materialName = '';
  }
};
// 在 loadMaterialOptions 方法后添加：
// 🔥 新增：根据柜子ID加载物品列表
const loadMaterialsByCabinet = async (cabinetId: number) => {
  materialLoading.value = true;
  try {
    const response = await getMaterialDetailsByCabinetIdApi(cabinetId);
    
    if (response.code === 200) {
      // 🔥 直接使用返回的完整物料数据
      materialOptions.value = response.data.filter(item => item.isDelete === 1); // 只显示未删除的物料
      
      console.log('根据柜子ID获取的物料详细信息:', materialOptions.value);
    } else {
      ElMessage.error(response.msg || '获取柜子物品列表失败');
      materialOptions.value = [];
    }
  } catch (error) {
    ElMessage.error('获取柜子物品列表失败，请检查网络连接');
    console.error('获取柜子物品列表错误:', error);
    materialOptions.value = [];
  } finally {
    materialLoading.value = false;
  }
};

// 物料选择变化
const handleMaterialChange = (materialId: number) => {
  const selectedMaterial = materialOptions.value.find(item => item.id === materialId);
  if (selectedMaterial) {
    formData.value.materialCode = selectedMaterial.materialCode;
    formData.value.materialName = selectedMaterial.materialName;
  }
};
// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
    
    if (isEdit.value) {
      await updateRecord();
    } else {
      await addRecord();
    }
    
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 新增记录
const addRecord = async () => {
  try {
    const result = await addPurchaseRecordApi(formData.value);
    
    if (result.code === 200) {
      ElMessage.success('购买记录添加成功');
      dialogVisible.value = false;
      await getPurchaseRecordList();
    } else {
      ElMessage.error(result.msg || '添加失败');
    }
  } catch (error) {
    ElMessage.error('添加购买记录失败，请检查网络连接');
    console.error('添加购买记录错误:', error);
  }
};

// 更新记录
const updateRecord = async () => {
  try {
    const result = await updatePurchaseRecordApi(formData.value);
    
    if (result.code === 200) {
      ElMessage.success('购买记录更新成功');
      dialogVisible.value = false;
      await getPurchaseRecordList();
    } else {
      ElMessage.error(result.msg || '更新失败');
    }
  } catch (error) {
    ElMessage.error('更新购买记录失败，请检查网络连接');
    console.error('更新购买记录错误:', error);
  }
};
// 重置表单
const resetForm = () => {
  formData.value = {
    employeeId: userStore.employeeId,
    cabinetId: 0,
    materialId: 0,
    cabinetCode: '',
    cabinetName: '',
    materialCode: '',
    materialName: '',
    quantity: 1,
    remark: '',
    operatorName: userStore.userName 
  };
  currentEditRecord.value = null;
  
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

// 关闭弹窗
const handleClose = () => {
  dialogVisible.value = false;
  resetForm();
};

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getPurchaseRecordList();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  getPurchaseRecordList();
};

// 生命周期
onMounted(() => {
  getPurchaseRecordList();
});
</script>

<template>
  <div class="purchase-records-container">
    <!-- 左侧区域选择器 -->
    <div>
      <AreaSelect @area-search="handleAreaSearch" />
    </div>
    
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
              <span class="title">购买记录列表</span>
              <div class="header-actions">
                <el-button type="primary" size="small" :icon="Plus" @click="handleAdd">
                  添加记录
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
            empty-text="暂无购买记录"
          >
            <el-table-column prop="id" label="记录ID" width="80" />
            <el-table-column prop="employeeId" label="员工编号" width="120" />
            <el-table-column prop="cabinetCode" label="柜子编号" width="120" />
            <el-table-column prop="cabinetName" label="柜子名称" width="150" show-overflow-tooltip />
            <el-table-column prop="materialCode" label="物料编号" width="120" />
            <el-table-column prop="materialName" label="物料名称" width="150" show-overflow-tooltip />
            <el-table-column label="购买数量" width="100" align="center">
              <template #default="{ row }">
                <el-tag type="warning" size="large">
                  {{ row.quantity }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="operatorName" label="经办人" width="100" />
            <el-table-column prop="remark" label="备注" width="120" show-overflow-tooltip>
              <template #default="{ row }">
                {{ row.remark || '-' }}
              </template>
            </el-table-column>
            <el-table-column label="购买时间" width="160">
              <template #default="{ row }">
                <div class="time-info">
                  <span>{{ formatDateTime(row.createTime) }}</span>
                </div>
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
                  查看
                </el-button>
                <el-button 
                type="warning" 
                size="small" 
                :icon="Edit"
                @click="handleEdit(row)"
                >
                编辑
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
    <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="600px"
        :close-on-click-modal="false"
        @close="handleClose"
    >
        <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        >
        <el-row :gutter="20">
            <el-col :span="12">
            <el-form-item label="选择柜子" prop="cabinetId">
                <el-select
                v-model="formData.cabinetId"
                placeholder="请选择柜子"
                filterable
                :loading="cabinetLoading"
                @change="handleCabinetChange"
                style="width: 100%"
                >
                <el-option
                    v-for="cabinet in cabinetOptions"
                    :key="cabinet.id"
                    :label="`${cabinet.cabinetCode} - ${cabinet.cabinetName}`"
                    :value="cabinet.id"
                />
                </el-select>
            </el-form-item>
            </el-col>
            
            <el-col :span="12">
                <el-form-item label="选择物料" prop="materialId">
                    <el-select
                    v-model="formData.materialId"
                    placeholder="请先选择柜子"
                    filterable
                    :loading="materialLoading"
                    :disabled="!formData.cabinetId"
                    @change="handleMaterialChange"
                    style="width: 100%"
                    >
                    <el-option
                        v-for="material in materialOptions"
                        :key="material.id"
                        :label="material.materialName"
                        :value="material.id"
                    />
                    
                    </el-select>
                </el-form-item>
            </el-col>
        </el-row>
        
        <el-row :gutter="20">
            <el-col :span="12">
            <el-form-item label="购买数量" prop="quantity">
                <el-input-number
                v-model="formData.quantity"
                :min="1"
                :max="9999"
                placeholder="请输入购买数量"
                style="width: 100%"
                />
            </el-form-item>
            </el-col>
            
            <el-col :span="12">
                <el-form-item label="经办人">
                    <el-input
                    :value="userStore.userName"
                    readonly
                    style="width: 100%"
                    />
                </el-form-item>
            </el-col>
        </el-row>
        
        <el-form-item label="备注">
            <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息（可选）"
            />
        </el-form-item>
        </el-form>
        
        <template #footer>
        <div class="dialog-footer">
            <el-button @click="handleClose">取消</el-button>
            <el-button type="primary" @click="handleSubmit">
            {{ isEdit ? '更新' : '添加' }}
            </el-button>
        </div>
        </template>
    </el-dialog>    
  </div>
</template>

<style lang='scss' scoped>
.purchase-records-container {
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
// 只读输入框样式
:deep(.el-input.is-disabled .el-input__inner) {
  background-color: #f5f7fa;
  border-color: #e4e7ed;
  color: #606266;
}
</style>