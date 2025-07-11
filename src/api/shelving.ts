// ==================== 类型定义 ====================

// 上架记录数据接口
export interface ShelfRecordData {
  id: number;
  cabinetId: number;
  cabinetCode: string;
  cabinetName: string;
  materialId: number;
  materialCode: string;
  materialName: string;
  shelfQuantity: number;
  operatorName: string;
  createTime: string;
  updatedTime: string;
}

// 上架记录查询参数接口
export interface ShelfRecordQueryParams {
  pageNum?: number;
  pageSize?: number;
  materialName?: string;
  cabinetName?: string;
  startTime?: string;
  endTime?: string;
  province?: string;
  city?: string;
  district?: string;
}

// 上架记录列表API响应接口
export interface ShelfRecordApiResponse {
  code: number;
  msg: string;
  data: {
    records: ShelfRecordData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

// 通用API响应接口
export interface BaseApiResponse {
  code: number;
  msg: string;
  data?: any;
}

// 导出参数接口
// export interface ExportParams {
//   startDate: string;
//   endDate: string;
// }

// ==================== API 方法 ====================

/**
 * 获取上架记录列表
 * @param params 查询参数
 * @returns 上架记录列表响应数据
 */
export const getShelfRecordsList = async (params: ShelfRecordQueryParams = {}): Promise<ShelfRecordApiResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // 添加搜索参数
    if (params.materialName) queryParams.append('materialName', params.materialName);
    if (params.cabinetName) queryParams.append('cabinetName', params.cabinetName);
    if (params.startTime) queryParams.append('startTime', params.startTime);
    if (params.endTime) queryParams.append('endTime', params.endTime);
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    
    // 构建完整的URL
    const baseUrl = `/api/power/shelf-records/page`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('上架记录API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ShelfRecordApiResponse = await response.json();
    return data;
    
  } catch (error) {
    console.error('获取上架记录列表API请求失败:', error);
    throw error;
  }
};


// 工具函数

/**
 * 计算上架时长（从上架到现在）
 * @param createTime 上架时间
 * @returns 时长描述
 */
export const calculateShelfDuration = (createTime: string): string => {
  const shelved = new Date(createTime);
  const now = new Date();
  const diffMs = now.getTime() - shelved.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}天${diffHours}小时`;
  } else {
    return `${diffHours}小时`;
  }
};

/**
 * 格式化日期时间
 * @param dateTime 日期时间字符串
 * @returns 格式化后的日期时间
 */
export const formatDateTime = (dateTime: string): string => {
  return new Date(dateTime).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// /**
//  * 根据上架时长判断状态
//  * @param createTime 上架时间
//  * @returns 状态类型和文本
//  */
// export const getShelfStatus = (createTime: string): { type: 'success' | 'info' | 'warning' | 'danger' | 'primary', text: string } => {
//   const shelved = new Date(createTime);
//   const now = new Date();
//   const diffDays = Math.floor((now.getTime() - shelved.getTime()) / (1000 * 60 * 60 * 24));
  
//   if (diffDays <= 7) {
//     return { type: 'success', text: '新上架' };
//   } else if (diffDays <= 30) {
//     return { type: 'primary', text: '正常' };
//   } else {
//     return { type: 'warning', text: '长期' };
//   }
// };

// /**
//  * 验证导出参数
//  * @param params 导出参数
//  * @returns 验证结果
//  */
// export const validateExportParams = (params: ExportParams): { valid: boolean; message?: string } => {
//   if (!params.startDate || !params.endDate) {
//     return { valid: false, message: '请选择导出日期范围' };
//   }
  
//   const startDate = new Date(params.startDate);
//   const endDate = new Date(params.endDate);
  
//   if (startDate > endDate) {
//     return { valid: false, message: '开始日期不能大于结束日期' };
//   }
  
//   // 验证日期范围不超过365天
//   const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
//   if (diffDays > 365) {
//     return { valid: false, message: '导出日期范围不能超过365天' };
//   }
  
//   return { valid: true };
// };

// /**
//  * 获取默认导出日期范围（最近30天）
//  * @returns 默认日期范围
//  */
// export const getDefaultExportDateRange = (): ExportParams => {
//   const today = new Date();
//   const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
//   return {
//     startDate: thirtyDaysAgo.toISOString().split('T')[0],
//     endDate: today.toISOString().split('T')[0]
//   };
// };

// ==================== 默认导出 ====================

export default {
  getShelfRecordsList,
  calculateShelfDuration,
  formatDateTime,
  // getShelfStatus,
  //validateExportParams,
  //getDefaultExportDateRange
};