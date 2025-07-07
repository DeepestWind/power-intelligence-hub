// ==================== 类型定义 ====================

// 归还记录数据接口
export interface ReturnRecordData {
  id: number;
  cabinetId: number;
  cabinetCode: string;
  cabinetName: string;
  materialId: number;
  materialCode: string;
  materialName: string;
  usageQuantity: number;
  returnQuantity: number;
  lentOutTime: string;
  actualReturnTime: string;
  borrowName: string;
  returnName: string;
  createTime: string;
  updatedTime: string;
}

// 归还记录查询参数接口
export interface ReturnRecordQueryParams {
  pageNum?: number;
  pageSize?: number;
  cabinetCode?: string;
  cabinetName?: string;
  materialCode?: string;
  materialName?: string;
  borrowName?: string;
  returnName?: string;
  lentOutTimeStart?: string;
  lentOutTimeEnd?: string;
  actualReturnTimeStart?: string;
  actualReturnTimeEnd?: string;
  province?: string;
  city?: string;
  district?: string;
}

// 归还记录列表API响应接口
export interface ReturnRecordApiResponse {
  code: number;
  msg: string;
  data: {
    records: ReturnRecordData[];
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
 * 获取归还记录列表
 * @param params 查询参数
 * @returns 归还记录列表响应数据
 */
export const getReturnRecordsList = async (params: ReturnRecordQueryParams = {}): Promise<ReturnRecordApiResponse> => {
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
    // if (params.borrowName) queryParams.append('borrowName', params.borrowName);
    // if (params.returnName) queryParams.append('returnName', params.returnName);
    // if (params.province) queryParams.append('province', params.province);
    // if (params.city) queryParams.append('city', params.city);
    // if (params.district) queryParams.append('district', params.district);
    // if (params.lentOutTimeStart) queryParams.append('lentOutTimeStart', params.lentOutTimeStart);
    // if (params.lentOutTimeEnd) queryParams.append('lentOutTimeEnd', params.lentOutTimeEnd);
    // if (params.actualReturnTimeStart) queryParams.append('actualReturnTimeStart', params.actualReturnTimeStart);
    // if (params.actualReturnTimeEnd) queryParams.append('actualReturnTimeEnd', params.actualReturnTimeEnd);
    
    // 构建完整的URL
    const baseUrl = `/api/power/returned-records/returnRecords`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('归还记录列表API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: ReturnRecordApiResponse = await response.json();
    return data;
    
  } catch (error) {
    console.error('获取归还记录列表API请求失败:', error);
    throw error;
  }
};

/**
 * 导出归还记录
 * @param params 导出参数
 * @returns 下载文件的Promise
 */
export const exportReturnRecords = async (params: ExportParams): Promise<void> => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('startDate', params.startDate);
    queryParams.append('endDate', params.endDate);
    
    // 构建完整的URL
    const url = `/api/power/returned-records/download/returned?${queryParams.toString()}`;
    
    console.log('导出归还记录API请求URL:', url);
    
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
    let fileName = '归还记录.xlsx'; // 默认文件名
    
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
    console.error('导出归还记录API请求失败:', error);
    throw error;
  }
};

// 🔥 新增：导出领用归还总表
/**
 * 导出领用归还总表
 * @param params 导出参数
 * @returns 下载文件的Promise
 */
export const exportBorrowReturnSummary = async (params: ExportParams): Promise<void> => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('startDate', params.startDate);
    queryParams.append('endDate', params.endDate);
    
    // 构建完整的URL
    const url = `/api/power/returned-records/download/summary?${queryParams.toString()}`;
    
    console.log('导出领用归还总表API请求URL:', url);
    
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
    let fileName = '领用归还总表.xlsx'; // 默认文件名
    
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
    
    console.log('领用归还总表下载成功:', fileName);
    
  } catch (error) {
    console.error('导出领用归还总表API请求失败:', error);
    throw error;
  }
};


// ==================== 工具函数 ====================

/**
 * 计算借用时长
 * @param lentOutTime 借出时间
 * @param actualReturnTime 实际归还时间
 * @returns 时长描述
 */
export const calculateUsageDuration = (lentOutTime: string, actualReturnTime: string): string => {
  const lentOut = new Date(lentOutTime);
  const returned = new Date(actualReturnTime);
  const diffMs = returned.getTime() - lentOut.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (diffDays > 0) {
    return `${diffDays}天${diffHours}小时`;
  } else {
    return `${diffHours}小时`;
  }
};

/**
 * 检查是否完全归还
 * @param usageQuantity 借用数量
 * @param returnQuantity 归还数量
 * @returns 是否完全归还
 */
export const isFullyReturned = (usageQuantity: number, returnQuantity: number): boolean => {
  return usageQuantity === returnQuantity;
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
 * 获取归还状态信息
 * @param usageQuantity 借用数量
 * @param returnQuantity 归还数量
 * @returns 状态类型和文本
 */
export const getReturnStatus = (usageQuantity: number, returnQuantity: number): { type: 'success' | 'warning' | 'danger', text: string } => {
  if (usageQuantity === returnQuantity) {
    return { type: 'success', text: '完全归还' };
  } else if (returnQuantity > 0) {
    return { type: 'warning', text: '部分归还' };
  } else {
    return { type: 'danger', text: '未归还' };
  }
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
 * 获取数量差异信息
 * @param usageQuantity 借用数量
 * @param returnQuantity 归还数量
 * @returns 数量差异描述
 */
export const getQuantityDifference = (usageQuantity: number, returnQuantity: number): string => {
  const diff = usageQuantity - returnQuantity;
  if (diff === 0) {
    return '无差异';
  } else if (diff > 0) {
    return `缺少${diff}个`;
  } else {
    return `多出${Math.abs(diff)}个`;
  }
};

// ==================== 默认导出 ====================

export default {
  getReturnRecordsList,
  exportReturnRecords,
  exportBorrowReturnSummary, // 🔥 新增：导出领用归还总表
  calculateUsageDuration,
  isFullyReturned,
  formatDateTime,
  getReturnStatus,
  validateExportParams,
  getDefaultExportDateRange,
  getQuantityDifference
};