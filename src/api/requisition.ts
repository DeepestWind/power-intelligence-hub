// ==================== 类型定义 ====================

// 领用记录数据接口
export interface BorrowRecordData {
  id: number;
  cabinetId: number;
  cabinetCode: string;
  cabinetName: string;
  materialId: number;
  materialCode: string;
  materialName: string;
  usageQuantity: number;
  borrowName: string;
  createTime: string;
  updatedTime: string;
}

// 领用记录查询参数接口
export interface BorrowRecordQueryParams {
  pageNum?: number;
  pageSize?: number;
  cabinetCode?: string;
  cabinetName?: string;
  materialCode?: string;
  materialName?: string;
  borrowName?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
  usageQuantityMin?: number | null;
  usageQuantityMax?: number | null;
  province?: string;
  city?: string;
  district?: string;
}

// 领用记录列表API响应接口
export interface BorrowRecordApiResponse {
  code: number;
  msg: string;
  data: {
    records: BorrowRecordData[];
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
 * 获取领用记录列表
 * @param params 查询参数
 * @returns 领用记录列表响应数据
 */
export const getBorrowRecordsList = async (params: BorrowRecordQueryParams = {}): Promise<BorrowRecordApiResponse> => {
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
    // if (params.province) queryParams.append('province', params.province);
    // if (params.city) queryParams.append('city', params.city);
    // if (params.district) queryParams.append('district', params.district);
    // if (params.createTimeStart) queryParams.append('createTimeStart', params.createTimeStart);
    // if (params.createTimeEnd) queryParams.append('createTimeEnd', params.createTimeEnd);
    // if (params.usageQuantityMin) queryParams.append('usageQuantityMin', params.usageQuantityMin.toString());
    // if (params.usageQuantityMax) queryParams.append('usageQuantityMax', params.usageQuantityMax.toString());
    
    // 构建完整的URL
    const baseUrl = `/api/power/borrowed-records/borrowRecords`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('领用记录列表API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: BorrowRecordApiResponse = await response.json();
    return data;
    
  } catch (error) {
    console.error('获取领用记录列表API请求失败:', error);
    throw error;
  }
};

/**
 * 导出领用记录
 * @param params 导出参数
 * @returns 下载文件的Promise
 */
export const exportBorrowRecords = async (params: ExportParams): Promise<void> => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('startDate', params.startDate);
    queryParams.append('endDate', params.endDate);
    
    // 构建完整的URL
    const url = `/api/power/borrowed-records/download/borrowed?${queryParams.toString()}`;
    
    console.log('导出领用记录API请求URL:', url);
    
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
    let fileName = '领用记录.xlsx'; // 默认文件名
    
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
    console.error('导出领用记录API请求失败:', error);
    throw error;
  }
};

// ==================== 工具函数 ====================

/**
 * 计算领用时长（从领用到现在）
 * @param createTime 领用时间
 * @returns 时长描述
 */
export const calculateBorrowDuration = (createTime: string): string => {
  const borrowed = new Date(createTime);
  const now = new Date();
  const diffMs = now.getTime() - borrowed.getTime();
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

/**
 * 根据领用时长判断状态
 * @param createTime 领用时间
 * @returns 状态类型和文本
 */
export const getBorrowStatus = (createTime: string): { type: 'success' | 'info' | 'warning' | 'danger' | 'primary', text: string } => {
  const borrowed = new Date(createTime);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - borrowed.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) {
    return { type: 'success', text: '正常' };
  } else if (diffDays <= 7) {
    return { type: 'warning', text: '提醒' };
  } else {
    return { type: 'danger', text: '超期' };
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
 * 获取领用数量标签类型
 * @param quantity 领用数量
 * @returns 标签类型
 */
export const getQuantityTagType = (quantity: number): 'primary' | 'success' | 'warning' | 'danger' => {
  if (quantity <= 1) return 'primary';
  if (quantity <= 5) return 'success';
  if (quantity <= 10) return 'warning';
  return 'danger';
};

// ==================== 默认导出 ====================

export default {
  getBorrowRecordsList,
  exportBorrowRecords,
  calculateBorrowDuration,
  formatDateTime,
  getBorrowStatus,
  validateExportParams,
  getDefaultExportDateRange,
  getQuantityTagType
};