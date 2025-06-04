import { defineStore } from 'pinia';
import type { UserType, AreaNode } from '@/utils/area';
import { getAreaDataByUserType } from '@/utils/area';

interface AreaState {
  userType: UserType | null;
  areaData: AreaNode[];
  selectedArea: AreaNode | null;
}

export const useAreaStore = defineStore('area', {
  state: (): AreaState => ({
    userType: null,
    areaData: [],
    selectedArea: null
  }),

  getters: {
    // 获取当前用户可访问的区域数据
    getCurrentAreaData: (state) => state.areaData,
    
    // 获取当前用户类型
    getCurrentUserType: (state) => state.userType,
    
    // 判断是否有区域数据
    hasAreaData: (state) => state.areaData.length > 0
  },

  actions: {
    // 设置用户类型并加载对应数据
    setUserType(userType: UserType) {
      this.userType = userType;
      this.loadAreaData();
    },

    // 加载区域数据
    loadAreaData() {
      if (!this.userType) return;
      
      try {
        this.areaData = getAreaDataByUserType(this.userType);
        console.log('加载区域数据成功:', this.areaData);
      } catch (error) {
        console.error('加载区域数据失败:', error);
        this.areaData = [];
      }
    },

    // 设置选中的区域
    setSelectedArea(area: AreaNode) {
      this.selectedArea = area;
    },

    // 清空数据
    clearAreaData() {
      this.userType = null;
      this.areaData = [];
      this.selectedArea = null;
    }
  }
});