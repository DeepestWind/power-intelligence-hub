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

// 🔥 新增：导出参数接口
export interface ExportParams {
  startDate: string;
  endDate: string;
}

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

/**
 * 导出上架记录
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 文件下载
 */
export const exportShelfRecords = async (startDate: string, endDate: string): Promise<void> => {
  try {
    // 构建查询参数
    const queryParams = new URLSearchParams();
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
    
    // 构建完整的URL
    const url = `/api/power/shelf-records/download/shelf?${queryParams.toString()}`;
    
    console.log('导出上架记录API请求URL:', url);
    
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
    let fileName = '上架记录.xlsx'; // 默认文件名
    
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
    console.error('导出上架记录API请求失败:', error);
    throw error;
  }
};

// 🔥 新增：工具函数

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

/**
 * 根据上架时长判断状态
 * @param createTime 上架时间
 * @returns 状态类型和文本
 */
export const getShelfStatus = (createTime: string): { type: 'success' | 'info' | 'warning' | 'danger' | 'primary', text: string } => {
  const shelved = new Date(createTime);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - shelved.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) {
    return { type: 'success', text: '新上架' };
  } else if (diffDays <= 30) {
    return { type: 'primary', text: '正常' };
  } else {
    return { type: 'warning', text: '长期' };
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

// ==================== 默认导出 ====================

export default {
  getShelfRecordsList,
  exportShelfRecords,
  calculateShelfDuration,
  formatDateTime,
  getShelfStatus,
  validateExportParams,
  getDefaultExportDateRange
};