<script setup lang='ts'>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Delete, View, Setting, Plus } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";
import { useAreaStore } from "@/store/modules/area";

defineOptions({
  name: "UserManagement"
});
// 初始化 areaStore
const areaStore = useAreaStore();
// 用户数据接口
interface UserData {
  id: number;
  userName: string;
  department: string | null;
  bindCard: string;
  employeeId: string;
  password: string;
  userType: number; // 用户类型：1-普通用户, 2-管理员等
  adminLevel: number; // 管理员级别：1-区级, 2-市级, 3-省级, 4-超级管理员
  province: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  status: number; // 状态：1-启用, 0-禁用
  cabinetManagement: string | null;
  faceRecognition: string | null;
  fingerprintRecognition: string | null;
  createTime: string;
  updatedTime: string;
}

// API响应接口
interface ApiResponse {
  code: number;
  msg: string;
  data: {
    records: UserData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

// 响应式数据
const loading = ref(false);
const tableData = ref<UserData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);


// 区域筛选和表单搜索
const areaFilter = ref({
  province: '',
  city: '',
  district: ''
});
// 搜索表单
const searchForm = ref({
  userName: '',
  department: '',
  employeeId: '',
  userType: '',
  adminLevel: '',
  status: ''
});

// 处理区域搜索事件，左侧areaSelect组件
const handleAreaSearch = (area: AreaNode) => {
  console.log('🎯 user.vue 接收到区域搜索事件:', area);
  
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

// 新增用户相关数据
const dialogVisible = ref(false);
const dialogTitle = ref('新增用户');
const isEdit = ref(false);

// 用户表单数据
const userForm = ref({
  userName: '',
  department: '',
  bindCard: '',
  employeeId: '',
  password: '',
  userType: 1,
  adminLevel: 1,
  province: '',
  city: '',
  district: '',
  address: '',
  status: 1
});

// 表单验证规则
const userFormRules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为2-20个字符', trigger: 'blur' }
  ],
  employeeId: [
    { required: true, message: '请输入员工编号', trigger: 'blur' },
    { min: 3, max: 20, message: '员工编号长度为3-20个字符', trigger: 'blur' }
  ],
  bindCard: [
    { required: true, message: '请输入绑定卡号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' }
  ],
  userType: [
    { required: true, message: '请选择用户类型', trigger: 'change' }
  ],
  adminLevel: [
    { required: true, message: '请选择管理员级别', trigger: 'change' }
  ]
};

const userFormRef = ref();

// 用户类型选项
const userTypeOptions = [
  { label: '普通用户', value: 1 },
  { label: '管理员', value: 2 },
  { label: '超级管理员', value: 3 }
];

// 管理员级别选项
const adminLevelOptions = [
  { label: '区级', value: 1 },
  { label: '市级', value: 2 },
  { label: '省级', value: 3 },
  { label: '超级管理员', value: 4 }
];

// 状态选项
const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
];

// 从API获取用户列表
const getUserListApi = async (params: any = {}) => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.size) queryParams.append('size', params.size.toString());
    
    // 添加搜索参数
    if (params.userName) queryParams.append('userName', params.userName);
    if (params.department) queryParams.append('department', params.department);
    if (params.employeeId) queryParams.append('employeeId', params.employeeId);
    if (params.userType !== '' && params.userType !== undefined) {
      queryParams.append('userType', params.userType);
    }
    if (params.adminLevel !== '' && params.adminLevel !== undefined) {
      queryParams.append('adminLevel', params.adminLevel);
    }
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    if (params.status !== '' && params.status !== undefined) {
      queryParams.append('status', params.status);
    }
    
    // 构建完整的URL
    const baseUrl = `/api/power/user/page`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('用户API请求URL:', url);
    
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
    console.error('用户API请求失败:', error);
    throw error;
  }
};

// 获取用户列表
const getUserList = async () => {
  loading.value = true;
  try {
    const searchParams = {
      page: currentPage.value,
      size: pageSize.value,
      ...areaFilter.value,  // 添加区域筛选条件
      ...searchForm.value   // 表单搜索条件
    };
    
    console.log('用户搜索参数:', searchParams); // 添加日志查看参数

    const response = await getUserListApi(searchParams);
    
    // 处理API响应
    if (response.code === 200) {
      tableData.value = response.data.records;
      total.value = response.data.total;
      console.log('获取到的用户数据:', tableData.value);
    } else {
      ElMessage.error(response.msg || '获取数据失败');
    }
    
  } catch (error) {
    ElMessage.error('获取用户列表失败，请检查网络连接');
    console.error('获取用户列表错误:', error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  getUserList();
};

// 重置搜索
const handleReset = () => {
  searchForm.value = {
    userName: '',
    department: '',
    employeeId: '',
    userType: '',
    adminLevel: '',
    status: ''
  };
  // 不清空区域筛选，保持用户选择的区域
  handleSearch();
};

// 添加清空所有筛选条件函数
const handleClearAll = () => {
  searchForm.value = {
    userName: '',
    department: '',
    employeeId: '',
    userType: '',
    adminLevel: '',
    status: ''
  };
  areaFilter.value = {
    province: '',
    city: '',
    district: ''
  };
  handleSearch();
};

// 打开新增用户弹窗
const handleAddUser = () => {
  dialogTitle.value = '新增用户';
  isEdit.value = false;
  resetUserForm();
  dialogVisible.value = true;
};

// 重置表单
const resetUserForm = () => {
  userForm.value = {
    userName: '',
    department: '',
    bindCard: '',
    employeeId: '',
    password: '',
    userType: 1,
    adminLevel: 1,
    province: '',
    city: '',
    district: '',
    address: '',
    status: 1
  };
  if (userFormRef.value) {
    userFormRef.value.clearValidate();
  }
};

// 取消操作
const handleCancel = () => {
  dialogVisible.value = false;
  resetUserForm();
};

// 确认提交
const handleConfirm = async () => {
  if (!userFormRef.value) return;
  
  try {
    await userFormRef.value.validate();
    
    if (isEdit.value) {
      await updateUser();
    } else {
      await addUser();
    }
    
    dialogVisible.value = false;
    resetUserForm();
    getUserList();
    
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 新增用户API调用
const addUser = async () => {
  try {
    const requestData = {
      userName: userForm.value.userName,
      department: userForm.value.department,
      bindCard: userForm.value.bindCard,
      employeeId: userForm.value.employeeId,
      password: userForm.value.password,
      userType: userForm.value.userType,
      adminLevel: userForm.value.adminLevel,
      province: userForm.value.province,
      city: userForm.value.city,
      district: userForm.value.district,
      address: userForm.value.address,
      status: userForm.value.status,
      createTime: new Date().toISOString(),
      updatedTime: new Date().toISOString()
    };
    
    console.log('发送新增用户请求:', requestData);

    const response = await fetch('/api/power/user/save', {
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
      ElMessage.success('用户新增成功');
      console.log('新增用户成功:', result);
    } else {
      ElMessage.error(result.msg || '用户新增失败');
      throw new Error(result.msg || '用户新增失败');
    }
    
  } catch (error) {
    ElMessage.error('用户新增失败，请检查网络连接');
    console.error('新增用户错误:', error);
    throw error;
  }
};

// 更新用户API调用
const updateUser = async () => {
  try {
    ElMessage.success('用户更新成功');
    console.log('更新用户数据:', userForm.value);
  } catch (error) {
    ElMessage.error('用户更新失败');
    console.error('更新用户错误:', error);
    throw error;
  }
};

// 删除用户API调用
const deleteUserApi = async (id: number) => {
  try {
    const response = await fetch(`/api/power/user/${id}`, {
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
    console.error('删除用户API请求失败:', error);
    throw error;
  }
};

// 删除用户
const handleDelete = async (row: UserData) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.userName}" 吗？删除后无法恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const result = await deleteUserApi(row.id);
    
    if (result.code === 200) {
      ElMessage.success('用户删除成功');
      console.log('删除用户成功:', result);
      getUserList();
    } else {
      ElMessage.error(result.msg || '用户删除失败');
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('用户删除失败，请检查网络连接');
      console.error('删除用户错误:', error);
    } else {
      ElMessage.info('已取消删除');
    }
  }
};

// 编辑用户
const handleEdit = (row: UserData) => {
  dialogTitle.value = '编辑用户';
  isEdit.value = true;
  
  // 填充表单数据
  userForm.value = {
    userName: row.userName,
    department: row.department || '',
    bindCard: row.bindCard,
    employeeId: row.employeeId,
    password: row.password,
    userType: row.userType,
    adminLevel: row.adminLevel,
    province: row.province || '',
    city: row.city || '',
    district: row.district || '',
    address: row.address || '',
    status: row.status
  };
  
  dialogVisible.value = true;
};

// 查看用户详情
const handleView = (row: UserData) => {
  ElMessage.info(`查看用户: ${row.userName}`);
  // 这里可以打开详情弹窗或跳转到详情页
};

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getUserList();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  getUserList();
};

// 格式化用户类型
const formatUserType = (userType: number) => {
  const option = userTypeOptions.find(opt => opt.value === userType);
  return option ? option.label : '未知';
};

// 格式化管理员级别
const formatAdminLevel = (adminLevel: number) => {
  const option = adminLevelOptions.find(opt => opt.value === adminLevel);
  return option ? option.label : '未知';
};

// 生命周期
onMounted(() => {
  getUserList();
});
</script>

<template>
  <div class="user-management-container">
    <AreaSelect @area-search="handleAreaSearch" />
    
    <div class="content">
      <div class="main-content">
        <!-- 搜索区域 -->
        <el-card class="search-card">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item label="用户名">
              <el-input 
                v-model="searchForm.userName" 
                placeholder="请输入用户名" 
                clearable
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item label="部门">
              <el-input 
                v-model="searchForm.department" 
                placeholder="请输入部门" 
                clearable
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item label="员工编号">
              <el-input 
                v-model="searchForm.employeeId" 
                placeholder="请输入员工编号" 
                clearable
                style="width: 150px"
              />
            </el-form-item>
            <el-form-item label="用户类型">
              <el-select 
                v-model="searchForm.userType" 
                placeholder="请选择用户类型"
                clearable
                style="width: 120px"
              >
                <el-option
                  v-for="option in userTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="管理级别">
              <el-select 
                v-model="searchForm.adminLevel" 
                placeholder="请选择管理级别"
                clearable
                style="width: 120px"
              >
                <el-option
                  v-for="option in adminLevelOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
            <!-- 修改：移除省市区输入框 -->
            <!-- 原来的省份、城市、区域字段已删除 -->
            <el-form-item label="状态">
              <el-select 
                v-model="searchForm.status" 
                placeholder="请选择状态"
                clearable
                style="width: 100px"
              >
                <el-option
                  v-for="option in statusOptions"
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
              <!-- 可选择添加清空所有按钮 -->
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
              <span class="title">用户列表</span>
              <el-button type="primary" size="small" :icon="Plus" @click="handleAddUser">
                新增用户
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
            <el-table-column prop="userName" label="用户名" width="100" />
            <el-table-column prop="department" label="部门" width="120">
              <template #default="{ row }">
                {{ row.department || '未设置' }}
              </template>
            </el-table-column>
            <el-table-column prop="employeeId" label="员工编号" width="120" />
            <el-table-column prop="bindCard" label="绑定卡号" width="120" />
            <el-table-column label="用户类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.userType === 1 ? 'info' : row.userType === 2 ? 'success' : 'warning'">
                  {{ formatUserType(row.userType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="管理级别" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.adminLevel === 1 ? 'info' : row.adminLevel === 2 ? 'success' : row.adminLevel === 3 ? 'warning' : 'danger'">
                  {{ formatAdminLevel(row.adminLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="province" label="省份" width="100">
              <template #default="{ row }">
                {{ row.province || '未设置' }}
              </template>
            </el-table-column>
            <el-table-column prop="city" label="城市" width="100">
              <template #default="{ row }">
                {{ row.city || '未设置' }}
              </template>
            </el-table-column>
            <el-table-column prop="district" label="区域" width="100">
              <template #default="{ row }">
                {{ row.district || '未设置' }}
              </template>
            </el-table-column>
            <el-table-column prop="address" label="地址" min-width="150">
              <template #default="{ row }">
                {{ row.address || '未设置' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                  {{ row.status === 1 ? '启用' : '禁用' }}
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
    
    <!-- 新增/编辑用户弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="800px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form 
        ref="userFormRef" 
        :model="userForm" 
        :rules="userFormRules" 
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="userName">
              <el-input
                v-model="userForm.userName"
                placeholder="请输入用户名"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="department">
              <el-input
                v-model="userForm.department"
                placeholder="请输入部门"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="员工编号" prop="employeeId">
              <el-input
                v-model="userForm.employeeId"
                placeholder="请输入员工编号"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="绑定卡号" prop="bindCard">
              <el-input
                v-model="userForm.bindCard"
                placeholder="请输入绑定卡号"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="userForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-select
                v-model="userForm.status"
                placeholder="请选择状态"
                style="width: 100%"
              >
                <el-option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户类型" prop="userType">
              <el-select
                v-model="userForm.userType"
                placeholder="请选择用户类型"
                style="width: 100%"
              >
                <el-option
                  v-for="option in userTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="管理员级别" prop="adminLevel">
              <el-select
                v-model="userForm.adminLevel"
                placeholder="请选择管理员级别"
                style="width: 100%"
              >
                <el-option
                  v-for="option in adminLevelOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="省份" prop="province">
              <el-input
                v-model="userForm.province"
                placeholder="请输入省份"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="城市" prop="city">
              <el-input
                v-model="userForm.city"
                placeholder="请输入城市"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="区域" prop="district">
              <el-input
                v-model="userForm.district"
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
                v-model="userForm.address"
                type="textarea"
                :rows="3"
                placeholder="请输入详细地址"
              />
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
.user-management-container {
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
          
          .el-form-item:last-child,
          .el-form-item:nth-last-child(-n+2) {
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