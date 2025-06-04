import pcaData from '@/assets/area/pca.json';

export interface AreaNode {
  label: string;
  code: string;
  level: 1 | 2 | 3; // 1-省 2-市 3-区
  children?: AreaNode[];
}

export interface UserType {
  type: 'province' | 'city' | 'district';
  code: string; // 对应的区域代码
}

// 将原始JSON数据转换为树形结构
export const transformPcaToTree = (): AreaNode[] => {
  const result: AreaNode[] = [];
  
  Object.keys(pcaData).forEach((provinceName, provinceIndex) => {
    const provinceCode = `${(provinceIndex + 1).toString().padStart(2, '0')}0000`;
    const provinceNode: AreaNode = {
      label: provinceName,
      code: provinceCode,
      level: 1,
      children: []
    };
    
    const cities = pcaData[provinceName as keyof typeof pcaData];
    let cityIndex = 1;
    
    Object.keys(cities).forEach(cityName => {
      const cityCode = `${provinceCode.substring(0, 2)}${cityIndex.toString().padStart(2, '0')}00`;
      const cityNode: AreaNode = {
        label: cityName,
        code: cityCode,
        level: 2,
        children: []
      };
      
      const districts = cities[cityName as keyof typeof cities];
      
      districts.forEach((districtName: string, districtIndex: number) => {
        const districtCode = `${cityCode.substring(0, 4)}${(districtIndex + 1).toString().padStart(2, '0')}`;
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
export const getAreaDataByUserType = (userType: UserType): AreaNode[] => {
  const allData = transformPcaToTree();
  
  switch (userType.type) {
    case 'province':
      return getProvinceData(allData, userType.code);
    case 'city':
      return getCityData(allData, userType.code);
    case 'district':
      return getDistrictData(allData, userType.code);
    default:
      return [];
  }
};

// 获取省级数据（返回该省的所有数据）
const getProvinceData = (allData: AreaNode[], provinceCode: string): AreaNode[] => {
  const province = allData.find(item => item.code === provinceCode);
  return province ? [province] : [];
};

// 获取市级数据（返回该市及其父省）
const getCityData = (allData: AreaNode[], cityCode: string): AreaNode[] => {
  const provinceCode = cityCode.substring(0, 2) + '0000';
  const province = allData.find(item => item.code === provinceCode);
  
  if (!province || !province.children) return [];
  
  const city = province.children.find(item => item.code === cityCode);
  if (!city) return [];
  
  // 返回只包含该市的省级结构
  return [{
    ...province,
    children: [city]
  }];
};

// 获取区级数据（返回该区及其父市、父省）
const getDistrictData = (allData: AreaNode[], districtCode: string): AreaNode[] => {
  const provinceCode = districtCode.substring(0, 2) + '0000';
  const cityCode = districtCode.substring(0, 4) + '00';
  
  const province = allData.find(item => item.code === provinceCode);
  if (!province || !province.children) return [];
  
  const city = province.children.find(item => item.code === cityCode);
  if (!city || !city.children) return [];
  
  const district = city.children.find(item => item.code === districtCode);
  if (!district) return [];
  
  // 返回完整的层级结构
  return [{
    ...province,
    children: [{
      ...city,
      children: [district]
    }]
  }];
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
    return '';
  };
  
  return findInTree(allData, code);
};