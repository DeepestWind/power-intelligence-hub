<script setup lang='ts'>
import { ref, onMounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Delete, View, Setting, Plus, CreditCard, Box, OfficeBuilding } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";
import { useAreaStore } from "@/store/modules/area";
import { useAreaSelect } from "@/utils/useAreaSelect";
import { usePageSearch } from "@/utils/useAreaFilter";
import { useUserStoreHook } from '@/store/modules/user';
//import { transformPcaToTree } from "@/utils/area";

// 导入 API 方法和类型
import { 
  getUserList as getUserListApi, 
  addUser as addUserApi, 
  updateUser as updateUserApi, 
  deleteUser as deleteUserApi,
  getUserIcCards as getUserIcCardsApi,
  addUserIcCard as addUserIcCardApi,
  deleteUserIcCard as deleteUserIcCardApi,
  getUserCabinets as getUserCabinetsApi,
  addUserCabinet as addUserCabinetApi,
  deleteUserCabinet as deleteUserCabinetApi,
  getCabinetList as getCabinetListApi,
  getUserFaces as getUserFacesApi,
  uploadFace as uploadFaceApi,
  deleteFace as deleteFaceApi,
  addUserDepartment as addUserDepartmentApi,
  deleteUserDepartment as deleteUserDepartmentApi,
  type UserData,
  type UserFormData,
  type UserQueryParams,
  type UserIcCard,
  type UserCabinet,
  type CabinetListItem
} from '@/api/userManage';

import { 
  getDepartmentByCurrentUser, // 导入部门 API
  getDepartmentByUserId
} from '@/api/department';

defineOptions({
  name: "UserManagement"
});
const areaStore = useAreaStore();

// 响应式数据
const loading = ref(false);
const tableData = ref<UserData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 部门下拉框相关数据
const departmentOptions = ref<Array<{ label: string; value: string }>>([]);
const departmentLoading = ref(false);


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
    userName: '',
    departmentName: '',
  },
  // 搜索回调函数
  () => {
    currentPage.value = 1;
    getUserList();
  }
);


// 用户表单数据
const userForm = ref({
  userName: '',
  departmentId: null,
  departmentName: '',
  employeeId: '',
  password: '',
  userType: 1,
  adminLevel: 1,
  province: '',
  city: '',
  district: '',
  address: '',
});

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
} = useAreaSelect(userForm);


// 修改省市区改变事件处理
const handleUserProvinceChange = () => {
  handleProvinceChange(userForm.value);
};

const handleUserCityChange = () => {
  handleCityChange(userForm.value);
};

// 新增用户相关数据
const dialogVisible = ref(false);
const dialogTitle = ref('新增用户');
const isEdit = ref(false);


// 添加用户类型和管理员级别的自定义验证规则
const validateAdminLevel = (rule: any, value: any, callback: any) => {
  const { userType } = userForm.value;
  
  if (userType === 0 && value !== 0) {
    callback(new Error('普通用户的管理员级别必须为普通用户'));
  } else if (userType === 2 && value !== 3) {
    callback(new Error('超级管理员的管理员级别必须为省级'));
  } else if (userType === 1 && ![1, 2, 3].includes(value)) {
    callback(new Error('管理员的级别必须为区级、市级或省级'));
  } else {
    callback();
  }
};
// 添加区域权限验证到表单验证规则
const validateAreaPermissionRule = (rule: any, value: any, callback: any) => {
  const { province, city, district } = userForm.value;
  
  // 只在有选择的情况下验证
  if (province) {
    if (!validateAreaPermission(province, city, district)) {
      callback(new Error('您没有权限在该区域创建用户'));
    } else {
      callback();
    }
  } else {
    callback();
  }
};

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
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 5, max: 20, message: '密码长度为5-20个字符', trigger: 'blur' }
  ],
  userType: [
    { required: true, message: '请选择用户类型', trigger: 'change' }
  ],
  adminLevel: [
    { required: true, message: '请选择管理员级别', trigger: 'change' },
    { validator: validateAdminLevel, trigger: 'change' } // 添加自定义验证
  ],
  // 省市区验证规则
  // 添加区域权限验证
  province: [
    { 
      validator: (rule: any, value: any, callback: any) => {
        // 超级管理员不需要省份
        if (userForm.value.userType === 2) {
          callback();
          return;
        }
        // 其他用户类型需要省份
        if (!value) {
          callback(new Error('请选择省份'));
          return;
        }
        // 验证区域权限
        validateAreaPermissionRule(rule, value, callback);
      }, 
      trigger: 'change' 
    }
  ],
  city: [
    { validator: validateAreaPermissionRule, trigger: 'change' }
  ],
  district: [
    { validator: validateAreaPermissionRule, trigger: 'change' }
  ]
};

const userFormRef = ref();

// 用户类型选项
const userTypeOptions = [
  { label: '普通用户', value: 0 },
  { label: '管理员', value: 1 },
  { label: '超级管理员', value: 2 }
];

// 管理员级别选项 - 根据用户类型动态显示
const adminLevelOptions = computed(() => {
  switch (userForm.value.userType) {
    case 0: // 普通用户
      return [
        { label: '普通用户', value: 0 }
      ];
    case 1: // 管理员
      return [
        { label: '区级', value: 1 },
        { label: '市级', value: 2 },
        { label: '省级', value: 3 }
      ];
    case 2: // 超级管理员
      return [
        { label: '省级', value: 3 }
      ];
    default:
      return [
        { label: '普通用户', value: 0 }
      ];
  }
});
// 用户类型改变时的处理函数
const handleUserTypeChange = () => {
  // 根据用户类型设置对应的管理员级别
  switch (userForm.value.userType) {
    case 0: // 普通用户
      userForm.value.adminLevel = 0;
      break;
    case 1: // 管理员
      // 如果当前级别不在管理员可选范围内，设置为区级
      if (![1, 2, 3].includes(userForm.value.adminLevel)) {
        userForm.value.adminLevel = 1; // 默认设置为区级
      }
      break;
    case 2: // 超级管理员
      userForm.value.adminLevel = 3; // 强制设置为省级
      // 超级管理员清空城市和区域
      userForm.value.province = '';
      userForm.value.city = '';
      userForm.value.district = '';
      break;
    default:
      userForm.value.adminLevel = 0;
  }
  
  // 根据新的管理员级别清理不适用的地区选择
  handleAdminLevelChange();
  
  console.log('用户类型改变:', userForm.value.userType, '管理员级别:', userForm.value.adminLevel);
};
// 添加管理员级别改变时的处理函数
const handleAdminLevelChange = () => {
  const { userType, adminLevel } = userForm.value;
  
  // 根据管理员级别清理不适用的地区选择
  if (userType === 2 || adminLevel === 3) {
    // 超级管理员或省级管理员：清空城市和区域
    userForm.value.province = '';
    userForm.value.city = '';
    userForm.value.district = '';
  } else if (adminLevel === 2) {
    // 市级管理员：只清空区域
    userForm.value.district = '';
  }
};


// 添加查看弹窗相关数据
const manageDialogVisible = ref(false);
const currentManageUser = ref<UserData | null>(null);
// IC卡管理相关数据
const userIcCards = ref<UserIcCard[]>([]);
const icCardLoading = ref(false);
const addIcCardVisible = ref(false);
const newIcCard = ref('');
// 添加绑定柜子相关数据
const userCabinets = ref<UserCabinet[]>([]);
const cabinetLoading = ref(false);
const addCabinetVisible = ref(false);
const newCabinetId = ref('');
const newCabinetName = ref('');

// 绑定部门管理相关数据
const userDepartments = ref<Array<{ id: string; name: string }>>([]);
const departmentManageLoading = ref(false);
const addDepartmentVisible = ref(false);
const availableDepartments = ref<Array<{ id: string; name: string }>>([]);
const departmentListLoading = ref(false);
// 选择部门相关数据
const selectedDepartment = ref<{ id: string; name: string } | null>(null);


// 获取部门下拉选项
const loadDepartmentOptions = async () => {
  departmentLoading.value = true;
  try {

    // 从 store 中获取当前用户ID
    const userStore = useUserStoreHook();
    const currentUserId = userStore.getCurrentUserId;
    
    if (!currentUserId) {
      ElMessage.error('无法获取当前用户信息');
      departmentOptions.value = [];
      return;
    }
    
    const result = await getDepartmentByCurrentUser(currentUserId);
    
    if (result.code === 200) {
      departmentOptions.value = Object.entries(result.data).map(([id, name]) => ({
        label: name,
        value: name // 使用部门名称作为搜索值
      }));
      console.log('获取部门选项成功:', departmentOptions.value);
    } else {
      ElMessage.error(result.msg || '获取部门选项失败');
      departmentOptions.value = [];
    }
    
  } catch (error) {
    ElMessage.error('获取部门选项失败，请检查网络连接');
    console.error('获取部门选项错误:', error);
    departmentOptions.value = [];
  } finally {
    departmentLoading.value = false;
  }
};

// 获取用户列表（使用 API 方法）
const getUserList = async () => {
  loading.value = true;
  try {
    // 使用 API 方法和类型
    const params: UserQueryParams = {
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value
    };
    
    console.log('用户搜索参数:', params);

    const response = await getUserListApi(params);
    
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


// 打开新增用户弹窗
const handleAddUser = () => {
  if (!hasPermissionData.value) {
    ElMessage.warning('权限数据未加载，请稍后再试');
    return;
  }
  dialogTitle.value = '新增用户';
  isEdit.value = false;
  resetUserForm();
  dialogVisible.value = true;
  // 使用 nextTick 确保表单渲染完成后再清除验证
  nextTick(() => {
    if (userFormRef.value) {
      userFormRef.value.clearValidate();
    }
  });
};

// 重置表单
const resetUserForm = () => {
  userForm.value = {
    userName: '',
    departmentId: null, 
    departmentName: '', 
    employeeId: '',
    password: '',
    userType: 1,
    adminLevel: 1,
    province: '',
    city: '',
    district: '',
    address: '',
  };
  // 清理当前编辑用户引用
  currentEditUser.value = null;
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
    // 使用工具类的权限验证
    const { province, city, district } = userForm.value;
    if (province && !validateAreaPermission(province, city, district)) {
      ElMessage.error('您没有权限在该区域创建用户，请重新选择');
      return;
    }
    
    if (isEdit.value) {
      console.log('执行更新操作，当前编辑用户:', currentEditUser.value);
      await updateUser();
    } else {
      console.log('执行新增操作');
      await addUser();
    }
    
    dialogVisible.value = false;
    resetUserForm();
    getUserList();
    
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 新增用户（使用 API 方法）
const addUser = async () => {
  try {
    // 使用 API 方法
    const result = await addUserApi(userForm.value);
    
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

const currentEditUser = ref<UserData | null>(null);

// 更新用户（使用 API 方法）
const updateUser = async () => {
  try {
    if (!currentEditUser.value?.id) {
      throw new Error('缺少用户ID，无法更新');
    }

    const requestData: UserFormData = {
      ...userForm.value,
      id: currentEditUser.value.id
    };
    
    // 使用 API 方法
    const result = await updateUserApi(requestData);
    
    if (result.code === 200) {
      ElMessage.success('用户更新成功');
      console.log('更新用户成功:', result);
    } else {
      ElMessage.error(result.msg || '用户更新失败');
      throw new Error(result.msg || '用户更新失败');
    }
    
  } catch (error) {
    ElMessage.error('用户更新失败，请检查网络连接');
    console.error('更新用户错误:', error);
    throw error;
  }
};


// 删除用户（使用 API 方法）
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
    
    // 使用 API 方法
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
  currentEditUser.value = { ...row }; // 保存当前编辑的用户数据
  
  // 填充表单数据
  userForm.value = {
    userName: row.userName,
    departmentId: row.departmentId,
    departmentName: row.departmentName || '', 
    employeeId: row.employeeId,
    password: row.password,
    userType: row.userType,
    adminLevel: row.adminLevel,
    province: row.province || '',
    city: row.city || '',
    district: row.district || '',
    address: row.address || ''
  };
  
  // 编辑时验证用户类型和管理员级别的一致性
  nextTick(() => {
    validateUserTypeAndAdminLevel();
    if (userFormRef.value) {
      userFormRef.value.clearValidate();
    }
  });
  
  dialogVisible.value = true;
};
// 验证用户类型和管理员级别的一致性
const validateUserTypeAndAdminLevel = () => {
  const { userType, adminLevel } = userForm.value;
  
  // 检查数据一致性，如果不一致则修正
  if (userType === 0 && adminLevel !== 0) {
    userForm.value.adminLevel = 0;
    ElMessage.warning('普通用户的管理员级别已自动调整为普通用户');
  } else if (userType === 2 && adminLevel !== 3) {
    userForm.value.adminLevel = 3;
    ElMessage.warning('超级管理员的管理员级别已自动调整为省级');
  } else if (userType === 1 && ![1, 2, 3].includes(adminLevel)) {
    userForm.value.adminLevel = 1;
    ElMessage.warning('管理员的管理员级别已自动调整为区级');
  }
  // 根据管理员级别验证和清理地区选择
  validateAreaByAdminLevel();
};
// 添加根据管理员级别验证地区选择的函数
const validateAreaByAdminLevel = () => {
  const { userType, adminLevel, city, district } = userForm.value;
  let hasChanges = false;
  
  // 超级管理员或省级管理员不应该有城市和区域
  if ((userType === 2 || adminLevel === 3) && (city || district)) {
    userForm.value.city = '';
    userForm.value.district = '';
  }
  // 市级管理员不应该有区域
  else if (adminLevel === 2 && district) {
    userForm.value.district = '';
  }
  
};
// 判断根据管理员级别是否禁用某个级别的选择
const isDisabledByAdminLevel = (level: 'city' | 'district') => {
  const { userType, adminLevel } = userForm.value;
  
  // 只有管理员和超级管理员才有级别限制
  if (userType === 0) return false; // 普通用户无限制

  // 超级管理员禁用所有地区选择
  if (userType === 2) return true;
  
  
  if (level === 'city') {
    // 省级管理员(3)和超级管理员(userType=2)不能选择城市
    return adminLevel === 3 || userType === 2;
  }
  
  if (level === 'district') {
    // 市级管理员(2)、省级管理员(3)和超级管理员(userType=2)不能选择区域
    return adminLevel >= 2 || userType === 2;
  }
  
  return false;
};

// 查看用户功能
const handleView = (row: UserData) => {
  // 这里实现新的查看功能
  ElMessage.info(`查看用户: ${row.userName}`);
  console.log('查看用户:', row);
  // TODO: 实现新的查看功能逻辑
};


// 查看用户 现有功能为IC卡管理和绑定柜子管理和部门管理
const handleManage = async (row: UserData) => {
  try {
    console.log('查看用户详情:', row);
    
    if (!row || !row.id) {
      ElMessage.error('用户信息不完整');
      return;
    }
    
    currentManageUser.value = { ...row };
    manageDialogVisible.value = true;
    
    // 分别加载数据，避免Promise.all可能的问题
    await loadUserIcCards(row.id);
    await loadUserCabinets(row.id);
    await loadUserDepartments(row.id);
    
  } catch (error) {
    console.error('查看用户详情错误:', error);
    ElMessage.error('加载用户详情失败');
    manageDialogVisible.value = false;
  }
};

// 加载用户绑定部门信息
const loadUserDepartments = async (userId: number) => {
  departmentManageLoading.value = true;
  try {
    // 从当前查看用户中获取部门信息
    if (currentManageUser.value?.departmentId && currentManageUser.value?.departmentName) {
      userDepartments.value = [{
        id: currentManageUser.value.departmentId.toString(),
        name: currentManageUser.value.departmentName
      }];
    } else {
      userDepartments.value = [];
    }
    console.log('获取用户绑定部门成功:', userDepartments.value);
    
  } catch (error) {
    ElMessage.error('获取绑定部门信息失败，请检查网络连接');
    console.error('获取用户绑定部门错误:', error);
    userDepartments.value = [];
  } finally {
    departmentManageLoading.value = false;
  }
};

// 获取可选部门列表
const loadAvailableDepartments = async (userId: number) => {
  departmentListLoading.value = true;
  try {
    const result = await getDepartmentByUserId(userId);
    
    if (result.code === 200) {
      availableDepartments.value = Object.entries(result.data).map(([id, name]) => ({
        id,
        name
      }));
      console.log('获取可选部门成功:', availableDepartments.value);
    } else {
      ElMessage.error(result.msg || '获取可选部门失败');
      availableDepartments.value = [];
    }
    
  } catch (error) {
    ElMessage.error('获取可选部门失败，请检查网络连接');
    console.error('获取可选部门错误:', error);
    availableDepartments.value = [];
  } finally {
    departmentListLoading.value = false;
  }
};

// 选择部门
const handleSelectDepartment = (department: { id: string; name: string }) => {
  selectedDepartment.value = department;
  console.log('选择部门:', department);
};
// 确认添加部门
const handleConfirmAddDepartment = async () => {
  if (!selectedDepartment.value) {
    ElMessage.warning('请选择要绑定的部门');
    return;
  }
  
  if (!currentManageUser.value) {
    ElMessage.error('用户信息异常');
    return;
  }
  
  try {
    // 使用新的API方法
    const result = await addUserDepartmentApi(
      currentManageUser.value.id,
      parseInt(selectedDepartment.value.id),
      selectedDepartment.value.name
    );
    
    if (result.code === 200) {
      ElMessage.success('部门绑定成功');
      addDepartmentVisible.value = false;
      selectedDepartment.value = null;

      // 更新当前查看用户的部门信息
      if (currentManageUser.value) {
        currentManageUser.value.departmentId = parseInt(selectedDepartment.value.id);
        currentManageUser.value.departmentName = selectedDepartment.value.name;
      }

      await loadUserDepartments(currentManageUser.value.id);
    } else {
      ElMessage.error(result.msg || '部门绑定失败');
    }
    
  } catch (error) {
    ElMessage.error('部门绑定失败，请检查网络连接');
    console.error('添加用户部门错误:', error);
  }
};
// 删除用户部门
const handleDeleteUserDepartment = async () => {
  if (!currentManageUser.value) {
    ElMessage.error('用户信息异常');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要移除该用户的所有部门绑定吗？移除后无法恢复！',
      '移除确认',
      {
        confirmButtonText: '确定移除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 使用新的API方法
    const result = await deleteUserDepartmentApi(currentManageUser.value.id);
    
    if (result.code === 200) {
      ElMessage.success('部门绑定移除成功');
      // 清空当前查看用户的部门信息
      if (currentManageUser.value) {
        currentManageUser.value.departmentId = null;
        currentManageUser.value.departmentName = null;
      }

      await loadUserDepartments(currentManageUser.value.id);
    } else {
      ElMessage.error(result.msg || '部门绑定移除失败');
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('部门绑定移除失败，请检查网络连接');
      console.error('移除用户部门错误:', error);
    }
  }
};

// 打开添加部门弹窗
const handleAddDepartment = async () => {
  if (!currentManageUser.value) {
    ElMessage.error('用户信息异常');
    return;
  }
  
  selectedDepartment.value = null; // 重置选择状态
  addDepartmentVisible.value = true;
  await loadAvailableDepartments(currentManageUser.value.id);
};

// 加载用户IC卡信息（使用 API 方法）
const loadUserIcCards = async (userId: number) => {
  icCardLoading.value = true;
  try {
    // 使用 API 方法
    const result = await getUserIcCardsApi(userId);
    
    if (result.code === 200) {
      userIcCards.value = (result.data || []).map((icCard: string) => ({
        icCard: icCard
      }));
      console.log('获取用户IC卡成功:', userIcCards.value);
    } else {
      ElMessage.error(result.msg || '获取IC卡信息失败');
      userIcCards.value = [];
    }
    
  } catch (error) {
    ElMessage.error('获取IC卡信息失败，请检查网络连接');
    console.error('获取用户IC卡错误:', error);
    userIcCards.value = [];
  } finally {
    icCardLoading.value = false;
  }
};
// 打开添加IC卡弹窗
const handleAddIcCard = () => {
  newIcCard.value = '';
  addIcCardVisible.value = true;
};

// 确认添加IC卡（使用 API 方法）
const handleConfirmAddIcCard = async () => {
  if (!newIcCard.value.trim()) {
    ElMessage.warning('请输入IC卡号');
    return;
  }
  
  if (!currentManageUser.value) {
    ElMessage.error('用户信息异常');
    return;
  }
  
  try {
    const cardData = {
      userId: currentManageUser.value.id,
      userName: currentManageUser.value.userName,
      icCard: newIcCard.value.trim()
    };
    
    // 使用 API 方法
    const result = await addUserIcCardApi(cardData);
    
    if (result.code === 200) {
      ElMessage.success('IC卡添加成功');
      addIcCardVisible.value = false;
      newIcCard.value = '';
      await loadUserIcCards(currentManageUser.value.id);
    } else {
      ElMessage.error(result.msg || 'IC卡添加失败');
    }
    
  } catch (error) {
    ElMessage.error('IC卡添加失败，请检查网络连接');
    console.error('添加IC卡错误:', error);
  }
};

// 删除IC卡（使用 API 方法）
const handleDeleteIcCard = async (icCard: UserIcCard) => {
  if (!currentManageUser.value) {
    ElMessage.error('用户信息异常');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要删除IC卡 "${icCard.icCard}" 吗？删除后无法恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 使用 API 方法
    const result = await deleteUserIcCardApi(currentManageUser.value.id, icCard.icCard);
    
    if (result.code === 200) {
      ElMessage.success('IC卡删除成功');
      await loadUserIcCards(currentManageUser.value.id);
    } else {
      ElMessage.error(result.msg || 'IC卡删除失败');
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('IC卡删除失败，请检查网络连接');
      console.error('删除IC卡错误:', error);
    }
  }
};

// 添加柜子列表相关数据
const cabinetListData = ref<CabinetListItem[]>([]);
const cabinetListLoading = ref(false);
const selectedCabinet = ref<CabinetListItem | null>(null);
const cabinetListCurrentPage = ref(1);
const cabinetListPageSize = ref(10);
const cabinetListTotal = ref(0);
// 加载用户绑定柜子信息（使用 API 方法）
const loadUserCabinets = async (userId: number) => {
  cabinetLoading.value = true;
  try {
    // 使用 API 方法
    const result = await getUserCabinetsApi(userId);
    
    if (result.code === 200) {
      const cabinetData = result.data || {};
      userCabinets.value = Object.entries(cabinetData).map(([cabinetId, cabinetName]) => ({
        id: parseInt(cabinetId),
        userId: userId,
        cabinetId: parseInt(cabinetId),
        cabinetName: cabinetName
      }));
      
      console.log('获取用户绑定柜子成功:', userCabinets.value);
    } else {
      ElMessage.error(result.msg || '获取绑定柜子信息失败');
      userCabinets.value = [];
    }
    
  } catch (error) {
    ElMessage.error('获取绑定柜子信息失败，请检查网络连接');
    console.error('获取用户绑定柜子错误:', error);
    userCabinets.value = [];
  } finally {
    cabinetLoading.value = false;
  }
};
// 打开添加绑定柜子弹窗
const handleAddCabinet = async () => {
  selectedCabinet.value = null;
  cabinetListCurrentPage.value = 1;
  addCabinetVisible.value = true;
  
  // 打开弹窗时立即加载柜子列表
  await loadCabinetList();
};
// 加载柜子列表（使用 API 方法）
const loadCabinetList = async () => {
  cabinetListLoading.value = true;
  try {
    // 使用 API 方法
    const result = await getCabinetListApi({
      pageNum: cabinetListCurrentPage.value,
      pageSize: cabinetListPageSize.value
    });
    
    if (result.code === 200) {
      cabinetListData.value = result.data.records || [];
      cabinetListTotal.value = result.data.total || 0;
      console.log('获取柜子列表成功:', cabinetListData.value);
    } else {
      ElMessage.error(result.msg || '获取柜子列表失败');
      cabinetListData.value = [];
    }
    
  } catch (error) {
    ElMessage.error('获取柜子列表失败，请检查网络连接');
    console.error('获取柜子列表错误:', error);
    cabinetListData.value = [];
  } finally {
    cabinetListLoading.value = false;
  }
};
// 柜子列表分页改变
const handleCabinetListPageChange = (page: number) => {
  cabinetListCurrentPage.value = page;
  loadCabinetList();
};
const handleCabinetListSizeChange = (size: number) => {
  cabinetListPageSize.value = size;
  cabinetListCurrentPage.value = 1;
  loadCabinetList();
};
// 选择柜子
const handleSelectCabinet = (cabinet: CabinetListItem) => {
  selectedCabinet.value = cabinet;
  console.log('选择柜子:', cabinet);
};
// 确认添加绑定柜子（使用 API 方法）
const handleConfirmAddCabinet = async () => {
  if (!selectedCabinet.value) {
    ElMessage.warning('请选择要绑定的柜子');
    return;
  }
  
  if (!currentManageUser.value) {
    ElMessage.error('用户信息异常');
    return;
  }
  
  try {
    const cabinetData = {
      userId: currentManageUser.value.id,
      cabinetId: selectedCabinet.value.id,
      cabinetName: selectedCabinet.value.cabinetName
    };
    
    // 使用 API 方法
    const result = await addUserCabinetApi(cabinetData);
    
    if (result.code === 200) {
      ElMessage.success('柜子绑定成功');
      addCabinetVisible.value = false;
      selectedCabinet.value = null;
      cabinetListData.value = [];
      await loadUserCabinets(currentManageUser.value.id);
    } else {
      ElMessage.error(result.msg || '柜子绑定失败');
    }
    
  } catch (error) {
    ElMessage.error('柜子绑定失败，请检查网络连接');
    console.error('添加绑定柜子错误:', error);
  }
};

// 删除绑定柜子（使用 API 方法）
const handleDeleteCabinet = async (cabinet: UserCabinet) => {
  if (!currentManageUser.value) {
    ElMessage.error('用户信息异常');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定要解除与柜子 "${cabinet.cabinetName}" 的绑定吗？解除后无法恢复！`,
      '解除绑定确认',
      {
        confirmButtonText: '确定解除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 使用 API 方法
    const result = await deleteUserCabinetApi(currentManageUser.value.id, cabinet.cabinetId);
    
    if (result.code === 200) {
      ElMessage.success('柜子绑定解除成功');
      await loadUserCabinets(currentManageUser.value.id);
    } else {
      ElMessage.error(result.msg || '柜子绑定解除失败');
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('柜子绑定解除失败，请检查网络连接');
      console.error('删除绑定柜子错误:', error);
    }
  }
};
// 关闭查看弹窗
const closeManageDialog = () => {
  manageDialogVisible.value = false;
  currentManageUser.value = null;
  userIcCards.value = [];
  userCabinets.value = []; 
  userDepartments.value = [];
  newIcCard.value = '';
  selectedCabinet.value = null;
  selectedDepartment.value = null;
  cabinetListData.value = [];
  cabinetListCurrentPage.value = 1;
  addIcCardVisible.value = false;
  addCabinetVisible.value = false;
  addDepartmentVisible.value = false;
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
  const option = adminLevelOptions.value.find(opt => opt.value === adminLevel); // 添加 .value
  return option ? option.label : '未知';
};

// 添加人脸识别相关数据
const faceDialogVisible = ref(false);
const currentUserId = ref<number | null>(null);
const currentUserName = ref('');
const faceImages = ref<string[]>([]);
//const currentUserFaceFilename = ref<string | null>(null);
const faceLoading = ref(false);
const uploadLoading = ref(false);
// 添加文件上传引用
const fileInputRef = ref<HTMLInputElement>();

// 打开人脸识别弹窗
const handleFaceRecognition = async (row: UserData) => {
  currentUserId.value = row.id;
  currentUserName.value = row.userName;
  //currentUserFaceFilename.value = row.faceRecognition;
  faceDialogVisible.value = true;
  await loadUserFaces();
};
// 加载用户人脸信息（使用 API 方法）
const loadUserFaces = async () => {
  if (!currentUserId.value) return;
  
  faceImages.value.forEach(url => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
  faceImages.value = [];
  
  faceLoading.value = true;
  try {
    // 使用 API 方法
    const result = await getUserFacesApi(currentUserId.value);
    
    if (result.code === 200) {
      if (result.data) {
        faceImages.value = [result.data];
        console.log('获取用户人脸信息成功:', faceImages.value);
      } else {
        faceImages.value = [];
        console.log('用户人脸数据为空');
      }
    } else if (result.code === 404) {
      faceImages.value = [];
      console.log('该用户暂无人脸数据');
    } else {
      ElMessage.error(result.msg || '获取人脸信息失败');
    }
    
  } catch (error) {
    if (error.message?.includes('404')) {
      faceImages.value = [];
      console.log('该用户暂无人脸数据(404)');
    } else {
      ElMessage.error('获取人脸信息失败，请检查网络连接');
      console.error('获取人脸信息错误:', error);
    }
  } finally {
    faceLoading.value = false;
  }
};
// 触发文件选择
const triggerFileUpload = () => {
  fileInputRef.value?.click();
};
// 处理文件上传（使用 API 方法）
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file || !currentUserId.value) return;
  
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB');
    return;
  }
  
  uploadLoading.value = true;
  try {
    // 使用 API 方法
    const result = await uploadFaceApi(currentUserId.value, file);
    
    if (result.code === 200) {
      ElMessage.success('人脸照片上传成功');
      await loadUserFaces();
    } else {
      ElMessage.error(result.msg || '人脸照片上传失败');
    }
    
  } catch (error) {
    ElMessage.error('人脸照片上传失败，请检查网络连接');
    console.error('上传人脸照片错误:', error);
  } finally {
    uploadLoading.value = false;
    if (target) target.value = '';
  }
};
// 删除人脸照片（使用 API 方法）
const handleDeleteFace = async (imageUrl: string, index: number) => {
  if (!currentUserId.value) {
    ElMessage.error('无法获取用户信息，删除失败');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要删除这张人脸照片吗？删除后无法恢复！',
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 使用 API 方法
    const result = await deleteFaceApi(currentUserId.value);
    
    if (result.code === 200) {
      faceImages.value.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      
      faceImages.value = [];
      
      const isDeleted = await verifyDeletionStatus(currentUserId.value);
      if (isDeleted) {
        ElMessage.success('人脸照片删除成功');
      } else {
        ElMessage.warning('删除请求已发送，可能需要稍等片刻生效');
      }
      
    } else {
      ElMessage.error(result.msg || '人脸照片删除失败');
    }
    
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('人脸照片删除失败，请检查网络连接');
      console.error('删除人脸照片错误:', error);
    }
  }
};
// 验证删除状态（使用 API 方法）
const verifyDeletionStatus = async (userId: number, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      
      // 使用 API 方法
      const result = await getUserFacesApi(userId);
      if (result.code === 404) {
        return true;
      }
    } catch (error) {
      if (error.message?.includes('404')) {
        return true;
      }
    }
  }
  return false;
};
// 关闭人脸识别弹窗
const closeFaceDialog = () => {
  // 清理创建的图片URL，防止内存泄漏
  faceImages.value.forEach(url => {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  });
  faceDialogVisible.value = false;
  currentUserId.value = null;
  currentUserName.value = '';
  // 删除文件名清理逻辑
  // currentUserFaceFilename.value = null;
  faceImages.value = [];
};

// 生命周期
onMounted(async () => {
  // 使用工具类初始化权限数据
  await initAreaSelectData();
  
  // 加载部门选项
  await loadDepartmentOptions();

  // 获取用户列表
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
              <el-select
                v-model="searchForm.departmentName"
                placeholder="请选择部门"
                clearable
                :loading="departmentLoading"
                style="width: 200px"
              >
                <el-option
                  v-for="option in departmentOptions"
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
            <el-table-column prop="departmentName" label="部门" width="120">
              <template #default="{ row }">
                {{ row.departmentName || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="employeeId" label="员工编号" width="120" />
            <!-- <el-table-column prop="bindCard" label="绑定卡号" width="120" /> -->
            <el-table-column label="用户类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.userType === 0 ? 'info' : row.userType === 1 ? 'success' : 'warning'">
                  {{ formatUserType(row.userType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="管理级别" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.adminLevel === 0 ? 'info' : row.adminLevel === 1 ? 'success' : row.adminLevel === 3 ? 'warning' : 'danger'">
                  {{ formatAdminLevel(row.adminLevel) }}
                </el-tag>
              </template>
            </el-table-column>
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
            <el-table-column prop="address" label="地址" min-width="150">
              <template #default="{ row }">
                {{ row.address || '-' }}
              </template>
            </el-table-column>
            <!-- <el-table-column label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column> -->
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">
                {{ new Date(row.createTime).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="420" fixed="right">
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
                  type="primary" 
                  size="small" 
                  :icon="Setting"
                  @click="handleManage(row)"
                >
                  管理
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
                  type="warning" 
                  size="small" 
                  @click="handleFaceRecognition(row)"
                >
                  人脸识别
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
            <el-form-item label="部门" prop="departmentName">
              <el-input
                v-model="userForm.departmentName"
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
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户类型" prop="userType">
              <el-select
                v-model="userForm.userType"
                placeholder="请选择用户类型"
                style="width: 100%"
                @change="handleUserTypeChange"
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
                :disabled="userForm.userType === 0 || userForm.userType === 2"
                @change="handleAdminLevelChange"
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

        <!-- 修改省市区为下拉选择器，城市和区域改为非必选 -->
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="省份" prop="province">
              <el-select
                v-model="userForm.province"
                placeholder="请选择省份"
                style="width: 100%"
                @change="handleUserProvinceChange"
                clearable
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
                v-model="userForm.city"
                placeholder="请选择城市(可选)"
                style="width: 100%"
                :disabled="!userForm.province || isDisabledByAdminLevel('city')"
                @change="handleUserCityChange"
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
          </el-col>
          <el-col :span="8">
            <el-form-item label="区域" prop="district">
              <el-select
                v-model="userForm.district"
                placeholder="请选择区域(可选)"
                style="width: 100%"
                :disabled="!userForm.city || isDisabledByAdminLevel('district')"
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
    <!-- 添加人脸识别弹窗 -->
    <el-dialog
      v-model="faceDialogVisible"
      :title="`${currentUserName} - 人脸识别管理`"
      width="800px"
      :close-on-click-modal="false"
      @close="closeFaceDialog"
    >
      <div class="face-recognition-container">
        <!-- 上传区域 -->
        <div class="upload-section">
          <el-button 
            type="primary" 
            @click="triggerFileUpload"
            :loading="uploadLoading"
            :disabled="faceLoading"
          >
            {{ uploadLoading ? '上传中...' : '上传人脸照片' }}
          </el-button>
          <span class="upload-tip">支持 JPG、PNG 格式，文件大小不超过 5MB</span>
          
          <!-- 隐藏的文件输入框 -->
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleFileUpload"
          />
        </div>
        
        <!-- 人脸照片展示区域 -->
        <div class="face-images-section">
          <el-divider content-position="left">
            <span class="section-title">已有人脸照片 ({{ faceImages.length }})</span>
          </el-divider>
          
          <div v-loading="faceLoading" class="images-grid">
            <div v-if="faceImages.length === 0 && !faceLoading" class="empty-state">
              <el-empty description="暂无人脸照片" />
            </div>
            
            <div 
              v-for="(image, index) in faceImages" 
              :key="index" 
              class="image-item"
            >
              <div class="image-wrapper">
                <img :src="image" :alt="`人脸照片 ${index + 1}`" />
                <div class="image-overlay">
                  <el-button
                    type="danger"
                    size="small"
                    circle
                    @click="handleDeleteFace(image, index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
              <div class="image-index">照片 {{ index + 1 }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeFaceDialog">关闭</el-button>
        </div>
      </template>
    </el-dialog>    
    <!-- 用户详情查看弹窗 -->
    <el-dialog
      v-model="manageDialogVisible"
      :title="`${currentManageUser?.userName || ''} - 用户管理`"
      width="1200px"
      :close-on-click-modal="false"
      @close="closeManageDialog"
    >
      <div class="user-detail-container">
        <!-- 顶部绑定部门管理 -->
        <div class="top-panel">
          <div class="panel-header">
            <div class="panel-info">
              <h3 class="panel-title">绑定部门管理</h3>
              <span class="panel-subtitle">该用户当前绑定的部门</span>
            </div>
            <el-button 
              type="primary" 
              size="small" 
              @click="handleAddDepartment"
            >
              添加部门
            </el-button>
          </div>
          
          <div class="departments-section">
            <!-- 简化为单行显示 -->
            <div v-if="userDepartments.length > 0" class="department-item">
              <div class="department-content">
                <el-icon class="department-icon"><OfficeBuilding /></el-icon>
                <span class="department-id">ID: {{ userDepartments[0].id }}</span>
                <span class="department-name">{{ userDepartments[0].name }}</span>
              </div>
              <el-button 
                type="danger" 
                size="small" 
                :icon="Delete"
                @click="handleDeleteUserDepartment"
                circle
              />
            </div>
            
            <!-- 空状态显示 -->
            <div v-else class="empty-department" v-loading="departmentManageLoading">
              <el-icon class="empty-icon"><OfficeBuilding /></el-icon>
              <span class="empty-text">暂无绑定的部门</span>
            </div>
          </div>
        </div>
        <div class="bottom-panels">
          <!-- 左侧：绑定卡号管理 -->
          <div class="left-panel">
            <div class="panel-header">
              <h3 class="panel-title">绑定卡号管理</h3>
              <el-button 
                type="primary" 
                size="small" 
                @click="handleAddIcCard"
              >
                添加IC卡
              </el-button>
            </div>
            
            <div class="ic-cards-section">
              <el-table
                :data="userIcCards"
                v-loading="icCardLoading"
                style="width: 100%"
                stripe
                :show-header="true"
                empty-text="暂无绑定的IC卡"
                max-height="400"
              >
                <el-table-column 
                  prop="icCard" 
                  label="IC卡号" 
                  min-width="150"
                >
                  <template #default="{ row }">
                    <div class="card-info">
                      <el-icon class="card-icon"><CreditCard /></el-icon>
                      <span class="card-text">{{ row.icCard }}</span>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column 
                  label="操作" 
                  width="80" 
                  align="center"
                >
                  <template #default="{ row }">
                    <el-button 
                      type="danger" 
                      size="small" 
                      :icon="Delete"
                      @click="handleDeleteIcCard(row)"
                      circle
                    />
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          
          <!-- 右侧：绑定柜子管理 -->
          <div class="right-panel">
            <div class="panel-header">
              <h3 class="panel-title">绑定柜子管理</h3>
              <el-button 
                type="primary" 
                size="small" 
                @click="handleAddCabinet"
              >
                添加柜子
              </el-button>
            </div>
            
            <div class="cabinets-section">
              <el-table
                :data="userCabinets"
                v-loading="cabinetLoading"
                style="width: 100%"
                stripe
                :show-header="true"
                empty-text="暂无绑定的柜子"
                max-height="400"
              >
                <el-table-column 
                  prop="cabinetId" 
                  label="柜子ID" 
                  width="80"
                  align="center"
                >
                  <template #default="{ row }">
                    <el-tag type="info" size="small">
                      {{ row.cabinetId || 0 }}
                    </el-tag>
                  </template>
                </el-table-column>
                
                <el-table-column 
                  prop="cabinetName" 
                  label="柜子名称" 
                  min-width="150"
                >
                  <template #default="{ row }">
                    <div v-if="row" class="cabinet-info">
                      <el-icon class="cabinet-icon"><Box /></el-icon>
                      <span class="cabinet-text">{{ row.cabinetName || '未知柜子' }}</span>
                    </div>
                  </template>
                </el-table-column>
                
                <el-table-column 
                  label="操作" 
                  width="80" 
                  align="center"
                >
                  <template #default="{ row }">
                    <el-button 
                      v-if="row"
                      type="danger" 
                      size="small" 
                      :icon="Delete"
                      @click="handleDeleteCabinet(row)"
                      circle
                    />
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeManageDialog">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加部门弹窗 -->
    <el-dialog
      v-model="addDepartmentVisible"
      title="添加绑定部门"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="department-selection-container">
        <div class="selection-header">
          <span class="selection-title">选择要绑定的部门</span>
          <div class="selection-info">
            <span v-if="selectedDepartment" class="selected-info">
              已选择：{{ selectedDepartment.name }} (ID: {{ selectedDepartment.id }})
            </span>
            <span v-else class="no-selection">请选择一个部门</span>
          </div>
        </div>
        
        <!-- 部门列表表格 -->
        <el-table
          :data="availableDepartments"
          v-loading="departmentListLoading"
          style="width: 100%"
          stripe
          border
          empty-text="暂无可绑定的部门"
          max-height="400"
          highlight-current-row
          @current-change="handleSelectDepartment"
        >
          <el-table-column 
            prop="id" 
            label="部门ID" 
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <el-tag type="success" size="small">
                {{ row.id }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column 
            prop="name" 
            label="部门名称" 
            min-width="300"
          >
            <template #default="{ row }">
              <div class="department-name-cell">
                <el-icon class="department-icon"><OfficeBuilding /></el-icon>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDepartmentVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleConfirmAddDepartment"
            :disabled="!selectedDepartment"
          >
            确定绑定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 添加IC卡弹窗 -->
    <el-dialog
      v-model="addIcCardVisible"
      title="添加IC卡"
      width="400px"
      :close-on-click-modal="false"
    >
      <el-form label-width="80px">
        <el-form-item label="IC卡号" required>
          <el-input
            v-model="newIcCard"
            placeholder="请输入IC卡号"
            clearable
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addIcCardVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmAddIcCard">确定</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- 修改添加绑定柜子弹窗 -->
    <el-dialog
      v-model="addCabinetVisible"
      title="添加绑定柜子"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="cabinet-selection-container">
        <div class="selection-header">
          <span class="selection-title">选择要绑定的柜子</span>
          <div class="selection-info">
            <span v-if="selectedCabinet" class="selected-info">
              已选择：{{ selectedCabinet.cabinetName }} (ID: {{ selectedCabinet.id }})
            </span>
            <span v-else class="no-selection">请选择一个柜子</span>
          </div>
        </div>
        
        <!-- 柜子列表表格 -->
        <el-table
          :data="cabinetListData"
          v-loading="cabinetListLoading"
          style="width: 100%"
          stripe
          border
          empty-text="暂无可绑定的柜子"
          max-height="400"
          highlight-current-row
          @current-change="handleSelectCabinet"
        >
          <el-table-column 
            prop="id" 
            label="柜子ID" 
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <el-tag type="primary" size="small">
                {{ row.id }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column 
            prop="cabinetCode" 
            label="设备编号" 
            width="150"
            align="center"
          />
          
          <el-table-column 
            prop="cabinetName" 
            label="柜子名称" 
            min-width="200"
          >
            <template #default="{ row }">
              <div class="cabinet-name-cell">
                <el-icon class="cabinet-icon"><Box /></el-icon>
                <span>{{ row.cabinetName }}</span>
              </div>
            </template>
          </el-table-column>
          
          <!-- 删除省市区和在线状态列 -->
          <!-- <el-table-column prop="province" label="省份" width="100" />
          <el-table-column prop="city" label="城市" width="100" />
          <el-table-column prop="district" label="区域" width="100" />
          <el-table-column label="在线状态" width="80" align="center" /> -->
        </el-table>
        
        <!-- 分页组件 -->
        <div class="cabinet-pagination">
          <el-pagination
            v-model:current-page="cabinetListCurrentPage"
            v-model:page-size="cabinetListPageSize"
            :page-sizes="[10, 20, 50]"
            :total="cabinetListTotal"
            layout="total, sizes, prev, pager, next"
            @size-change="handleCabinetListSizeChange"
            @current-change="handleCabinetListPageChange"
          />
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addCabinetVisible = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="handleConfirmAddCabinet"
            :disabled="!selectedCabinet"
          >
            确定绑定
          </el-button>
        </div>
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
  .face-recognition-container {
    .upload-section {
      text-align: center;
      padding: 20px 0;
      border: 2px dashed #dcdfe6;
      border-radius: 6px;
      background-color: #fafafa;
      margin-bottom: 20px;
      
      .upload-tip {
        display: block;
        margin-top: 10px;
        font-size: 12px;
        color: #909399;
      }
    }
    
    .face-images-section {
      .section-title {
        font-weight: 500;
        color: #303133;
      }
      
      .images-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 16px;
        min-height: 200px;
        
        .empty-state {
          grid-column: 1 / -1;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .image-item {
          text-align: center;
          
          .image-wrapper {
            position: relative;
            width: 150px;
            height: 150px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #dcdfe6;
            margin: 0 auto 8px;
            
            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            
            .image-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: rgba(0, 0, 0, 0.5);
              display: flex;
              justify-content: center;
              align-items: center;
              opacity: 0;
              transition: opacity 0.3s;
            }
            
            &:hover .image-overlay {
              opacity: 1;
            }
          }
          
          .image-index {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }  
  .user-detail-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    height: 600px;
    // 顶部部门管理面板样式
    .top-panel {
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      overflow: hidden;
      min-height: 100px;
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background-color: #f8f9fa;
        border-bottom: 1px solid #e4e7ed;
        
        .panel-info {
          display: flex;
          flex-direction: column;
          
          .panel-title {
            margin: 0;
            font-size: 16px;
            font-weight: 500;
            color: #303133;
            line-height: 1.2;
          }
          
          .panel-subtitle {
            font-size: 12px;
            color: #909399;
            margin-top: 2px;
          }
        }
      }
      
      .departments-section {
        padding: 16px 20px; // 减少内边距
        
        .department-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background-color: #f8f9fa;
          border-radius: 6px;
          border: 1px solid #e4e7ed;
          
          .department-content {
            display: flex;
            align-items: center;
            gap: 12px;
            
            .department-icon {
              color: #409eff;
              font-size: 18px;
            }
            
            .department-id {
              font-size: 12px;
              color: #909399;
              background-color: #e8f4fd;
              padding: 2px 8px;
              border-radius: 4px;
            }
            
            .department-name {
              font-size: 14px;
              font-weight: 500;
              color: #303133;
            }
          }
        }
        
        .empty-department {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px;
          color: #909399;
          background-color: #fafafa;
          border-radius: 6px;
          border: 1px dashed #e4e7ed;
          
          .empty-icon {
            font-size: 18px;
          }
          
          .empty-text {
            font-size: 14px;
          }
        }
      }
    }
    // 底部面板容器
    .bottom-panels {
      display: flex;
      gap: 20px;
      flex: 1;
    }
    
    .left-panel,
    .right-panel {
      flex: 1;
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      overflow: hidden;
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background-color: #f8f9fa;
        border-bottom: 1px solid #e4e7ed;
        
        .panel-title {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
          color: #303133;
        }
      }
      
      .ic-cards-section,
      .cabinets-section {
        padding: 20px;
        height: calc(100% - 72px);
        overflow: hidden;

        .el-table {
          border-radius: 6px;
          overflow: hidden;
          
          .card-info {
            display: flex;
            align-items: center;
            
            .card-icon {
              margin-right: 8px;
              color: #409eff;
              font-size: 16px;
            }
            
            .card-text {
              font-size: 14px;
              font-weight: 500;
              color: #303133;
            }
          }
          .cabinet-info {
            display: flex;
            align-items: center;
            
            .cabinet-icon {
              margin-right: 8px;
              color: #67c23a;
              font-size: 16px;
            }
            
            .cabinet-text {
              font-size: 14px;
              font-weight: 500;
              color: #303133;
            }
          }
          
        }
        
        .empty-state {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
        }
      }
    }
  }
  // 部门选择弹窗样式
  .department-selection-container {
    .selection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #e4e7ed;
      
      .selection-title {
        font-size: 16px;
        font-weight: 500;
        color: #303133;
      }
      
      .selected-info {
        color: #67c23a;
        font-weight: 500;
        
        &::before {
          content: "✓ ";
        }
      }
      
      .no-selection {
        color: #909399;
        font-size: 14px;
      }
    }
    
    .department-name-cell {
      display: flex;
      align-items: center;
      
      .department-icon {
        margin-right: 8px;
        color: #409eff;
        font-size: 16px;
      }
    }
  }
  .cabinet-selection-container {
    .selection-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 6px;
      border: 1px solid #e4e7ed;
      
      .selection-title {
        font-size: 16px;
        font-weight: 500;
        color: #303133;
      }
      
      .selected-info {
        color: #67c23a;
        font-weight: 500;
        
        &::before {
          content: "✓ ";
        }
      }
      
      .no-selection {
        color: #909399;
        font-size: 14px;
      }
    }
    
    .cabinet-name-cell {
      display: flex;
      align-items: center;
      
      .cabinet-icon {
        margin-right: 8px;
        color: #67c23a;
        font-size: 16px;
      }
    }
    
    .cabinet-pagination {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
    .el-table {
      .el-table-column {
        text-align: center;
      }
      
      .cabinet-name-cell {
        text-align: left;
      }
    }
  }
  .form-tip {
    margin-top: 4px;
    
    .el-text {
      font-size: 12px;
      
    }
  }
  // 禁用状态的选择器样式优化
  .el-select.is-disabled {
    .el-input__wrapper {
      background-color: #f5f7fa;
      border-color: #e4e7ed;
      color: #c0c4cc;
    }
  }
}
:deep(.el-table__body) {
  .el-button.is-circle {
    width: 28px;
    height: 28px;
    padding: 0;
  }
}
// 表格行选中样式优化
:deep(.el-table__row) {
  cursor: pointer;
  
  &:hover {
    background-color: #f5f7fa;
  }
  
  &.current-row {
    background-color: #ecf5ff;
  }
}
</style>