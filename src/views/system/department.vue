<script setup lang='ts'>
import { ref, onMounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Delete, View, Plus } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";
import { useAreaStore } from "@/store/modules/area";
import { useAreaSelect } from "@/utils/useAreaSelect";
import { usePageSearch } from "@/utils/useAreaFilter";

// 导入 API 方法和类型
import { 
  getDepartmentList as getDepartmentListApi, 
  addDepartment as addDepartmentApi, 
  updateDepartment as updateDepartmentApi, 
  deleteDepartment as deleteDepartmentApi,
  type DepartmentData,
  type DepartmentFormData,
  type DepartmentQueryParams
} from '@/api/department';

defineOptions({
  name: "DepartmentManagement"
});

// 初始化 areaStore
const areaStore = useAreaStore();


// 响应式数据
const loading = ref(false);
const tableData = ref<DepartmentData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
// 添加新增部门相关数据
const dialogVisible = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const currentEditId = ref<number | null>(null);


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
    departmentName: ''
  },
  // 搜索回调函数
  () => {
    currentPage.value = 1;
    getDepartmentList();
  }
);


// 表单数据
const formData = ref({
  departmentName: '',
  province: '',
  city: '',
  district: ''
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
} = useAreaSelect(formData);

// 省份改变时清空城市和区域
const handleFormProvinceChange = () => {
  handleProvinceChange(formData.value);
};

const handleFormCityChange = () => {
  handleCityChange(formData.value);
};
const validateAreaPermissionRule = (rule: any, value: any, callback: any) => {
  const { province, city, district } = formData.value;
  
  if (province) {
    if (!validateAreaPermission(province, city, district)) {
      callback(new Error('您没有权限在该区域创建部门'));
    } else {
      callback();
    }
  } else {
    callback();
  }
};

// 表单验证规则
const formRules = {
  departmentName: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 50, message: '部门名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  province: [
    { required: true, message: '请选择省份', trigger: 'change' },
    { validator: validateAreaPermissionRule, trigger: 'change' }
  ],
  city: [
    //{ required: true, message: '请选择城市', trigger: 'change' },
    { validator: validateAreaPermissionRule, trigger: 'change' }
  ],
  district: [
    //{ required: true, message: '请选择区域', trigger: 'change' },
    { validator: validateAreaPermissionRule, trigger: 'change' }
  ]
};
// 表单引用
const formRef = ref();


// 提交表单
const handleSubmit = async () => {
  try {
    // 表单验证
    await formRef.value.validate();

    // 使用工具类的权限验证
    const { province, city, district } = formData.value;
    if (!validateAreaPermission(province, city, district)) {
      ElMessage.error('您没有权限在该区域创建部门，请重新选择');
      return;
    }

    // 修改：根据操作类型构建不同的提交数据
    let submitData: DepartmentFormData;

    
    if (isEdit.value) {
      // 编辑时包含ID
      submitData = {
        id: currentEditId.value!,
        departmentName: formData.value.departmentName,
        province: formData.value.province,
        ...(formData.value.city && formData.value.city.trim() && { city: formData.value.city }),
        ...(formData.value.district && formData.value.district.trim() && { district: formData.value.district })
      };
    } else {
      // 新增时不包含ID
      submitData = {
        departmentName: formData.value.departmentName,
        province: formData.value.province,
        ...(formData.value.city && formData.value.city.trim() && { city: formData.value.city }),
        ...(formData.value.district && formData.value.district.trim() && { district: formData.value.district })
      };
    }
    
    console.log('提交数据:', submitData);
    
    // 调用API
    const result = isEdit.value 
      ? await updateDepartmentApi(submitData)  // 编辑时调用更新API
      : await addDepartmentApi(submitData);    // 新增时调用新增API
    
    if (result.code === 200) {
      ElMessage.success(isEdit.value ? '编辑成功' : '新增成功');
      dialogVisible.value = false;
      
      // 刷新列表
      getDepartmentList();
    } else {
      ElMessage.error(result.msg || (isEdit.value ? '编辑失败' : '新增失败'));
    }
    
  } catch (error) {
    if (error !== 'validation failed') {
      ElMessage.error(isEdit.value ? '编辑部门失败，请检查网络连接' : '新增部门失败，请检查网络连接');
      console.error('提交部门数据错误:', error);
    }
  }
};
// 取消操作
const handleCancel = () => {
  dialogVisible.value = false;
};

// 获取部门列表（使用 API 方法）
const getDepartmentList = async () => {
  loading.value = true;
  try {
    // 使用 API 方法和类型
    const params: DepartmentQueryParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value
    };
    
    console.log('部门搜索参数:', params);
    
    const response = await getDepartmentListApi(params);
    
    if (response.code === 200) {
      tableData.value = response.data.records;
      total.value = response.data.total;
      console.log('获取到的部门数据:', tableData.value);
    } else {
      ElMessage.error(response.msg || '获取数据失败');
    }
    
  } catch (error) {
    ElMessage.error('获取部门列表失败，请检查网络连接');
    console.error('获取部门列表错误:', error);
  } finally {
    loading.value = false;
  }
};


// 查看部门详情
const handleView = (row: DepartmentData) => {
  ElMessage.info(`查看部门: ${row.departmentName}`);
  // 这里可以打开详情弹窗或跳转到详情页
};

// 编辑部门
const handleEdit = (row: DepartmentData) => {
  dialogTitle.value = '编辑部门';
  isEdit.value = true;
  currentEditId.value = row.id;
  
  // 填充表单数据
  formData.value = {
    departmentName: row.departmentName,
    province: row.province,
    city: row.city,
    district: row.district
  };
  
  dialogVisible.value = true;
  
  // 清除表单验证
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

// 删除部门（使用 API 方法）
const handleDelete = async (row: DepartmentData) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除部门 "${row.departmentName}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 使用 API 方法
    const result = await deleteDepartmentApi(row.id);
    
    if (result.code === 200) {
      ElMessage.success('删除成功');
      // 刷新列表
      getDepartmentList();
    } else {
      ElMessage.error(result.msg || '删除失败');
    }
    
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消删除');
    } else {
      ElMessage.error('删除部门失败，请检查网络连接');
      console.error('删除部门错误:', error);
    }
  }
};

// 新增部门
const handleAddDepartment = () => {
  // 检查是否有权限数据
  if (!hasPermissionData.value) {
    ElMessage.warning('权限数据未加载，请稍后再试');
    return;
  }
  dialogTitle.value = '新增部门';
  isEdit.value = false;
  currentEditId.value = null;
  
  // 重置表单
  formData.value = {
    departmentName: '',
    province: '',
    city: '',
    district: ''
  };
  
  dialogVisible.value = true;
  
  // 清除表单验证
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getDepartmentList();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  getDepartmentList();
};


// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  if (!dateTime) return '-';
  return new Date(dateTime).toLocaleString();
};

// 生命周期
onMounted(async () => {
  // 使用工具类初始化权限数据
  await initAreaSelectData();
  // 获取部门列表
  await getDepartmentList();
});
</script>

<template>
  <div class="department-management-container">
    <div>
      <!-- 区域选择器 -->
      <AreaSelect @area-search="handleAreaSearch" />
    </div>
    <div class="content">
      <div class="main-content">
        <!-- 搜索区域 -->
        <el-card class="search-card">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item label="部门名称">
              <el-input 
                v-model="searchForm.departmentName" 
                placeholder="请输入部门名称" 
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

        <!-- 表格区域 -->
        <el-card class="table-card">
          <template #header>
            <div class="card-header">
              <span class="title">部门列表</span>
              <el-button type="primary" size="small" @click="handleAddDepartment">
                新增部门
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
            <!-- <el-table-column prop="id" label="ID" width="80" /> -->
            <el-table-column prop="departmentName" label="部门名称" min-width="100" />
            <el-table-column prop="province" label="省份" width="100">
              <template #default="{ row }">
                {{ row.province || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="city" label="城市" width="100">
              <template #default="{ row }">
                {{ row.city || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="district" label="区域" width="100">
              <template #default="{ row }">
                {{ row.district || '-' }}
              </template>
            </el-table-column>

            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.createTime) }}
              </template>
            </el-table-column>
            <el-table-column label="更新时间" width="160">
              <template #default="{ row }">
                {{ formatDateTime(row.updatedTime) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="300" fixed="right">
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
    <!-- 新增/编辑部门弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="部门名称" prop="departmentName">
          <el-input
            v-model="formData.departmentName"
            placeholder="请输入部门名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="省份" prop="province">
          <el-select
            v-model="formData.province"
            placeholder="请选择省份"
            style="width: 100%"
            @change="handleFormProvinceChange"
          >
            <el-option
              v-for="option in provinceOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="城市" prop="city">
          <el-select
            v-model="formData.city"
            placeholder="请选择城市"
            style="width: 100%"
            :disabled="!formData.province"
            @change="handleFormCityChange"
            clearable
          >
            <el-option
              v-for="option in cityOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="区域" prop="district">
          <el-select
            v-model="formData.district"
            placeholder="请选择区域"
            style="width: 100%"
            :disabled="!formData.city"
            clearable
          >
            <el-option
              v-for="option in districtOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            {{ isEdit ? '更新' : '确定' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang='scss' scoped>
.department-management-container {
  padding: 0;
  display: flex;
  height: calc(100vh - 80px);
  
  .content {
    flex: 1;
    padding: 20px;
    background-color: #f5f7fa;
    overflow-y: auto;
    
    .main-content {
      .search-card {
        margin-bottom: 20px;
        
        .search-form {
          .el-form-item {
            margin-bottom: 0;
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
// 添加弹窗样式
:deep(.el-dialog) {
  .el-form {
    padding: 0 20px;
    
    .el-form-item {
      margin-bottom: 20px;
      
      .el-input,
      .el-select {
        width: 100%;
      }
    }
  }
  
  .dialog-footer {
    text-align: right;
    padding: 0 20px 20px;
    
    .el-button + .el-button {
      margin-left: 10px;
    }
  }
}
</style>