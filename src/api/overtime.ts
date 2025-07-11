// ==================== 类型定义 ====================

// 超时记录数据接口
export interface OvertimeRecordData {
  id: number;
  cabinetId: number;
  cabinetCode: string;
  cabinetName: string;
  materialId: number;
  materialCode: string;
  materialName: string;
  materialStatus: number;
  lentOutTime: string;
  plannedReturnTime: string;
  actualReturnTime: string | null;
  operatorName: string;
  createTime: string;
  updatedTime: string;
}

// 超时记录查询参数接口
export interface OvertimeRecordQueryParams {
  pageNum?: number;
  pageSize?: number;
  cabinetCode?: string;
  cabinetName?: string;
  materialCode?: string;
  materialName?: string;
  operatorName?: string;
  materialStatus?: number;
  lentOutTimeStart?: string;
  lentOutTimeEnd?: string;
  plannedReturnTimeStart?: string;
  plannedReturnTimeEnd?: string;
  actualReturnTimeStart?: string;
  actualReturnTimeEnd?: string;
  province?: string;
  city?: string;
  district?: string;
}

// 超时记录列表API响应接口
export interface OvertimeRecordApiResponse {
  code: number;
  msg: string;
  data: {
    records: OvertimeRecordData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

// 导出参数接口
export interface ExportParams {
  startDate: string;
  endDate: string;
}

// 通用API响应接口
export interface BaseApiResponse {
  code: number;
  msg: string;
  data?: any;
}

// ==================== API 方法 ====================

/**
 * 获取超时记录列表
 * @param params 查询参数
 * @returns 超时记录列表响应数据
 */
export const getOvertimeRecordsList = async (params: OvertimeRecordQueryParams = {}): Promise<OvertimeRecordApiResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // 添加搜索参数（暂时注释，因为后端未设置）
    // if (params.cabinetCode) queryParams.append('cabinetCode', params.cabinetCode);
    // if (params.cabinetName) queryParams.append('cabinetName', params.cabinetName);
    // if (params.materialCode) queryParams.append('materialCode', params.materialCode);
    // if (params.materialName) queryParams.append('materialName', params.materialName);
    // if (params.operatorName) queryParams.append('operatorName', params.operatorName);
    // if (params.materialStatus !== undefined) queryParams.append('materialStatus', params.materialStatus.toString());
    // if (params.province) queryParams.append('province', params.province);
    // if (params.city) queryParams.append('city', params.city);
    // if (params.district) queryParams.append('district', params.district);
    // if (params.lentOutTimeStart) queryParams.append('lentOutTimeStart', params.lentOutTimeStart);
    // if (params.lentOutTimeEnd) queryParams.append('lentOutTimeEnd', params.lentOutTimeEnd);
    // if (params.plannedReturnTimeStart) queryParams.append('plannedReturnTimeStart', params.plannedReturnTimeStart);
    // if (params.plannedReturnTimeEnd) queryParams.append('plannedReturnTimeEnd', params.plannedReturnTimeEnd);
    // if (params.actualReturnTimeStart) queryParams.append('actualReturnTimeStart', params.actualReturnTimeStart);
    // if (params.actualReturnTimeEnd) queryParams.append('actualReturnTimeEnd', params.actualReturnTimeEnd);
    
    // 构建完整的URL
    const baseUrl = `/api/power/material-status/overdueRecords`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('超时记录列表API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: OvertimeRecordApiResponse = await response.json();
    return data;
    
  } catch (error) {
    console.error('获取超时记录列表API请求失败:', error);
    throw error;
  }
};

/**
 * 导出超时记录
 * @param params 导出参数
 * @returns 下载文件的Promise
 */
export const exportOvertimeRecords = async (params: ExportParams): Promise<void> => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('startDate', params.startDate);
    queryParams.append('endDate', params.endDate);
    
    // 构建完整的URL
    const url = `/api/power/material-status/download/overdue?${queryParams.toString()}`;
    
    console.log('导出超时记录API请求URL:', url);
    
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
    
    // 获取文件名
    const contentDisposition = response.headers.get('Content-Disposition');
    let fileName = '超时记录.xlsx'; // 默认文件名
    
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1].replace(/['"]/g, '');
      }
    }
    
    // 如果文件名没有扩展名，添加.xlsx
    if (!fileName.includes('.')) {
      fileName += '.xlsx';
    }
    
    // 获取文件blob
    const blob = await response.blob();
    
    // 创建下载链接
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
    console.log('文件下载成功:', fileName);
    
  } catch (error) {
    console.error('导出超时记录API请求失败:', error);
    throw error;
  }
};

// ==================== 工具函数 ====================

/**
 * 计算超时时长
 * @param plannedReturnTime 计划归还时间
 * @param actualReturnTime 实际归还时间
 * @returns 时长描述
 */
export const calculateOvertimeDuration = (plannedReturnTime: string, actualReturnTime: string | null): string => {
  const planned = new Date(plannedReturnTime);
  const actual = actualReturnTime ? new Date(actualReturnTime) : new Date();
  
  if (actual <= planned) {
    return '未超时';
  }
  
  const diffMs = actual.getTime() - planned.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}天${diffHours}小时`;
  } else if (diffHours > 0) {
    return `${diffHours}小时${diffMinutes}分钟`;
  } else {
    return `${diffMinutes}分钟`;
  }
};

// /**
//  * 获取超时严重程度
//  * @param plannedReturnTime 计划归还时间
//  * @param actualReturnTime 实际归还时间
//  * @returns 状态类型和文本
//  */
// export const getOvertimeSeverity = (plannedReturnTime: string, actualReturnTime: string | null): { type: 'success' | 'warning' | 'danger', text: string } => {
//   const planned = new Date(plannedReturnTime);
//   const actual = actualReturnTime ? new Date(actualReturnTime) : new Date();
  
//   if (actual <= planned) {
//     return { type: 'success', text: '未超时' };
//   }
  
//   const diffHours = (actual.getTime() - planned.getTime()) / (1000 * 60 * 60);
  
//   if (diffHours <= 2) {
//     return { type: 'warning', text: '轻微超时' };
//   } else if (diffHours <= 24) {
//     return { type: 'danger', text: '严重超时' };
//   } else {
//     return { type: 'danger', text: '极度超时' };
//   }
// };

/**
 * 格式化物料状态
 * @param status 物料状态
 * @returns 状态标签配置
 */
export const formatMaterialStatus = (status: number): { label: string; type: 'success' | 'warning' | 'danger' | 'info' } => {
  const statusMap = {
    0: { label: '借出', type: 'warning' as const },
    1: { label: '归还', type: 'success' as const },
    2: { label: '丢失', type: 'danger' as const },
    3: { label: '损坏', type: 'danger' as const }
  };
  
  return statusMap[status] || { label: '未知', type: 'info' as const };
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

/**
 * 验证导出参数
 * @param params 导出参数
 * @returns 验证结果
 */
export const validateExportParams = (params: ExportParams): { valid: boolean; message?: string } => {
  if (!params.startDate || !params.endDate) {
    return { valid: false, message: '请选择导出日期范围' };
  }
  
  const startDate = new Date(params.startDate);
  const endDate = new Date(params.endDate);
  
  if (startDate > endDate) {
    return { valid: false, message: '开始日期不能大于结束日期' };
  }
  
  // 验证日期范围不超过365天
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 365) {
    return { valid: false, message: '导出日期范围不能超过365天' };
  }
  
  return { valid: true };
};

/**
 * 获取默认导出日期范围（最近30天）
 * @returns 默认日期范围
 */
export const getDefaultExportDateRange = (): ExportParams => {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  return {
    startDate: thirtyDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  };
};

/**
 * 检查是否超时
 * @param plannedReturnTime 计划归还时间
 * @param actualReturnTime 实际归还时间
 * @returns 是否超时
 */
export const isOvertime = (plannedReturnTime: string, actualReturnTime: string | null): boolean => {
  const planned = new Date(plannedReturnTime);
  const actual = actualReturnTime ? new Date(actualReturnTime) : new Date();
  return actual > planned;
};

/**
 * 获取超时天数
 * @param plannedReturnTime 计划归还时间
 * @param actualReturnTime 实际归还时间
 * @returns 超时天数
 */
export const getOvertimeDays = (plannedReturnTime: string, actualReturnTime: string | null): number => {
  const planned = new Date(plannedReturnTime);
  const actual = actualReturnTime ? new Date(actualReturnTime) : new Date();
  
  if (actual <= planned) {
    return 0;
  }
  
  return Math.floor((actual.getTime() - planned.getTime()) / (1000 * 60 * 60 * 24));
};

// ==================== 默认导出 ====================

export default {
  getOvertimeRecordsList,
  exportOvertimeRecords,
  calculateOvertimeDuration,
  // getOvertimeSeverity,
  formatMaterialStatus,
  formatDateTime,
  validateExportParams,
  getDefaultExportDateRange,
  isOvertime,
  getOvertimeDays
};