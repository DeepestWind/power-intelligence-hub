<script setup lang='ts'>
import { ref, onMounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Delete, View, Plus } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";
import { useAreaStore } from "@/store/modules/area";

defineOptions({
  name: "DepartmentManagement"
});

// 初始化 areaStore
const areaStore = useAreaStore();

// 部门数据接口
interface DepartmentData {
  id: number;
  departmentName: string;
  province: string;
  city: string;
  district: string;
  createTime: string;
  updatedTime: string;
}

// API响应接口
interface ApiResponse {
  code: number;
  msg: string;
  data: {
    records: DepartmentData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

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

// 分离区域筛选和表单搜索
const areaFilter = ref({
  province: '',
  city: '',
  district: ''
});

// 搜索表单
const searchForm = ref({
  departmentName: ''
});

// 处理区域搜索事件，左侧areaSelect组件
const handleAreaSearch = (area: AreaNode) => {
  console.log('🎯 department.vue 接收到区域搜索事件:', area);
  
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

// 表单数据
const formData = ref({
  departmentName: '',
  province: '',
  city: '',
  district: ''
});
// 🔥 表单验证规则
const formRules = {
  departmentName: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 50, message: '部门名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  province: [
    { required: true, message: '请选择省份', trigger: 'change' }
  ],
  city: [
    { required: true, message: '请选择城市', trigger: 'change' }
  ],
  district: [
    { required: true, message: '请选择区域', trigger: 'change' }
  ]
};
// 🔥 表单引用
const formRef = ref();

// 🔥 省市县数据 - 使用现有的区域工具
import { transformPcaToTree } from "@/utils/area";
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
  if (!formData.value.province) return [];
  const province = areaData.find(item => item.label === formData.value.province);
  return province ? province.children.map(item => ({
    label: item.label,
    value: item.label
  })) : [];
});
// 🔥 区域选项
const districtOptions = computed(() => {
  if (!formData.value.province || !formData.value.city) return [];
  const province = areaData.find(item => item.label === formData.value.province);
  if (!province) return [];
  const city = province.children.find(item => item.label === formData.value.city);
  return city ? city.children.map(item => ({
    label: item.label,
    value: item.label
  })) : [];
});
// 🔥 省份改变时清空城市和区域
const handleProvinceChange = () => {
  formData.value.city = '';
  formData.value.district = '';
};
// 🔥 城市改变时清空区域
const handleCityChange = () => {
  formData.value.district = '';
};

// 从API获取部门列表
const getDepartmentListApi = async (params: any = {}) => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // 添加搜索参数
    if (params.departmentName) queryParams.append('departmentName', params.departmentName);
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    
    // 构建完整的URL
    const baseUrl = `/api/power/department/page`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('部门API请求URL:', url);
    
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
    console.error('部门API请求失败:', error);
    throw error;
  }
};
// 🔥 新增部门API
const addDepartmentApi = async (data: any) => {
  try {
    const response = await fetch('/api/power/department/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('新增部门API响应:', result);
    return result;
    
  } catch (error) {
    console.error('新增部门API请求失败:', error);
    throw error;
  }
};
// 🔥 编辑部门API
const updateDepartmentApi = async (data: any) => {
  try {
    const response = await fetch('/api/power/department/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('编辑部门API响应:', result);
    return result;
    
  } catch (error) {
    console.error('编辑部门API请求失败:', error);
    throw error;
  }
};
// 🔥 删除部门API
const deleteDepartmentApi = async (id: number) => {
  try {
    const response = await fetch(`/api/power/department/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('删除部门API响应:', result);
    return result;
    
  } catch (error) {
    console.error('删除部门API请求失败:', error);
    throw error;
  }
};

// 🔥 提交表单
const handleSubmit = async () => {
  try {
    // 表单验证
    await formRef.value.validate();

    // 修改：根据操作类型构建不同的提交数据
    let submitData: any;
    // 构建提交数据
    // const submitData = {
    //   ...formData.value,
    //   // 新增时设置创建时间和更新时间为当前时间
    //   ...(isEdit.value ? {} : {
    //     createTime: new Date().toISOString(),
    //     updatedTime: new Date().toISOString()
    //   }),
    //   // 编辑时只更新更新时间
    //   ...(isEdit.value ? {
    //     updatedTime: new Date().toISOString()
    //   } : {})
    // };
    
    if (isEdit.value) {
      // 编辑时包含ID
      submitData = {
        id: currentEditId.value,
        ...formData.value,
        updatedTime: new Date().toISOString()
      };
    } else {
      // 新增时不包含ID
      submitData = {
        ...formData.value,
        createTime: new Date().toISOString(),
        updatedTime: new Date().toISOString()
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
// 🔥 取消操作
const handleCancel = () => {
  dialogVisible.value = false;
};

// 获取部门列表
const getDepartmentList = async () => {
  loading.value = true;
  try {
    // 合并区域筛选和表单搜索条件
    const searchParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value
    };
    
    console.log('部门搜索参数:', searchParams);
    
    const response = await getDepartmentListApi(searchParams);
    
    // 处理API响应
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

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  getDepartmentList();
};

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    departmentName: ''
  };
  handleSearch();
};

// 清空所有筛选条件
const handleClearAll = () => {
  searchForm.value = {
    departmentName: ''
  };
  areaFilter.value = {
    province: '',
    city: '',
    district: ''
  };
  handleSearch();
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

// 删除部门
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
    
    // 🔥 调用删除API
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
onMounted(() => {
  getDepartmentList();
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
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="departmentName" label="部门名称" min-width="150" />
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
        
        <el-form-item label="城市" prop="city">
          <el-select
            v-model="formData.city"
            placeholder="请选择城市"
            style="width: 100%"
            :disabled="!formData.province"
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
        
        <el-form-item label="区域" prop="district">
          <el-select
            v-model="formData.district"
            placeholder="请选择区域"
            style="width: 100%"
            :disabled="!formData.city"
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
// 🔥 添加弹窗样式
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