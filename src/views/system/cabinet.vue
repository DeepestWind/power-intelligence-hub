<script setup lang='ts'>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Delete, View, Setting } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import type { AreaNode } from "@/utils/area";
import { useAreaStore } from "@/store/modules/area"; // 🔥 导入 AreaStore
import { useAreaSelect } from "@/utils/useAreaSelect";
import { usePageSearch } from "@/utils/useAreaFilter"; 

defineOptions({
  name: "CabinetManagement"
});

// 🔥 使用 AreaStore
const areaStore = useAreaStore();

// 柜子数据接口（根据API返回数据调整）
interface CabinetData {
  id: number;
  cabinetCode: string;
  cabinetName: string;
  province: string;
  city: string;
  district: string;
  address: string;
  onlineStatus?: number | null; // 🔥 改为可选字段，通过其他API更新
  createTime?: string;
  updatedTime?: string;
}
// 🔥 新增：在线状态相关接口
interface OnlineStatusApiResponse {
  code: number;
  msg: string;
  data: string[];
}
// 🔥 新增：一键开柜API请求接口
interface OpenCabinetRequest {
  cabinetCode: string;
  type: string;
}
// 🔥 新增：一键开柜API响应接口
interface OpenCabinetApiResponse {
  code: number;
  msg: string;
  data?: any;
}
// 🔥 新增：单个设备状态检查API响应接口
interface DeviceStatusApiResponse {
  code: number;
  msg: string;
  data: boolean; // true-在线, false-离线
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

// 设备表单数据
const deviceForm = ref({
  cabinetCode: '',
  cabinetName: '',
  province: '',
  city: '',
  district: '',
  address: '',
});
//以下为省市区下拉框的实现
// 🔥 使用通用的省市区选择器工具类
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

// 🔥 使用页面搜索工具类
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

// 🔥 简化：省市区改变事件处理
// const handleDeviceProvinceChange = () => {
//   handleProvinceChange(deviceForm.value);
// };

// const handleDeviceCityChange = () => {
//   handleCityChange(deviceForm.value);
// };

// const areaData = computed(() => {
//   const userAreaData = areaStore.getCurrentAreaData;
  
//   if (!userAreaData || userAreaData.length === 0) {
//     console.warn('用户无权限区域数据');
//     return [];
//   }
  
//   return userAreaData;
// });
// 🔥 省份选项
// const provinceOptions = computed(() => {
//   const userAreaData = areaData.value;
  
//   if (!userAreaData || userAreaData.length === 0) {
//     return [];
//   }
  
//   return userAreaData.map(item => ({
//     label: item.label,
//     value: item.label
//   }));
// });
// 🔥 城市选项
// const cityOptions = computed(() => {
//   if (!deviceForm.value.province) return [];
  
//   const userAreaData = areaData.value;
//   if (!userAreaData || userAreaData.length === 0) return [];
  
//   // 在用户权限范围内查找省份
//   const province = userAreaData.find(item => item.label === deviceForm.value.province);
  
//   if (!province || !province.children) return [];
  
//   return province.children.map(item => ({
//     label: item.label,
//     value: item.label
//   }));
// });
// 🔥 区域选项
// const districtOptions = computed(() => {
//   if (!deviceForm.value.province || !deviceForm.value.city) return [];
  
//   const userAreaData = areaData.value;
//   if (!userAreaData || userAreaData.length === 0) return [];
  
//   // 在用户权限范围内查找省份和城市
//   const province = userAreaData.find(item => item.label === deviceForm.value.province);
//   if (!province || !province.children) return [];
  
//   const city = province.children.find(item => item.label === deviceForm.value.city);
//   if (!city || !city.children) return [];
  
//   return city.children.map(item => ({
//     label: item.label,
//     value: item.label
//   }));
// });
// 🔥 省份改变时清空城市和区域
// const handleProvinceChange = () => {
//   deviceForm.value.city = '';
//   deviceForm.value.district = '';
// };
// // 🔥 城市改变时清空区域
// const handleCityChange = () => {
//   deviceForm.value.district = '';
// };
// 🔥 新增：权限验证函数
// const validateAreaPermission = (province: string, city?: string, district?: string): boolean => {
//   const userAreaData = areaData.value;
  
//   if (!userAreaData || userAreaData.length === 0) {
//     return false;
//   }
  
//   // 检查省份权限
//   const provinceNode = userAreaData.find(item => item.label === province);
//   if (!provinceNode) {
//     return false;
//   }
  
//   // 如果只检查省份权限
//   if (!city) {
//     return true;
//   }
  
//   // 检查城市权限
//   const cityNode = provinceNode.children?.find(item => item.label === city);
//   if (!cityNode) {
//     return false;
//   }
  
//   // 如果只检查城市权限
//   if (!district) {
//     return true;
//   }
  
//   // 检查区域权限
//   const districtNode = cityNode.children?.find(item => item.label === district);
//   return !!districtNode;
// };


// // 分离区域筛选和表单搜索
// const areaFilter = ref({
//   province: '',
//   city: '',
//   district: ''
// });
// // 搜索表单（修改为新的字段）
// const searchForm = ref({
//   cabinetCode: '',
//   cabinetName: '',
//   //onlineStatus: null as number | null 
// });

// // 处理区域搜索事件，左侧areaSelect组件
// const handleAreaSearch = (area: AreaNode) => {
//   // 清空区域筛选
//   areaFilter.value = { province: '', city: '', district: '' };
  
//   // 设置新的区域筛选
//   fillAreaFilter(area);
  
//   // 自动执行搜索
//   handleSearch();
// };
// const fillAreaFilter = (area: AreaNode) => {
//   const code = area.code;
//   const label = area.label;
  
//   if (code.endsWith('0000')) {
//     areaFilter.value.province = label;
//   } else if (code.endsWith('00')) {
//     areaFilter.value.city = label;
//   } else {
//     areaFilter.value.district = label;
//   }
  
//   ElMessage.info(`区域筛选已设置为: ${label}`);
// };

// // 搜索
// const handleSearch = () => {
//   currentPage.value = 1;
//   getCabinetList();
// };

// // 重置搜索
// const handleReset = () => {
//   searchForm.value = {
//     cabinetCode: '',
//     cabinetName: '',
//     //onlineStatus: null
//   };
//   handleSearch();
// };
// // 清空所有筛选条件
// const handleClearAll = () => {
//   searchForm.value = {
//     cabinetCode: '',
//     cabinetName: '',
//     //onlineStatus: null
//   };
//   areaFilter.value = {
//     province: '',
//     city: '',
//     district: ''
//   };
//   handleSearch();
// };

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
// 🔥 新增：获取在线设备列表的API
const getOnlineDevicesApi = async (): Promise<OnlineStatusApiResponse> => {
  try {
    const response = await fetch('/api/power/dtu/devices', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OnlineStatusApiResponse = await response.json();
    console.log('获取在线设备API响应:', data);
    return data;
    
  } catch (error) {
    console.error('获取在线设备API请求失败:', error);
    throw error;
  }
};

// 🔥 新增：一键开柜API调用
const openCabinetApi = async (cabinetCode: string, type: string = 'open'): Promise<OpenCabinetApiResponse> => {
  try {
    const requestData: OpenCabinetRequest = {
      cabinetCode,
      type
    };
    
    console.log('发送开柜请求:', requestData);
    
    const response = await fetch('/api/power/dtu/devices/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OpenCabinetApiResponse = await response.json();
    console.log('开柜API响应:', data);
    return data;
    
  } catch (error) {
    console.error('开柜API请求失败:', error);
    throw error;
  }
};
// 🔥 新增：检查单个设备状态API
const checkDeviceStatusApi = async (cabinetCode: string): Promise<DeviceStatusApiResponse> => {
  try {
    const response = await fetch(`/api/power/dtu/devices/status/${cabinetCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DeviceStatusApiResponse = await response.json();
    console.log(`设备 ${cabinetCode} 状态检查响应:`, data);
    return data;
    
  } catch (error) {
    console.error(`检查设备 ${cabinetCode} 状态失败:`, error);
    throw error;
  }
};

const updateDeviceOnlineStatus = async () => {
  try {
    console.log('开始更新设备在线状态...');
    
    // 获取在线设备列表
    const response = await getOnlineDevicesApi();
    
    if (response.code === 200) {
      const onlineDeviceCodes = response.data; // 在线设备编号列表
      console.log('在线设备列表:', onlineDeviceCodes);
      
      // 更新当前表格数据的在线状态
      tableData.value = tableData.value.map(device => {
        // 检查设备编号是否在在线列表中
        const isOnline = onlineDeviceCodes.includes(device.cabinetCode);
        
        return {
          ...device,
          onlineStatus: isOnline ? 1 : 0 // 1-在线, 0-离线
        };
      });
      
      console.log('设备在线状态更新完成');
      
      // 🔥 可选：显示更新结果统计
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

// 🔥 新增：检查单个设备状态
const handleCheckDeviceStatus = async (row: CabinetData) => {
  // 显示检查中的加载状态
  const loadingMessage = ElMessage({
    message: `正在检查设备 "${row.cabinetName}" 的在线状态...`,
    type: 'info',
    duration: 0 // 不自动关闭
  });
  
  try {
    // 调用状态检查API
    const result = await checkDeviceStatusApi(row.cabinetCode);
    
    // 关闭加载提示
    loadingMessage.close();
    
    if (result.code === 200) {
      const isOnline = result.data;
      const statusText = isOnline ? '在线' : '离线';
      const statusType = isOnline ? 'success' : 'warning';
      
      // 更新表格中该设备的状态
      const deviceIndex = tableData.value.findIndex(device => device.cabinetCode === row.cabinetCode);
      if (deviceIndex !== -1) {
        tableData.value[deviceIndex].onlineStatus = isOnline ? 1 : 0;
      }
      
      // 显示检查结果
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
    // 关闭加载提示
    loadingMessage.close();
    ElMessage.error('设备状态检查失败，请检查网络连接');
    console.error('设备状态检查API调用失败:', error);
  }
};

// 获取柜子列表
const getCabinetList = async () => {
  loading.value = true;
  try {
    const response = await getCabinetListApi({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      ...areaFilter.value,
      ...searchForm.value
    });
    
    if (response.code === 200) {
      // 🔥 修改：先设置数据，在线状态暂时设为null
      tableData.value = response.data.records.map(item => ({
        ...item,
        onlineStatus: null // 🔥 初始设为null，等待状态更新
      }));
      total.value = response.data.total;
      console.log('获取到的柜子数据:', tableData.value);
      
      // 🔥 新增：获取数据后立即更新在线状态
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

    // 🔥 使用工具类的权限验证
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

const initPermissionData = async () => {
  try {
    const userType = areaStore.getCurrentUserType;
    const areaType = areaStore.getCurrentAreaType;
    const areaCode = areaStore.getCurrentAreaCode;
    
    console.log('初始化权限数据:', { userType, areaType, areaCode });
    
    // 如果没有权限数据，尝试重新加载
    if (!areaStore.hasAreaData && areaType && areaCode) {
      console.log('权限数据为空，重新加载...');
      areaStore.loadAreaData(areaType, areaCode);
    }
    
    // 验证权限数据
    setTimeout(() => {
      if (areaStore.hasAreaData) {
        console.log('权限数据加载成功:', areaStore.getCurrentAreaData);
      } else {
        console.warn('权限数据加载失败');
        ElMessage.warning('无法加载权限数据，请刷新页面重试');
      }
    }, 100);
    
  } catch (error) {
    console.error('初始化权限数据失败:', error);
    ElMessage.error('初始化权限数据失败');
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
      //onlineStatus: 0, 
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
    
    // 🔥 新增：显示开柜中的加载状态
    const loadingMessage = ElMessage({
      message: '正在发送开柜命令...',
      type: 'info',
      duration: 0 // 不自动关闭
    });
    
    try {
      // 🔥 新增：调用开柜API
      const result = await openCabinetApi(row.cabinetCode, 'open');
      
      // 关闭加载提示
      loadingMessage.close();
      
      if (result.code === 200) {
        ElMessage.success(`设备 "${row.cabinetName}" 开柜命令发送成功！`);
        console.log('开柜成功:', result);
        
        // 🔥 可选：开柜成功后刷新在线状态
        setTimeout(() => {
          updateDeviceOnlineStatus();
        }, 2000); // 2秒后刷新状态
        
      } else {
        ElMessage.error(result.msg || '开柜命令发送失败');
        console.error('开柜失败:', result);
      }
      
    } catch (error) {
      // 关闭加载提示
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
onMounted(async () => {
  // 🔥 使用工具类初始化权限数据
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
                <!-- 🔥 新增：刷新在线状态按钮 -->
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
          // 🔥 新增：头部操作按钮样式
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