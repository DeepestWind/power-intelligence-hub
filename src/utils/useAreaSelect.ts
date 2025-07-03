// src/utils/useAreaSelect.ts
import { ref, computed, type Ref } from 'vue';
import { useAreaStore } from '@/store/modules/area';
import { ElMessage } from 'element-plus';
import type { AreaNode } from '@/utils/area';

export interface AreaSelectOptions {
  label: string;
  value: string;
}

export interface AreaFormData {
  province: string;
  city: string;
  district: string;
  [key: string]: any;
}

export interface UseAreaSelectReturn {
  // 选项数据
  provinceOptions: Ref<AreaSelectOptions[]>;
  cityOptions: Ref<AreaSelectOptions[]>;
  districtOptions: Ref<AreaSelectOptions[]>;
  // 方法
  handleProvinceChange: (form: AreaFormData) => void;
  handleCityChange: (form: AreaFormData) => void;
  validateAreaPermission: (province: string, city?: string, district?: string) => boolean;
  initAreaSelectData: () => Promise<void>;
  // 数据
  areaData: Ref<AreaNode[]>;
  hasPermissionData: Ref<boolean>;
}

/**
 * 省市区选择器的通用组合函数
 * @param formData 表单数据的响应式引用
 * @returns 省市区选择器相关的数据和方法
 */
export function useAreaSelect(formData: Ref<AreaFormData>): UseAreaSelectReturn {
  const areaStore = useAreaStore();

  // 🔥 权限范围内的区域数据
  const areaData = computed(() => {
    const userAreaData = areaStore.getCurrentAreaData;
    
    if (!userAreaData || userAreaData.length === 0) {
      console.warn('用户无权限区域数据');
      return [];
    }
    
    return userAreaData;
  });

  // 🔥 是否有权限数据
  const hasPermissionData = computed(() => {
    return areaData.value.length > 0;
  });

  // 🔥 省份选项
  const provinceOptions = computed(() => {
    const userAreaData = areaData.value;
    
    if (!userAreaData || userAreaData.length === 0) {
      return [];
    }
    
    return userAreaData.map(item => ({
      label: item.label,
      value: item.label
    }));
  });

  // 🔥 城市选项（基于表单中的省份）
  const cityOptions = computed(() => {
    if (!formData.value.province) return [];
    
    const userAreaData = areaData.value;
    if (!userAreaData || userAreaData.length === 0) return [];
    
    // 在用户权限范围内查找省份
    const province = userAreaData.find(item => item.label === formData.value.province);
    
    if (!province || !province.children) return [];
    
    return province.children.map(item => ({
      label: item.label,
      value: item.label
    }));
  });

  // 🔥 区域选项（基于表单中的省份和城市）
  const districtOptions = computed(() => {
    if (!formData.value.province || !formData.value.city) return [];
    
    const userAreaData = areaData.value;
    if (!userAreaData || userAreaData.length === 0) return [];
    
    // 在用户权限范围内查找省份和城市
    const province = userAreaData.find(item => item.label === formData.value.province);
    if (!province || !province.children) return [];
    
    const city = province.children.find(item => item.label === formData.value.city);
    if (!city || !city.children) return [];
    
    return city.children.map(item => ({
      label: item.label,
      value: item.label
    }));
  });

  // 🔥 省份改变时清空城市和区域
  const handleProvinceChange = (form: AreaFormData) => {
    form.city = '';
    form.district = '';
    
    console.log('省份改变:', form.province);
    console.log('可选城市:', cityOptions.value);
  };

  // 🔥 城市改变时清空区域
  const handleCityChange = (form: AreaFormData) => {
    form.district = '';
    
    console.log('城市改变:', form.city);
    console.log('可选区域:', districtOptions.value);
  };

  // 🔥 权限验证函数
  const validateAreaPermission = (province: string, city?: string, district?: string): boolean => {
    const userAreaData = areaData.value;
    
    if (!userAreaData || userAreaData.length === 0) {
      return false;
    }
    
    // 检查省份权限
    const provinceNode = userAreaData.find(item => item.label === province);
    if (!provinceNode) {
      return false;
    }
    
    // 如果只检查省份权限
    if (!city) {
      return true;
    }
    
    // 检查城市权限
    const cityNode = provinceNode.children?.find(item => item.label === city);
    if (!cityNode) {
      return false;
    }
    
    // 如果只检查城市权限
    if (!district) {
      return true;
    }
    
    // 检查区域权限
    const districtNode = cityNode.children?.find(item => item.label === district);
    return !!districtNode;
  };

  // 🔥 初始化权限数据
  const initAreaSelectData = async () => {
    try {
      const userType = areaStore.getCurrentUserType;
      const areaType = areaStore.getCurrentAreaType;
      const areaCode = areaStore.getCurrentAreaCode;
      
      console.log('初始化省市区选择器权限数据:', { userType, areaType, areaCode });
      
      // 如果没有权限数据，尝试重新加载
      if (!areaStore.hasAreaData && areaType && areaCode) {
        console.log('权限数据为空，重新加载...');
        areaStore.loadAreaData(areaType, areaCode);
      }
      
      // 验证权限数据
      setTimeout(() => {
        if (areaStore.hasAreaData) {
          console.log('省市区选择器权限数据加载成功:', areaStore.getCurrentAreaData);
        } else {
          console.warn('省市区选择器权限数据加载失败');
          ElMessage.warning('无法加载权限数据，请刷新页面重试');
        }
      }, 100);
      
    } catch (error) {
      console.error('初始化省市区选择器权限数据失败:', error);
      ElMessage.error('初始化权限数据失败');
    }
  };

  return {
    // 选项数据
    provinceOptions,
    cityOptions,
    districtOptions,
    // 方法
    handleProvinceChange,
    handleCityChange,
    validateAreaPermission,
    initAreaSelectData,
    // 数据
    areaData,
    hasPermissionData
  };
}

// 🔥 创建权限验证的独立函数（不依赖表单数据）
export function useAreaPermissionCheck() {
  const areaStore = useAreaStore();

  const validateAreaPermission = (province: string, city?: string, district?: string): boolean => {
    const userAreaData = areaStore.getCurrentAreaData;
    
    if (!userAreaData || userAreaData.length === 0) {
      return false;
    }
    
    // 检查省份权限
    const provinceNode = userAreaData.find(item => item.label === province);
    if (!provinceNode) {
      return false;
    }
    
    // 如果只检查省份权限
    if (!city) {
      return true;
    }
    
    // 检查城市权限
    const cityNode = provinceNode.children?.find(item => item.label === city);
    if (!cityNode) {
      return false;
    }
    
    // 如果只检查城市权限
    if (!district) {
      return true;
    }
    
    // 检查区域权限
    const districtNode = cityNode.children?.find(item => item.label === district);
    return !!districtNode;
  };

  return {
    validateAreaPermission
  };
}