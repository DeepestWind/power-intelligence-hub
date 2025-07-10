// ==================== 类型定义 ====================

// 维修记录数据接口
export interface MaintainRecordData {
  id: number;
  userId: number;
  cabinetId: number;
  materialId: number;
  cabinetCode: string;
  cabinetName: string;
  materialCode: string;
  materialName: string;
  maintainName: string;
  createTime: string;
  updatedTime: string;
}

// 维修记录分页响应接口
export interface MaintainRecordPageResponse {
  code: number;
  msg: string;
  data: {
    records: MaintainRecordData[];
    total?: number;
    size?: number;
    current?: number;
    pages?: number;
  };
}

// 基础API响应接口
export interface BaseApiResponse {
  code: number;
  msg: string;
  data?: any;
}

// 维修记录查询参数接口
export interface MaintainRecordQueryParams {
  pageNum?: number;
  pageSize?: number;
  cabinetCode?: string;
  cabinetName?: string;
  materialName?: string;
  maintainName?: string;
  startTime?: string;
  endTime?: string;
  province?: string;
  city?: string;
  district?: string;
}

// ==================== API 方法 ====================

/**
 * 获取维修记录列表
 * @param params 查询参数
 * @returns 维修记录列表响应数据
 */
export const getMaintainRecordList = async (params: MaintainRecordQueryParams = {}): Promise<MaintainRecordPageResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // 添加搜索参数
    if (params.cabinetCode) queryParams.append('cabinetCode', params.cabinetCode);
    if (params.cabinetName) queryParams.append('cabinetName', params.cabinetName);
    if (params.materialName) queryParams.append('materialName', params.materialName);
    if (params.maintainName) queryParams.append('maintainName', params.maintainName);
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    if (params.startTime) queryParams.append('startTime', params.startTime);
    if (params.endTime) queryParams.append('endTime', params.endTime);
    
    const url = `/api/power/maintain-records/maintainRecords${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('获取维修记录列表API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: MaintainRecordPageResponse = await response.json();
    console.log('获取维修记录列表API响应:', result);
    return result;
    
  } catch (error) {
    console.error('获取维修记录列表API请求失败:', error);
    throw error;
  }
};

// ==================== 默认导出 ====================

export default {
  getMaintainRecordList
};