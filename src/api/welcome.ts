// ==================== 类型定义 ====================

// 柜子信息数据接口
export interface CabinetInfoData {
  cabinetId: number;
  cabinetName: string;
  total: number;
  inStock: number;
  borrowed: number;
  overdue: number;
  repairing: number;
}

// 柜子信息API响应接口
export interface CabinetInfoApiResponse {
  code: number;
  msg: string;
  data: CabinetInfoData[];
}

// ==================== API 方法 ====================

/**
 * 获取柜子大致信息
 * @returns 柜子信息列表
 */
export const getCabinetInfo = async (): Promise<CabinetInfoApiResponse> => {
  try {
    const response = await fetch('/api/power/material-status/cabinetInfo', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: CabinetInfoApiResponse = await response.json();
    console.log('获取柜子信息API响应:', data);
    return data;
    
  } catch (error) {
    console.error('获取柜子信息API请求失败:', error);
    throw error;
  }
};

// ==================== 工具函数 ====================

/**
 * 计算柜子使用率
 * @param cabinetInfo 柜子信息
 * @returns 使用率百分比
 */
export const calculateUsageRate = (cabinetInfo: CabinetInfoData): number => {
  if (cabinetInfo.total === 0) return 0;
  const usedCount = cabinetInfo.borrowed + cabinetInfo.overdue + cabinetInfo.repairing;
  return Math.round((usedCount / cabinetInfo.total) * 100);
};

/**
 * 获取柜子状态标签类型
 * @param cabinetInfo 柜子信息
 * @returns 标签类型
 */
export const getCabinetStatusType = (cabinetInfo: CabinetInfoData): 'success' | 'warning' | 'danger' => {
  if (cabinetInfo.overdue > 0) return 'danger';
  if (cabinetInfo.repairing > 0) return 'warning';
  return 'success';
};

/**
 * 格式化柜子状态描述
 * @param cabinetInfo 柜子信息
 * @returns 状态描述
 */
export const formatCabinetStatus = (cabinetInfo: CabinetInfoData): string => {
  if (cabinetInfo.overdue > 0) return `${cabinetInfo.overdue}件超时`;
  if (cabinetInfo.repairing > 0) return `${cabinetInfo.repairing}件维修中`;
  return '正常';
};

// ==================== 默认导出 ====================

export default {
  getCabinetInfo,
  calculateUsageRate,
  getCabinetStatusType,
  formatCabinetStatus
};