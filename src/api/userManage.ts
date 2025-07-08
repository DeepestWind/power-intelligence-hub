import { 
  getCabinetList as getCabinetListFromCabinet,
  type CabinetData,
  type CabinetApiResponse as CabinetListApiResponse
} from './cabinet';

// ==================== 类型定义 ====================

// 用户数据接口
export interface UserData {
  id: number;
  userName: string;
  departmentId: number | null;
  departmentName: string | null;
  employeeId: string;
  password: string;
  userType: number;
  adminLevel: number;
  province: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  status: number;
  cabinetManagement: string | null;
  faceRecognition: string | null;
  fingerprintRecognition: string | null;
  createTime: string;
  updatedTime: string;
}

// 用户表单数据接口
export interface UserFormData {
  id?: number;
  userName: string;
  departmentId?: number | null; 
  departmentName?: string | null; 
  employeeId: string;
  password: string;
  userType: number;
  adminLevel: number;
  province?: string;
  city?: string;
  district?: string;
  address?: string;
  createTime?: string;
  updatedTime?: string;
}

// 用户查询参数接口
export interface UserQueryParams {
  pageNum?: number;
  pageSize?: number;
  userName?: string;
  departmentName?: string;
  province?: string;
  city?: string;
  district?: string;
}

// 用户列表API响应接口
export interface UserApiResponse {
  code: number;
  msg: string;
  data: {
    records: UserData[];
    total: number;
    current: number;
    size: number;
    pages: number;
  };
}

// 用户部门操作参数接口
export interface UserDepartmentParams {
  userId: number;
  departmentId: number;
  departmentName: string;
}

// IC卡数据接口
export interface UserIcCard {
  icCard: string;
}

// IC卡API响应接口
export interface IcCardApiResponse {
  code: number;
  msg: string;
  data: string[];
}

// 绑定柜子数据接口
export interface UserCabinet {
  id: number;
  userId: number;
  cabinetId: number;
  cabinetName: string;
}

// 绑定柜子API响应接口
export interface CabinetApiResponse {
  code: number;
  msg: string;
  data: Record<string, string>;
}

// 柜子列表项接口
export interface CabinetListItem extends CabinetData {
  // 如果需要额外字段可以在这里添加
}

// 柜子列表API响应接口 现在使用从cabinet.ts导入的类型
// export interface CabinetListApiResponse {
//   code: number;
//   msg: string;
//   data: {
//     records: CabinetListItem[];
//     total: number;
//     current: number;
//     size: number;
//     pages: number;
//   };
// }

// 通用API响应接口
export interface BaseApiResponse {
  code: number;
  msg: string;
  data?: any;
}

// ==================== API 方法 ====================

/**
 * 获取用户列表
 * @param params 查询参数
 * @returns 用户列表响应数据
 */
export const getUserList = async (params: UserQueryParams = {}): Promise<UserApiResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    // 添加分页参数
    if (params.pageNum) queryParams.append('pageNum', params.pageNum.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // 添加搜索参数
    if (params.userName) queryParams.append('userName', params.userName);
    if (params.departmentName) queryParams.append('departmentName', params.departmentName); 
    if (params.province) queryParams.append('province', params.province);
    if (params.city) queryParams.append('city', params.city);
    if (params.district) queryParams.append('district', params.district);
    
    // 构建完整的URL
    const baseUrl = `/api/power/user/page`;
    const url = queryParams.toString() ? `${baseUrl}?${queryParams.toString()}` : baseUrl;
    
    console.log('用户列表API请求URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: UserApiResponse = await response.json();
    return data;
    
  } catch (error) {
    console.error('获取用户列表API请求失败:', error);
    throw error;
  }
};

/**
 * 新增用户
 * @param data 用户数据
 * @returns API响应结果
 */
export const addUser = async (data: UserFormData): Promise<BaseApiResponse> => {
  try {
    const requestData = {
      ...data,
      createTime: new Date().toISOString(),
      updatedTime: new Date().toISOString()
    };
    
    console.log('新增用户API请求数据:', requestData);

    const response = await fetch('/api/power/user/save', {
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
    console.log('新增用户API响应:', result);
    return result;
    
  } catch (error) {
    console.error('新增用户API请求失败:', error);
    throw error;
  }
};

/**
 * 更新用户
 * @param data 用户数据
 * @returns API响应结果
 */
export const updateUser = async (data: UserFormData): Promise<BaseApiResponse> => {
  try {
    const requestData = {
      ...data,
      updatedTime: new Date().toISOString()
    };
    
    console.log('更新用户API请求数据:', requestData);

    const response = await fetch('/api/power/user/update', {
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
    console.log('更新用户API响应:', result);
    return result;
    
  } catch (error) {
    console.error('更新用户API请求失败:', error);
    throw error;
  }
};

/**
 * 删除用户
 * @param id 用户ID
 * @returns API响应结果
 */
export const deleteUser = async (id: number): Promise<BaseApiResponse> => {
  try {
    const response = await fetch(`/api/power/user/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('删除用户API响应:', result);
    return result;
    
  } catch (error) {
    console.error('删除用户API请求失败:', error);
    throw error;
  }
};

/**
 * 为用户添加部门
 * @param userId 用户ID
 * @param departmentId 部门ID
 * @param departmentName 部门名称
 * @returns API响应结果
 */
export const addUserDepartment = async (userId: number, departmentId: number, departmentName: string): Promise<BaseApiResponse> => {
  try {
    const url = `/api/power/user/addDepartment/${userId}?departmentId=${departmentId}&departmentName=${encodeURIComponent(departmentName)}`;
    
    console.log('添加用户部门API请求URL:', url);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('添加用户部门API响应:', result);
    return result;
    
  } catch (error) {
    console.error('添加用户部门API请求失败:', error);
    throw error;
  }
};

/**
 * 移除用户部门
 * @param userId 用户ID
 * @returns API响应结果
 */
export const deleteUserDepartment = async (userId: number): Promise<BaseApiResponse> => {
  try {
    const url = `/api/power/user/deleteDepartment/${userId}`;
    
    console.log('移除用户部门API请求URL:', url);

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('移除用户部门API响应:', result);
    return result;
    
  } catch (error) {
    console.error('移除用户部门API请求失败:', error);
    throw error;
  }
};



/**
 * 获取用户IC卡列表
 * @param userId 用户ID
 * @returns IC卡列表响应
 */
export const getUserIcCards = async (userId: number): Promise<IcCardApiResponse> => {
  try {
    const response = await fetch(`/api/power/user-ic/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: IcCardApiResponse = await response.json();
    console.log('获取用户IC卡API响应:', result);
    return result;
    
  } catch (error) {
    console.error('获取用户IC卡API请求失败:', error);
    throw error;
  }
};

/**
 * 添加用户IC卡
 * @param data IC卡数据
 * @returns API响应结果
 */
export const addUserIcCard = async (data: Partial<UserIcCard> & { userId: number; userName: string }): Promise<BaseApiResponse> => {
  try {
    const response = await fetch('/api/power/user-ic/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('添加用户IC卡API响应:', result);
    return result;
    
  } catch (error) {
    console.error('添加用户IC卡API请求失败:', error);
    throw error;
  }
};

/**
 * 删除用户IC卡
 * @param userId 用户ID
 * @param icCard IC卡号
 * @returns API响应结果
 */
export const deleteUserIcCard = async (userId: number, icCard: string): Promise<BaseApiResponse> => {
  try {
    const response = await fetch(`/api/power/user-ic/${userId}/${icCard}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('删除用户IC卡API响应:', result);
    return result;
    
  } catch (error) {
    console.error('删除用户IC卡API请求失败:', error);
    throw error;
  }
};

/**
 * 获取用户绑定柜子列表
 * @param userId 用户ID
 * @returns 绑定柜子列表响应
 */
export const getUserCabinets = async (userId: number): Promise<CabinetApiResponse> => {
  try {
    const response = await fetch(`/api/power/user-cabinet-relation/getCabinets/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: CabinetApiResponse = await response.json();
    console.log('获取用户绑定柜子API响应:', result);
    return result;
    
  } catch (error) {
    console.error('获取用户绑定柜子API请求失败:', error);
    throw error;
  }
};

/**
 * 添加用户绑定柜子
 * @param data 绑定柜子数据
 * @returns API响应结果
 */
export const addUserCabinet = async (data: Partial<UserCabinet>): Promise<BaseApiResponse> => {
  try {
    const response = await fetch('/api/power/user-cabinet-relation/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('添加用户绑定柜子API响应:', result);
    return result;
    
  } catch (error) {
    console.error('添加用户绑定柜子API请求失败:', error);
    throw error;
  }
};

/**
 * 删除用户绑定柜子
 * @param userId 用户ID
 * @param cabinetId 柜子ID
 * @returns API响应结果
 */
export const deleteUserCabinet = async (userId: number, cabinetId: number): Promise<BaseApiResponse> => {
  try {
    const response = await fetch(`/api/power/user-cabinet-relation/delete/${userId}/${cabinetId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('删除用户绑定柜子API响应:', result);
    return result;
    
  } catch (error) {
    console.error('删除用户绑定柜子API请求失败:', error);
    throw error;
  }
};

/**
 * 获取柜子列表
 * @param params 查询参数
 * @returns 柜子列表响应
 */
export const getCabinetList = async (params: any = {}): Promise<CabinetListApiResponse> => {
  try {
    // 直接调用cabinet.ts中的方法
    const result = await getCabinetListFromCabinet(params);
    console.log('复用柜子列表API响应:', result);
    return result;
    
  } catch (error) {
    console.error('复用柜子列表API请求失败:', error);
    throw error;
  }
};

/**
 * 获取用户人脸信息
 * @param userId 用户ID
 * @returns 人脸图片Blob URL
 */
export const getUserFaces = async (userId: number): Promise<{ code: number; msg: string; data?: string }> => {
  try {
    const timestamp = Date.now();
    const response = await fetch(`/api/power/minio/view/${userId}?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { code: 404, msg: '用户暂无人脸照片' };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    
    console.log('获取人脸信息API响应: 图片URL已创建');
    
    return { 
      code: 200, 
      msg: '获取成功', 
      data: imageUrl
    };
    
  } catch (error) {
    console.error('获取人脸信息API请求失败:', error);
    throw error;
  }
};

/**
 * 上传人脸照片
 * @param userId 用户ID
 * @param file 图片文件
 * @returns API响应结果
 */
export const uploadFace = async (userId: number, file: File): Promise<BaseApiResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`/api/power/minio/upload/${userId}`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('上传人脸照片API响应:', result);
    return result;
    
  } catch (error) {
    console.error('上传人脸照片API请求失败:', error);
    throw error;
  }
};

/**
 * 删除人脸照片
 * @param userId 用户ID
 * @returns API响应结果
 */
export const deleteFace = async (userId: number): Promise<BaseApiResponse> => {
  try {
    const response = await fetch(`/api/power/minio/delete/${userId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: BaseApiResponse = await response.json();
    console.log('删除人脸照片API响应:', result);
    return result;
    
  } catch (error) {
    console.error('删除人脸照片API请求失败:', error);
    throw error;
  }
};

// ==================== 默认导出 ====================

export default {
  getUserList,
  addUser,
  updateUser,
  deleteUser,
  addUserDepartment, 
  deleteUserDepartment, 
  getUserIcCards,
  addUserIcCard,
  deleteUserIcCard,
  getUserCabinets,
  addUserCabinet,
  deleteUserCabinet,
  getCabinetList,
  getUserFaces,
  uploadFace,
  deleteFace
};