interface PcaData {
  [province: string]: {
    [city: string]: string[];
  };
}

import pcaData from "@/assets/area/pca.json";
const typedPcaData = pcaData as PcaData;
export interface AreaNode {
  label: string;
  code: string;
  level: 3 | 2 | 1; // 1-省 2-市 3-区
  children?: AreaNode[];
}

/**
 * 根据省、市、区名称生成区域代码
 * @param allData 区域数据列表
 * @param province 省名称
 * @param city 市名称
 * @param district 区名称
 * @returns 区域代码字符串
 */
export const generateAreaCode = (
  allData: AreaNode[],
  province: string,
  city: string,
  district: string
): string => {
  // 查找省级代码
  const provinceNode = allData.find(item => item.label === province);
  if (!provinceNode) return "000000";
  // 查找市级代码
  const cityNode = provinceNode.children?.find(item => item.label === city);
  if (!cityNode) return provinceNode.code;
  // 查找区级代码
  const districtNode = cityNode.children?.find(item => item.label === district);
  if (!districtNode) return cityNode.code;
  return districtNode.code; // 返回区级代码
};

// 将原始JSON数据转换为树形结构
export const transformPcaToTree = (): AreaNode[] => {
  const result: AreaNode[] = [];

  Object.keys(typedPcaData).forEach((provinceName, provinceIndex) => {
    const provinceCode = `${(provinceIndex + 1).toString().padStart(2, "0")}0000`;
    const provinceNode: AreaNode = {
      label: provinceName,
      code: provinceCode,
      level: 1,
      children: []
    };

    const cities = typedPcaData[provinceName];
    let cityIndex = 1;

    Object.keys(cities).forEach(cityName => {
      const cityCode = `${provinceCode.substring(0, 2)}${cityIndex.toString().padStart(2, "0")}00`;
      const cityNode: AreaNode = {
        label: cityName,
        code: cityCode,
        level: 2,
        children: []
      };

      const districts = cities[cityName];

      // 现在 districts 类型明确为 string[]
      districts.forEach((districtName: string, districtIndex: number) => {
        const districtCode = `${cityCode.substring(0, 4)}${(districtIndex + 1).toString().padStart(2, "0")}`;
        const districtNode: AreaNode = {
          label: districtName,
          code: districtCode,
          level: 3
        };

        cityNode.children!.push(districtNode);
      });

      provinceNode.children!.push(cityNode);
      cityIndex++;
    });

    result.push(provinceNode);
  });

  return result;
};

// 根据用户类型和代码获取对应的数据
export const getAreaDataByUserType = (areaType: any, areaCode: any): AreaNode[] => {
  const allData = transformPcaToTree();
  
  console.log('根据权限类型获取数据:', { areaType, areaCode });
  
  // 根据权限级别返回对应数据
  switch (areaType) {
    case 3: // 省级管理员
      return getProvinceData(allData, areaCode);
    case 2: // 市级管理员
      return getCityData(allData, areaCode);
    case 1: // 区级管理员
      return getDistrictData(allData, areaCode);
    default:
      console.warn('未知的权限级别:', areaType);
      return [];
  }
};
// 获取完整的区域数据（超级管理员使用）
export const getAllAreaData = (): AreaNode[] => {
  return transformPcaToTree();
};

// 根据用户权限获取数据的统一入口
export const getAreaDataByUserPermission = (
  userType: number | null,
  areaType: any,
  areaCode: any
): AreaNode[] => {
  console.log('用户权限信息:', { userType, areaType, areaCode });
  
  // 超级管理员：返回所有数据
  if (userType === 2) {
    console.log('超级管理员权限：返回全部区域数据');
    return getAllAreaData();
  }
  
  // 普通管理员：根据权限级别返回数据
  if (areaType && areaCode) {
    return getAreaDataByUserType(areaType, areaCode);
  }
  
  // 兜底：返回空数组
  console.warn('无法确定用户权限，返回空数据');
  return [];
};

// 检查用户是否有权限访问某个区域
export const hasAreaPermission = (
  targetAreaCode: string,
  userType: number | null,
  areaType: any,
  areaCode: any
): boolean => {
  // 超级管理员：有所有权限
  if (userType === 2) {
    return true;
  }
  
  // 普通管理员：检查目标区域是否在权限范围内
  const userAreaData = getAreaDataByUserType(areaType, areaCode);
  
  // 递归检查目标区域代码是否在权限数据中
  const checkCodeInData = (data: AreaNode[], code: string): boolean => {
    for (const node of data) {
      if (node.code === code) {
        return true;
      }
      if (node.children && checkCodeInData(node.children, code)) {
        return true;
      }
    }
    return false;
  };
  
  return checkCodeInData(userAreaData, targetAreaCode);
};

// 获取省级数据（返回该省的所有数据）
const getProvinceData = (
  allData: AreaNode[],
  provinceCode: string
): AreaNode[] => {
  const province = allData.find(item => item.code === provinceCode);
  return province ? [province] : [];
};

// 获取市级数据（返回该市及其父省）
const getCityData = (allData: AreaNode[], cityCode: string): AreaNode[] => {
  const provinceCode = cityCode.substring(0, 2) + "0000";
  const province = allData.find(item => item.code === provinceCode);

  if (!province || !province.children) return [];

  const city = province.children.find(item => item.code === cityCode);
  if (!city) return [];

  // 返回只包含该市的省级结构
  return [
    {
      ...province,
      children: [city]
    }
  ];
};

// 获取区级数据（返回该区及其父市、父省）
const getDistrictData = (
  allData: AreaNode[],
  districtCode: string
): AreaNode[] => {
  const provinceCode = districtCode.substring(0, 2) + "0000";
  const cityCode = districtCode.substring(0, 4) + "00";

  const province = allData.find(item => item.code === provinceCode);
  if (!province || !province.children) return [];

  const city = province.children.find(item => item.code === cityCode);
  if (!city || !city.children) return [];

  const district = city.children.find(item => item.code === districtCode);
  if (!district) return [];

  // 返回完整的层级结构
  return [
    {
      ...province,
      children: [
        {
          ...city,
          children: [district]
        }
      ]
    }
  ];
};

// 根据代码查找区域名称
export const findAreaNameByCode = (code: string): string => {
  const allData = transformPcaToTree();

  const findInTree = (nodes: AreaNode[], targetCode: string): string => {
    for (const node of nodes) {
      if (node.code === targetCode) {
        return node.label;
      }
      if (node.children) {
        const found = findInTree(node.children, targetCode);
        if (found) return found;
      }
    }
    return "";
  };

  return findInTree(allData, code);
};
