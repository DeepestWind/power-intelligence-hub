import { defineStore } from "pinia";
import type { AreaNode } from "@/utils/area";
import { getAreaDataByUserType } from "@/utils/area";
import { storageLocal } from "@pureadmin/utils";
import { areaKey } from "@/utils/auth";
import { store } from "@/store";

interface AreaState {
  areaType: any;
  areaCode: any;
  areaData: AreaNode[];
  selectedArea: AreaNode | null;
}

export const useAreaStore = defineStore("area", {
  state: (): AreaState => ({
    areaType: storageLocal().getItem<AreaState>(areaKey)?.areaType ?? "",
    areaCode: storageLocal().getItem<AreaState>(areaKey)?.areaCode ?? "",
    areaData: [],
    selectedArea: null
  }),

  getters: {
    // 获取当前用户可访问的区域数据
    getCurrentAreaData: state => state.areaData,

    // 获取当前用户类型
    getCurrentAreaType: state => state.areaType,
    getCurrentAreaCode: state => state.areaCode,

    // 判断是否有区域数据
    hasAreaData: state => state.areaData.length > 0
  },

  actions: {
    SET_AreaType(areaType: any) {
      this.areaType = areaType;
    },
    SET_AreaCode(areaCode: any) {
      this.areaCode = areaCode;
    },

    // 新增：设置区域数据
    setAreaData(areaData: AreaNode[]) {
      this.areaData = areaData;
      console.log('Store中设置区域数据:', areaData);
    },    

    // 设置用户类型并加载对应数据
    setUserType(areaType, areaCode) {
      function setAreaKey() {
        useAreaStoreHook().SET_AreaType(areaType);
        useAreaStoreHook().SET_AreaCode(areaCode);
        storageLocal().setItem(areaKey, {
          areaType,
          areaCode
        });
      }

      setAreaKey();
      console.log(this.areaCode);
      this.loadAreaData(areaType, areaCode);
    },

    // 加载区域数据
    loadAreaData(type, code) {
      if (!code) {
        console.warn('区域代码为空，无法加载数据');
        return;
      }
      try {
        const areaData = getAreaDataByUserType(type, code);
        this.setAreaData(areaData); // 使用新的 setAreaData 方法
        console.log('成功加载区域数据:', areaData);
      } catch (error) {
        console.error("加载区域数据失败:", error);
        this.areaData = [];
      }
    },

    // 设置选中的区域
    setSelectedArea(area: AreaNode) {
      this.selectedArea = area;
    },

    // 清空数据
    clearAreaData() {
      this.areaType = null;
      this.areaCode = null;
      this.areaData = [];
      this.selectedArea = null;
    }
  }
});
export function useAreaStoreHook() {
  return useAreaStore(store);
}
