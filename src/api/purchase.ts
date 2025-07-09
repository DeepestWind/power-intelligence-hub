// ==================== 类型定义 ====================

// 购买记录数据接口
export interface PurchaseRecordData {
  id: number;
  employeeId: string;
  cabinetId: number;
  materialId: number;
  cabinetCode: string;
  cabinetName: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  remark: string | null;
  operatorName: string;
  createTime: string;
  updatedTime: string;
}

// 购买记录表单数据接口
export interface PurchaseRecordFormData {
  id?: number;
  employeeId: string;
  cabinetId: number;
  materialId: number;
  cabinetCode: string;
  cabinetName: string;
  materialCode: string;
  materialName: string;
  quantity: number;
  remark?: string;
  operatorName: string;
  createTime?: string;
  updatedTime?: string;
}

// 购买记录分页响应接口
export interface PurchaseRecordPageResponse {
  code: number;
  msg: string;
  data: {
    records: PurchaseRecordData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

// 基础API响应接口
export interface BaseApiResponse {
  code: number;
  msg: string;
  data?: any;
}

// 购买记录查询参数接口
export interface PurchaseRecordQueryParams {
  pageNum?: number;
  pageSize?: number;
  cabinetName?: string;
  materialName?: string;
  province?: string;
  city?: string;
  district?: string;
}

// ==================== API 方法 ====================

/**
 * 获取购买记录列表
 * @param params 查询参数
 * @returns 购买记录列表响应数据
 */
export const getPurchaseRecordList = async (params: PurchaseRecordQueryParams = {}): Promise<PurchaseRecordPageResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // 添加搜索参数
    if (params.cabinetName) queryParams.append('cabinetName', params.cabinetName);
    if (params.materialName) queryParams.append('materialName', params.materialName);
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    
    const url = `/api/power/purchase-records/purchaseRecords${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    console.log('获取购买记录列表API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: PurchaseRecordPageResponse = await response.json();
    console.log('获取购买记录列表API响应:', result);
    return result;
    
  } catch (error) {
    console.error('获取购买记录列表API请求失败:', error);
    throw error;
  }
};

/**
 * 新增购买记录
 * @param data 购买记录表单数据
 * @returns API响应结果
 */
export const addPurchaseRecord = async (data: PurchaseRecordFormData): Promise<BaseApiResponse> => {
  try {
    const requestData = {
      ...data,
      createTime: new Date().toISOString(),
      updatedTime: new Date().toISOString()
    };
    
    // 新增时不需要 id 字段
    if (requestData.id === 0 || requestData.id === undefined) {
      delete requestData.id;
    }
    
    console.log('新增购买记录API请求数据:', requestData);

    const response = await fetch('/api/power/purchase-records/save', {
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
    console.log('新增购买记录API响应:', result);
    return result;
    
  } catch (error) {
    console.error('新增购买记录API请求失败:', error);
    throw error;
  }
};

/**
 * 更新购买记录
 * @param data 购买记录表单数据
 * @returns API响应结果
 */
export const updatePurchaseRecord = async (data: PurchaseRecordFormData): Promise<BaseApiResponse> => {
  try {
    const requestData = {
      ...data,
      updatedTime: new Date().toISOString()
    };
    
    console.log('更新购买记录API请求数据:', requestData);

    const response = await fetch('/api/power/purchase-records/update', {
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
    console.log('更新购买记录API响应:', result);
    return result;
    
  } catch (error) {
    console.error('更新购买记录API请求失败:', error);
    throw error;
  }
};


// ==================== 默认导出 ====================

export default {
  getPurchaseRecordList,
  addPurchaseRecord,
  updatePurchaseRecord
};