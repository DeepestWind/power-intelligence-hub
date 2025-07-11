// 从柜子API中导入复用的类型和方法
import { 
  getCabinetList as getCabinetListApi,
  updateCabinet as updateCabinetApi,
  type CabinetData,
  type CabinetQueryParams
} from './cabinet';

// ==================== 类型定义 ====================

// 温湿度设备数据接口（扩展柜子数据）
export interface HumitureData extends CabinetData {
  maxTemperature: number | null;
  minTemperature: number | null;
  maxHumidity: number | null;
  minHumidity: number | null;
  //operationMode: number; // 0-自动模式, 1-手动模式
  maxTemperatureDifference: number | null;
}

// 温湿度设备列表API响应接口
export interface HumitureApiResponse {
  code: number;
  msg: string;
  data: {
    records: HumitureData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

// 温湿度设备查询参数接口（扩展柜子查询参数）
export interface HumitureQueryParams extends CabinetQueryParams {
  //operationMode?: number | string;
  //onlineStatus?: number | string;
}

// 温湿度设置表单数据接口
export interface HumitureFormData {
  id: number;
  maxTemperature: number | null;
  minTemperature: number | null;
  maxHumidity: number | null;
  minHumidity: number | null;
  //operationMode: number;
  maxTemperatureDifference: number | null;
  updatedTime?: string;
}

// 通用API响应接口
export interface BaseApiResponse {
  code: number;
  msg: string;
  data?: any;
}

// ==================== API 方法 ====================

/**
 * 获取温湿度设备列表
 * @param params 查询参数
 * @returns 温湿度设备列表响应数据
 */
export const getHumitureList = async (params: HumitureQueryParams = {}): Promise<HumitureApiResponse> => {
  try {
    // 复用柜子API，传递相同的查询参数
    const response = await getCabinetListApi(params);
    
    // 将柜子数据转换为温湿度设备数据格式
    const humitureResponse: HumitureApiResponse = {
      code: response.code,
      msg: response.msg,
      data: {
        records: response.data.records.map(item => ({
          ...item,
          // 修复：使用 ?? 空值合并运算符而不是 || 逻辑或运算符
          maxTemperature: item.maxTemperature ?? null,
          minTemperature: item.minTemperature ?? null,
          maxHumidity: item.maxHumidity ?? null,
          minHumidity: item.minHumidity ?? null,
          //operationMode: item.operationMode ?? 0,
          maxTemperatureDifference: item.maxTemperatureDifference ?? null
        } as HumitureData)),
        total: response.data.total,
        current: response.data.current,
        size: response.data.size,
        pages: response.data.pages
      }
    };
    
    console.log('温湿度设备列表API响应:', humitureResponse);
    return humitureResponse;
    
  } catch (error) {
    console.error('获取温湿度设备列表API请求失败:', error);
    throw error;
  }
};

/**
 * 更新温湿度设置
 * @param data 温湿度设置数据
 * @returns API响应结果
 */
export const updateHumiture = async (data: HumitureFormData): Promise<BaseApiResponse> => {
  try {
    const requestData = {
      id: data.id,
      maxTemperature: data.maxTemperature,
      minTemperature: data.minTemperature,
      maxHumidity: data.maxHumidity,
      minHumidity: data.minHumidity,
      //operationMode: data.operationMode,
      maxTemperatureDifference: data.maxTemperatureDifference,
      updatedTime: new Date().toISOString()
    };
    
    console.log('更新温湿度设置API请求数据:', requestData);

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
    console.log('更新温湿度设置API响应:', result);
    return result;
    
  } catch (error) {
    console.error('更新温湿度设置API请求失败:', error);
    throw error;
  }
};

// ==================== 常量定义 ====================

// // 运行模式选项
// export const OPERATION_MODE_OPTIONS = [
//   { label: '自动模式', value: 0 },
//   { label: '手动模式', value: 1 }
// ];

// // 在线状态选项
// export const ONLINE_STATUS_OPTIONS = [
//   { label: '在线', value: 1 },
//   { label: '离线', value: 0 },
//   { label: '未知', value: null }
// ];

// ==================== 工具函数 ====================

// /**
//  * 格式化运行模式
//  * @param mode 运行模式值
//  * @returns 运行模式标签
//  */
// export const formatOperationMode = (mode: number): string => {
//   const option = OPERATION_MODE_OPTIONS.find(opt => opt.value === mode);
//   return option ? option.label : '未知';
// };

/**
 * 验证温湿度设置参数
 * @param data 温湿度设置数据
 * @returns 验证结果
 */
export const validateHumitureData = (data: HumitureFormData): { valid: boolean; message?: string } => {
  // 验证温度范围
  if (data.minTemperature !== null && data.maxTemperature !== null) {
    if (data.minTemperature >= data.maxTemperature) {
      return { valid: false, message: '最低温度不能大于或等于最高温度' };
    }
  }
  
  // 验证湿度范围
  if (data.minHumidity !== null && data.maxHumidity !== null) {
    if (data.minHumidity >= data.maxHumidity) {
      return { valid: false, message: '最低湿度不能大于或等于最高湿度' };
    }
  }
  
  // 验证温度值范围
  if (data.minTemperature !== null && (data.minTemperature < -50 || data.minTemperature > 100)) {
    return { valid: false, message: '最低温度范围应在-50°C到100°C之间' };
  }
  
  if (data.maxTemperature !== null && (data.maxTemperature < -50 || data.maxTemperature > 100)) {
    return { valid: false, message: '最高温度范围应在-50°C到100°C之间' };
  }
  
  // 验证湿度值范围
  if (data.minHumidity !== null && (data.minHumidity < 0 || data.minHumidity > 100)) {
    return { valid: false, message: '最低湿度范围应在0%到100%之间' };
  }
  
  if (data.maxHumidity !== null && (data.maxHumidity < 0 || data.maxHumidity > 100)) {
    return { valid: false, message: '最高湿度范围应在0%到100%之间' };
  }
  
  // 验证温差值范围
  if (data.maxTemperatureDifference !== null && (data.maxTemperatureDifference < 0 || data.maxTemperatureDifference > 50)) {
    return { valid: false, message: '最大温差范围应在0°C到50°C之间' };
  }
  
  return { valid: true };
};

// ==================== 默认导出 ====================

export default {
  getHumitureList,
  updateHumiture,
  //formatOperationMode,
  validateHumitureData,
  //OPERATION_MODE_OPTIONS,
  //ONLINE_STATUS_OPTIONS
};