// 导入通用类型（如果之前已创建）
// import { BaseApiResponse, ListApiResponse, BaseQueryParams, TimestampFields } from './types';

// ==================== 类型定义 ====================

// 下架记录数据接口
export interface OffshelvingData {
  id: number;
  userId: number;
  cabinetId: number;
  materialId: number;
  cabinetCode: string;
  cabinetName: string;
  materialCode: string;
  materialName: string;
  operatorName: string;
  province: string;
  city: string | null;
  district: string | null;
  address: string | null;
  shelfOutTime: string;
  createTime: string;
  updatedTime: string;
  remark: string;
  reason?: string; // 下架原因（备注的别名）
}

// 下架记录查询参数接口
export interface OffshelvingQueryParams {
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

// 下架记录列表API响应接口
export interface OffshelvingApiResponse {
  code: number;
  msg: string;
  data: {
    records: OffshelvingData[];
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

// ==================== API 方法 ====================

/**
 * 获取下架记录列表
 * @param params 查询参数
 * @returns 下架记录列表响应数据
 */
export const getOffshelvingList = async (params: OffshelvingQueryParams = {}): Promise<OffshelvingApiResponse> => {
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
    const baseUrl = `/api/power/shelf-out-records/page`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('下架记录列表API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: OffshelvingApiResponse = await response.json();
    
    // 数据处理：为每个记录添加 reason 字段（备注的别名）
    if (data.data && data.data.records) {
      data.data.records = data.data.records.map(record => ({
        ...record,
        reason: record.remark // 将 remark 映射为 reason
      }));
    }
    
    return data;
    
  } catch (error) {
    console.error('获取下架记录列表API请求失败:', error);
    throw error;
  }
};


// ==================== 工具函数 ====================

/**
 * 计算下架时长（从下架到现在）
 * @param createTime 下架时间
 * @returns 时长描述
 */
export const calculateOffshelfDuration = (createTime: string): string => {
  const offshelved = new Date(createTime);
  const now = new Date();
  const diffMs = now.getTime() - offshelved.getTime();
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
 * 根据下架原因判断类型
 * @param remark 下架原因
 * @returns 类型和文本
 */
export const getReasonType = (remark: string): { type: 'success' | 'info' | 'warning' | 'danger' | 'primary', text: string } => {
  if (!remark) return { type: 'info', text: '无备注' };
  
  if (remark.includes('维修') || remark.includes('损坏') || remark.includes('破损')) {
    return { type: 'danger', text: remark };
  } else if (remark.includes('过期') || remark.includes('失效') || remark.includes('老化')) {
    return { type: 'warning', text: remark };
  } else if (remark.includes('调拨') || remark.includes('转移') || remark.includes('调整')) {
    return { type: 'primary', text: remark };
  } else {
    return { type: 'info', text: remark };
  }
};


// ==================== 默认导出 ====================

export default {
  getOffshelvingList,
  calculateOffshelfDuration,
  formatDateTime,
  getReasonType,
};