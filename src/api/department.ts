// ==================== 类型定义 ====================

// 部门数据接口
export interface DepartmentData {
  id: number;
  departmentName: string;
  province: string;
  city: string;
  district: string;
  createTime: string;
  updatedTime: string;
}

// 部门表单数据接口
export interface DepartmentFormData {
  id?: number;
  departmentName: string;
  province: string;
  city: string;
  district: string;
  createTime?: string;
  updatedTime?: string;
}

// 部门查询参数接口
export interface DepartmentQueryParams {
  pageNum?: number;
  pageSize?: number;
  departmentName?: string;
  province?: string;
  city?: string;
  district?: string;
}

// 部门列表API响应接口
export interface DepartmentApiResponse {
  code: number;
  msg: string;
  data: {
    records: DepartmentData[];
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
 * 获取部门列表
 * @param params 查询参数
 * @returns 部门列表响应数据
 */
export const getDepartmentList = async (params: DepartmentQueryParams = {}): Promise<DepartmentApiResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // 添加搜索参数
    if (params.departmentName) queryParams.append('departmentName', params.departmentName);
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    
    // 构建完整的URL
    const baseUrl = `/api/power/department/page`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('部门列表API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: DepartmentApiResponse = await response.json();
    return data;
    
  } catch (error) {
    console.error('获取部门列表API请求失败:', error);
    throw error;
  }
};

/**
 * 新增部门
 * @param data 部门数据
 * @returns API响应结果
 */
export const addDepartment = async (data: DepartmentFormData): Promise<BaseApiResponse> => {
  try {
    const requestData = {
      ...data,
      createTime: new Date().toISOString(),
      updatedTime: new Date().toISOString()
    };
    
    console.log('新增部门API请求数据:', requestData);

    const response = await fetch('/api/power/department/save', {
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
    console.log('新增部门API响应:', result);
    return result;
    
  } catch (error) {
    console.error('新增部门API请求失败:', error);
    throw error;
  }
};

/**
 * 更新部门
 * @param data 部门数据
 * @returns API响应结果
 */
export const updateDepartment = async (data: DepartmentFormData): Promise<BaseApiResponse> => {
  try {
    const requestData = {
      ...data,
      updatedTime: new Date().toISOString()
    };
    
    console.log('更新部门API请求数据:', requestData);

    const response = await fetch('/api/power/department/update', {
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
    console.log('更新部门API响应:', result);
    return result;
    
  } catch (error) {
    console.error('更新部门API请求失败:', error);
    throw error;
  }
};

/**
 * 删除部门
 * @param id 部门ID
 * @returns API响应结果
 */
export const deleteDepartment = async (id: number): Promise<BaseApiResponse> => {
  try {
    const response = await fetch(`/api/power/department/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('删除部门API响应:', result);
    return result;
    
  } catch (error) {
    console.error('删除部门API请求失败:', error);
    throw error;
  }
};

// ==================== 默认导出 ====================

export default {
  getDepartmentList,
  addDepartment,
  updateDepartment,
  deleteDepartment
};