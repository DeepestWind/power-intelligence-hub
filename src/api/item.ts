// ==================== 类型定义 ====================

import { number } from "echarts/types/src/echarts.all.js";
import { get } from "sortablejs";

// 物料数据接口
export interface MaterialData {
  id: number;
  cabinetId: number;
  cabinetCode: string;
  cabinetName: string;
  materialCode: string;
  materialName: string;
  rfid: string;
  experimentDate: string;
  province: string;
  city: string;
  district: string;
  address: string;
  isDelete: number; // 1-正常, 0-已删除
  createTime: string;
  updatedTime: string;
}

// 物料表单数据接口
export interface MaterialFormData {
  id?: number;
  cabinetId: number | null;
  cabinetCode: string;
  cabinetName: string;
  materialCode: string;
  materialName: string;
  rfid: string;
  experimentDate: string;
  province: string;
  city: string;
  district: string;
  address: string;
  isDelete: number;
  createTime?: string;
  updatedTime?: string;
}

// 物料下架参数接口
export interface MaterialOfflineParams {
  id: number;
  //isDelete?: number;
  remark: string;
}

// 物料查询参数接口
export interface MaterialQueryParams {
  pageNum?: number;
  pageSize?: number;
  materialCode?: string;
  materialName?: string;
  cabinetName?: string;
  province?: string;
  city?: string;
  district?: string;
}

// 物料列表API响应接口
export interface MaterialApiResponse {
  code: number;
  msg: string;
  data: {
    records: MaterialData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

/**
 * 物品生命周期数据接口
 */
export interface MaterialLifecycleData {
  purchaseRemark: string | null;
  purchaseName: string | null;
  shelfTime: string | null;
  shelfName: string | null;
  borrowedName: string | null;
  borrowedTime: string | null;
  returnedName: string | null;
  returnedTime: string | null;
  shelfOutTime: string | null;
  shelfOutName: string | null;
  status: number; //物品状态 1在，0 借出,2 维修
}

// 🔥 新增：根据柜子ID查询物品响应接口
export interface MaterialByCabinetResponse {
  code: number;
  msg: string;
  data: string[]; // 物品名称数组
}
// 🔥 新增：根据柜子ID查询物品详细信息响应接口
export interface MaterialDetailByCabinetResponse {
  code: number;
  msg: string;
  data: MaterialData[]; // 物品详细信息数组
}

/**
 * 物品生命周期API响应接口
 */
export interface MaterialLifecycleResponse {
  code: number;
  msg: string;
  data: MaterialLifecycleData;
}

// 通用API响应接口
export interface BaseApiResponse {
  code: number;
  msg: string;
  data?: any;
}

// ==================== API 方法 ====================

/**
 * 获取物料列表
 * @param params 查询参数
 * @returns 物料列表响应数据
 */
export const getMaterialList = async (params: MaterialQueryParams = {}): Promise<MaterialApiResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // 添加搜索参数
    if (params.materialCode) queryParams.append('materialCode', params.materialCode);
    if (params.materialName) queryParams.append('materialName', params.materialName);
    if (params.cabinetName) queryParams.append('cabinetName', params.cabinetName);
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    
    // 构建完整的URL
    const baseUrl = `/api/power/material/page`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('物料列表API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: MaterialApiResponse = await response.json();
    return data;
    
  } catch (error) {
    console.error('获取物料列表API请求失败:', error);
    throw error;
  }
};

/**
 * 新增物料
 * @param data 物料数据
 * @returns API响应结果
 */
export const addMaterial = async (data: MaterialFormData): Promise<BaseApiResponse> => {
  try {
    const requestData = {
      ...data,
      createTime: new Date().toISOString(),
      updatedTime: new Date().toISOString()
    };
    
    console.log('新增物料API请求数据:', requestData);

    const response = await fetch('/api/power/material/save', {
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
    console.log('新增物料API响应:', result);
    return result;
    
  } catch (error) {
    console.error('新增物料API请求失败:', error);
    throw error;
  }
};

/**
 * 更新物料
 * @param data 物料数据
 * @returns API响应结果
 */
export const updateMaterial = async (data: MaterialFormData): Promise<BaseApiResponse> => {
  try {
    const requestData = {
      ...data,
      updatedTime: new Date().toISOString()
    };
    
    console.log('更新物料API请求数据:', requestData);

    const response = await fetch('/api/power/material/update', {
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
    console.log('更新物料API响应:', result);
    return result;
    
  } catch (error) {
    console.error('更新物料API请求失败:', error);
    throw error;
  }
};


// 修改：物料下架（替换原来的删除功能）
/**
 * 物料下架
 * @param id 物料ID
 * @returns API响应结果
 */
export const offlineMaterial = async (params: MaterialOfflineParams): Promise<BaseApiResponse> => {
  try {
    // 将 remark 作为查询参数添加到 URL 中
    const url = `/api/power/material/status/${params.id}?remark=${encodeURIComponent(params.remark)}`;
    
    
    console.log('物料下架API请求数据:', url);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      }
      // 移除 body，因为 remark 现在在 URL 查询参数中
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('物料下架API响应:', result);
    return result;
    
  } catch (error) {
    console.error('物料下架API请求失败:', error);
    throw error;
  }
};

/**
 * 根据柜子ID查询物品
 * @param cabinetId 柜子ID
 * @returns 物品名称列表响应数据
 */
export const getMaterialsByCabinetId = async (cabinetId: number): Promise<MaterialByCabinetResponse> => {
  try {
    const url = `/api/power/material/cabinet/${cabinetId}`;
    
    console.log('根据柜子ID查询物品API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: MaterialByCabinetResponse = await response.json();
    console.log('根据柜子ID查询物品API响应:', result);
    return result;
    
  } catch (error) {
    console.error('根据柜子ID查询物品API请求失败:', error);
    throw error;
  }
};

/**
 * 根据柜子ID查询物品详细信息
 * @param cabinetId 柜子ID
 * @returns 物品详细信息列表响应数据
 */
export const getMaterialDetailsByCabinetId = async (cabinetId: number): Promise<MaterialDetailByCabinetResponse> => {
  try {
    const url = `/api/power/material/cabinets/${cabinetId}`;
    
    console.log('根据柜子ID查询物品详细信息API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: MaterialDetailByCabinetResponse = await response.json();
    console.log('根据柜子ID查询物品详细信息API响应:', result);
    return result;
    
  } catch (error) {
    console.error('根据柜子ID查询物品详细信息API请求失败:', error);
    throw error;
  }
};

/**
 * 获取物品全生命周期信息
 * @param id 物品ID
 * @returns 物品生命周期数据
 */
export const getMaterialLifecycle = async (id: number): Promise<MaterialLifecycleResponse> => {
  try {
    const url = `/api/power/material/view/${id}`;
    
    console.log('获取物品生命周期API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: MaterialLifecycleResponse = await response.json();
    console.log('获取物品生命周期API响应:', result);
    return result;
    
  } catch (error) {
    console.error('获取物品生命周期API请求失败:', error);
    throw error;
  }
};


// export const deleteMaterial = async (id: number): Promise<BaseApiResponse> => {
//   try {
//     const response = await fetch(`/api/power/material/${id}`, {
//       method: 'DELETE',
//       headers: {
//         'Content-Type': 'application/json',
//       }
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const result: BaseApiResponse = await response.json();
//     console.log('删除物料API响应:', result);
//     return result;
    
//   } catch (error) {
//     console.error('删除物料API请求失败:', error);
//     throw error;
//   }
// };

// ==================== 默认导出 ====================

export default {
  getMaterialList,
  addMaterial,
  updateMaterial,
  offlineMaterial,
  getMaterialsByCabinetId,
  getMaterialDetailsByCabinetId,
  getMaterialLifecycle
};