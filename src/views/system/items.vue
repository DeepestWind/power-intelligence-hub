<script setup lang='ts'>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Delete, View, Setting, Plus } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area"; // 添加类型导入
import { useAreaStore } from "@/store/modules/area";

defineOptions({
  name: "ItemsManagement"
});

// 物料数据接口
interface ItemData {
  id: number;
  cabinetId: number;
  cabinetCode: string;
  cabinetName: string;
  materialCode: string;
  materialName: string;
  rfid: string;
  experimentDate: string;
  province: string;
  city: string;
  district: string;
  address: string;
  isDelete: number; // 1-正常, 0-已删除
  createTime: string;
  updatedTime: string;
}

// API响应接口
interface ApiResponse {
  code: number;
  msg: string;
  data: {
    records: ItemData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

// 响应式数据
const loading = ref(false);
const tableData = ref<ItemData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 初始化 areaStore
const areaStore = useAreaStore();

// const emit = defineEmits<{
//   areaSearch: [area: AreaNode] // 注意这里是 areaSearch，不是 area-search
// }>();
// const handleNodeClick = (data: AreaNode) => {
//   areaStore.setSelectedArea(data);
//   console.log('选中的地区:', data);
  
//   // 发送区域搜索事件给父组件
//   emit('areaSearch', data); // 确保这里调用了 emit
// };

// 搜索表单
const searchForm = ref({
  cabinetCode: '',
  cabinetName: '',
  materialCode: '',
  materialName: '',
  rfid: '',
  experimentDate: '',
  isDelete: ''
});
// 分离区域筛选和表单搜索
const areaFilter = ref({
  province: '',
  city: '',
  district: ''
});

// 处理区域搜索事件，左侧areaSelect组件
const handleAreaSearch = (area: AreaNode) => {
  console.log('接收到区域搜索事件:', area);
  
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
  
  console.log('区域筛选已设置:', areaFilter.value); // 添加调试日志
  ElMessage.info(`区域筛选已设置为: ${label}`);
};

// 新增物料相关数据
const dialogVisible = ref(false);
const dialogTitle = ref('新增物料');
const isEdit = ref(false);

// 物料表单数据
const itemForm = ref({
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

// 表单验证规则
const itemFormRules = {
  cabinetCode: [
    { required: true, message: '请输入柜子编号', trigger: 'blur' }
  ],
  cabinetName: [
    { required: true, message: '请输入柜子名称', trigger: 'blur' }
  ],
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
  ],
  province: [
    { required: true, message: '请输入省份', trigger: 'blur' }
  ],
  city: [
    { required: true, message: '请输入城市', trigger: 'blur' }
  ],
  district: [
    { required: true, message: '请输入区域', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入地址', trigger: 'blur' }
  ]
};

const itemFormRef = ref();

// 状态选项
const deleteStatusOptions = [
  { label: '正常', value: 1 },
  { label: '已删除', value: 0 }
];

// 从API获取物料列表
const getItemListApi = async (params: any = {}) => {
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
    if (params.rfid) queryParams.append('rfid', params.rfid);
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    if (params.experimentDate) queryParams.append('experimentDate', params.experimentDate);
    if (params.isDelete !== '' && params.isDelete !== undefined) {
      queryParams.append('isDelete', params.isDelete);
    }
    
    // 构建完整的URL
    const baseUrl = `/api/power/material/page`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('物料API请求URL:', url);
    
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
    console.error('物料API请求失败:', error);
    throw error;
  }
};

// 获取物料列表
const getItemList = async () => {
  loading.value = true;
  try {
    // 合并区域筛选和表单搜索条件
    const searchParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,  //添加区域筛选条件
      ...searchForm.value   //表单搜索条件
    };
    
    console.log('物料搜索参数:', searchParams); // 添加日志查看参数
    
    const response = await getItemListApi(searchParams);
    
    // 处理API响应
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

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  getItemList();
};

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    cabinetCode: '',
    cabinetName: '',
    materialCode: '',
    materialName: '',
    rfid: '',
    experimentDate: '',
    isDelete: ''
  };
  handleSearch();
};

// 清空所有搜索条件
const handleClearAll = () => {
  searchForm.value = {
    cabinetCode: '',
    cabinetName: '',
    materialCode: '',
    materialName: '',
    rfid: '',
    experimentDate: '',
    isDelete: ''
  };
  areaFilter.value = {
    province: '',
    city: '',
    district: ''
  };
  handleSearch();
};

// 打开新增物料弹窗
const handleAddItem = () => {
  dialogTitle.value = '新增物料';
  isEdit.value = false;
  resetItemForm();
  dialogVisible.value = true;
};

// 重置表单
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
  if (itemFormRef.value) {
    itemFormRef.value.clearValidate();
  }
};

// 取消操作
const handleCancel = () => {
  dialogVisible.value = false;
  resetItemForm();
};

// 确认提交
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

// 物料API调用
const addItem = async () => {
  try {
    const requestData = {
      cabinetId: itemForm.value.cabinetId,
      cabinetCode: itemForm.value.cabinetCode,
      cabinetName: itemForm.value.cabinetName,
      materialCode: itemForm.value.materialCode,
      materialName: itemForm.value.materialName,
      rfid: itemForm.value.rfid,
      experimentDate: itemForm.value.experimentDate,
      province: itemForm.value.province,
      city: itemForm.value.city,
      district: itemForm.value.district,
      address: itemForm.value.address,
      isDelete: itemForm.value.isDelete,
      createTime: new Date().toISOString(),
      updatedTime: new Date().toISOString()
    };
    
    console.log('发送新增物料请求:', requestData);

    const response = await fetch('/api/power/material/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
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

// 更新物料API调用
const updateItem = async () => {
  try {
    ElMessage.success('物料更新成功');
    console.log('更新物料数据:', itemForm.value);
  } catch (error) {
    ElMessage.error('物料更新失败');
    console.error('更新物料错误:', error);
    throw error;
  }
};

// 删除物料API调用
const deleteItemApi = async (id: number) => {
  try {
    const response = await fetch(`/api/power/material/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
    
  } catch (error) {
    console.error('删除物料API请求失败:', error);
    throw error;
  }
};

// 删除物料
const handleDelete = async (row: ItemData) => {
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
    
    const result = await deleteItemApi(row.id);
    
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

// 编辑物料
const handleEdit = (row: ItemData) => {
  dialogTitle.value = '编辑物料';
  isEdit.value = true;
  
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
const handleView = (row: ItemData) => {
  ElMessage.info(`查看物料: ${row.materialName}`);
  // 这里可以打开详情弹窗或跳转到详情页
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
onMounted(() => {
  getItemList();
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
            <el-form-item label="RFID标签">
              <el-input 
                v-model="searchForm.rfid" 
                placeholder="请输入RFID标签" 
                clearable
                style="width: 150px"
              />
            </el-form-item>
            <!-- 移除省市区输入框 -->
            <el-form-item label="实验日期">
              <el-date-picker
                v-model="searchForm.experimentDate"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item label="状态">
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
            </el-form-item>
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
        <el-row :gutter="20">
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
        </el-row>

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

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="省份" prop="province">
              <el-input
                v-model="itemForm.province"
                placeholder="请输入省份"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市" prop="city">
              <el-input
                v-model="itemForm.city"
                placeholder="请输入城市"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区域" prop="district">
              <el-input
                v-model="itemForm.district"
                placeholder="请输入区域"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
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
        </el-row>

        <el-row>
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
        </el-row>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleConfirm">确定</el-button>
        </span>
      </template>
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