// ==================== 类型定义 ====================

// 柜子数据接口
export interface CabinetData {
  id: number;
  cabinetCode: string;
  cabinetName: string;
  province: string;
  city: string;
  district: string;
  address: string;
  onlineStatus?: number | null;
  // 🔥 新增：温湿度相关字段
  maxTemperature?: number | null;
  minTemperature?: number | null;
  maxHumidity?: number | null;
  minHumidity?: number | null;
  operationMode?: number;
  maxTemperatureDifference?: number | null;
  createTime?: string;
  updatedTime?: string;
}

// 柜子列表API响应接口
export interface CabinetApiResponse {
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

// 柜子查询参数接口
export interface CabinetQueryParams {
  pageNum?: number;
  pageSize?: number;
  cabinetCode?: string;
  cabinetName?: string;
  province?: string;
  city?: string;
  district?: string;
}

// 柜子新增/编辑数据接口
export interface CabinetFormData {
  id?: number;
  cabinetCode: string;
  cabinetName: string;
  province: string;
  city: string;
  district: string;
  address: string;
  createTime?: string;
  updatedTime?: string;
}

// 在线状态API响应接口
export interface OnlineStatusApiResponse {
  code: number;
  msg: string;
  data: string[];
}

// 开柜请求接口
export interface OpenCabinetRequest {
  cabinetCode: string;
  type: string;
}

// 开柜响应接口
export interface OpenCabinetApiResponse {
  code: number;
  msg: string;
  data?: any;
}

// 设备状态检查响应接口
export interface DeviceStatusApiResponse {
  code: number;
  msg: string;
  data: boolean;
}

// 通用API响应接口
export interface BaseApiResponse {
  code: number;
  msg: string;
  data?: any;
}

// ==================== API 方法 ====================

/**
 * 获取柜子列表
 * @param params 查询参数
 * @returns 柜子列表响应数据
 */
export const getCabinetList = async (params: CabinetQueryParams = {}): Promise<CabinetApiResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // 添加搜索参数
    if (params.cabinetCode) queryParams.append('cabinetCode', params.cabinetCode);
    if (params.cabinetName) queryParams.append('cabinetName', params.cabinetName);
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    
    // 构建完整的URL
    const baseUrl = `/api/power/cabinet/page`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('柜子列表API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: CabinetApiResponse = await response.json();
    return data;
    
  } catch (error) {
    console.error('获取柜子列表API请求失败:', error);
    throw error;
  }
};

/**
 * 新增柜子
 * @param data 柜子数据
 * @returns API响应结果
 */
export const addCabinet = async (data: CabinetFormData): Promise<BaseApiResponse> => {
  try {
    const requestData = {
      ...data,
      createTime: new Date().toISOString(),
      updatedTime: new Date().toISOString()
    };
    
    console.log('新增柜子API请求数据:', requestData);

    const response = await fetch('/api/power/cabinet/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('新增柜子API响应:', result);
    return result;
    
  } catch (error) {
    console.error('新增柜子API请求失败:', error);
    throw error;
  }
};

/**
 * 更新柜子
 * @param data 柜子数据
 * @returns API响应结果
 */
export const updateCabinet = async (data: CabinetFormData): Promise<BaseApiResponse> => {
  try {
    const requestData = {
      ...data,
      updatedTime: new Date().toISOString()
    };
    
    console.log('更新柜子API请求数据:', requestData);

    const response = await fetch('/api/power/cabinet/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('更新柜子API响应:', result);
    return result;
    
  } catch (error) {
    console.error('更新柜子API请求失败:', error);
    throw error;
  }
};

/**
 * 删除柜子
 * @param id 柜子ID
 * @returns API响应结果
 */
export const deleteCabinet = async (id: number): Promise<BaseApiResponse> => {
  try {
    const response = await fetch(`/api/power/cabinet/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('删除柜子API响应:', result);
    return result;
    
  } catch (error) {
    console.error('删除柜子API请求失败:', error);
    throw error;
  }
};

/**
 * 获取在线设备列表
 * @returns 在线设备列表
 */
export const getOnlineDevices = async (): Promise<OnlineStatusApiResponse> => {
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

/**
 * 一键开柜
 * @param cabinetCode 柜子编号
 * @param type 操作类型，默认为 'open'
 * @returns API响应结果
 */
export const openCabinet = async (cabinetCode: string, type: string = 'open'): Promise<OpenCabinetApiResponse> => {
  try {
    const requestData: OpenCabinetRequest = {
      cabinetCode,
      type
    };
    
    console.log('开柜API请求数据:', requestData);
    
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

/**
 * 检查单个设备状态
 * @param cabinetCode 柜子编号
 * @returns 设备状态响应
 */
export const checkDeviceStatus = async (cabinetCode: string): Promise<DeviceStatusApiResponse> => {
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
    console.log(`设备 ${cabinetCode} 状态检查API响应:`, data);
    return data;
    
  } catch (error) {
    console.error(`检查设备 ${cabinetCode} 状态API请求失败:`, error);
    throw error;
  }
};

// ==================== 默认导出 ====================

export default {
  getCabinetList,
  addCabinet,
  updateCabinet,
  deleteCabinet,
  getOnlineDevices,
  openCabinet,
  checkDeviceStatus
};