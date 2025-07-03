// src/utils/useAreaFilter.ts
import { ref, type Ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { AreaNode } from '@/utils/area';

export interface AreaFilterData {
  province: string;
  city: string;
  district: string;
}

export interface UseAreaFilterReturn {
  areaFilter: Ref<AreaFilterData>;
  handleAreaSearch: (area: AreaNode, onSearchComplete?: () => void) => void;
  clearAreaFilter: () => void;
  resetAreaFilter: () => void;
}

/**
 * 区域筛选的通用组合函数
 * @param onSearch 搜索回调函数
 * @returns 区域筛选相关的数据和方法
 */
export function useAreaFilter(onSearch?: () => void): UseAreaFilterReturn {
  
  // 🔥 区域筛选数据
  const areaFilter = ref<AreaFilterData>({
    province: '',
    city: '',
    district: ''
  });

  // 🔥 根据区域代码设置筛选条件
  const fillAreaFilter = (area: AreaNode) => {
    const code = area.code;
    const label = area.label;
    
    // 清空之前的筛选条件
    areaFilter.value = { province: '', city: '', district: '' };
    
    if (code.endsWith('0000')) {
      // 省级代码：如 320000 → 江苏省
      areaFilter.value.province = label;
      ElMessage.info(`已筛选省份: ${label}`);
    } else if (code.endsWith('00')) {
      // 市级代码：如 320400 → 常州市
      areaFilter.value.city = label;
      ElMessage.info(`已筛选城市: ${label}`);
    } else {
      // 区级代码：如 320411 → 新北区
      areaFilter.value.district = label;
      ElMessage.info(`已筛选区域: ${label}`);
    }
  };

  // 🔥 处理区域搜索事件
  const handleAreaSearch = (area: AreaNode, onSearchComplete?: () => void) => {
    try {
      // 设置区域筛选条件
      fillAreaFilter(area);
      
      // 执行搜索回调
      if (onSearchComplete) {
        onSearchComplete();
      } else if (onSearch) {
        onSearch();
      }
      
      console.log('区域筛选完成:', areaFilter.value);
    } catch (error) {
      console.error('区域筛选失败:', error);
      ElMessage.error('区域筛选失败，请重试');
    }
  };

  // 🔥 清空区域筛选
  const clearAreaFilter = () => {
    areaFilter.value = {
      province: '',
      city: '',
      district: ''
    };
    console.log('已清空区域筛选');
  };

  // 🔥 重置区域筛选（同clearAreaFilter，提供语义化的别名）
  const resetAreaFilter = () => {
    clearAreaFilter();
  };

  return {
    areaFilter,
    handleAreaSearch,
    clearAreaFilter,
    resetAreaFilter
  };
}

// 🔥 创建通用的搜索表单工具
export interface SearchFormData {
  [key: string]: any;
}

export interface UseSearchFormReturn<T extends SearchFormData> {
  searchForm: Ref<T>;
  handleSearch: () => void;
  handleReset: () => void;
  handleClearAll: () => void;
}

/**
 * 搜索表单的通用组合函数
 * @param initialData 初始搜索数据
 * @param onSearch 搜索回调函数
 * @param areaFilter 区域筛选数据（可选）
 * @returns 搜索表单相关的数据和方法
 */
export function useSearchForm<T extends SearchFormData>(
  initialData: T,
  onSearch: () => void,
  areaFilter?: Ref<AreaFilterData>
): UseSearchFormReturn<T> {
  
  // 🔥 修复：使用明确的类型标注
  const searchForm = ref<T>({ ...initialData }) as Ref<T>;

  // 🔥 执行搜索
  const handleSearch = () => {
    try {
      onSearch();
      console.log('搜索执行完成:', searchForm.value);
    } catch (error) {
      console.error('搜索执行失败:', error);
      ElMessage.error('搜索失败，请重试');
    }
  };

  // 🔥 重置搜索表单
  const handleReset = () => {
    searchForm.value = { ...initialData } as T;
    handleSearch();
    console.log('搜索表单已重置');
  };

  // 🔥 清空所有筛选条件
  const handleClearAll = () => {
    // 重置搜索表单
    searchForm.value = { ...initialData } as T;
    
    // 清空区域筛选（如果提供了）
    if (areaFilter) {
      areaFilter.value = {
        province: '',
        city: '',
        district: ''
      };
    }
    
    handleSearch();
    console.log('所有筛选条件已清空');
  };

  return {
    searchForm,
    handleSearch,
    handleReset,
    handleClearAll
  };
}

// 🔥 创建整合的页面搜索工具
export interface UsePageSearchReturn<T extends SearchFormData> extends UseAreaFilterReturn, UseSearchFormReturn<T> {
  // 合并后的返回类型
}

/**
 * 页面搜索的整合组合函数
 * @param initialSearchData 初始搜索数据
 * @param onSearch 搜索回调函数
 * @returns 整合的搜索工具
 */
export function usePageSearch<T extends SearchFormData>(
  initialSearchData: T,
  onSearch: () => void
): UsePageSearchReturn<T> {
  
  // 创建区域筛选工具
  const areaFilterTool = useAreaFilter(onSearch);
  
  // 创建搜索表单工具
  const searchFormTool = useSearchForm(initialSearchData, onSearch, areaFilterTool.areaFilter);
  
  // 🔥 重写handleClearAll以整合两个工具
  const handleClearAll = () => {
    searchFormTool.searchForm.value = { ...initialSearchData } as T;
    areaFilterTool.clearAreaFilter();
    onSearch();
    console.log('页面所有筛选条件已清空');
  };

  return {
    // 区域筛选相关
    ...areaFilterTool,
    // 搜索表单相关
    ...searchFormTool,
    // 重写的清空方法
    handleClearAll
  };
}