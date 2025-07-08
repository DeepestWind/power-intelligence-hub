import { defineStore } from "pinia";
import type { AreaNode } from "@/utils/area";
import { 
  getAreaDataByUserType,
  getAreaDataByUserPermission
 } from "@/utils/area";
import { storageLocal } from "@pureadmin/utils";
import { areaKey } from "@/utils/auth";
import { store } from "@/store";

interface AreaState {
  areaType: any; // 用户类型（对应adminLevel管理员级别），后期已转而使用usertype，但未测试是否可删除
  areaCode: any; // 存储了（区域代码）
  areaData: AreaNode[]; // 存储了（权限范围内的省市区数据）
  selectedArea: AreaNode | null; // 存储了（当前选中的区域）
  // 用户详细信息
  userType?: number | null;      // 用户类型（可选，向下兼容）
  province?: string;             // 省份名称
  city?: string;                 // 城市名称
  district?: string;             // 区域名称
  department?: string;           // 部门信息
}

export const useAreaStore = defineStore("area", {
  state: (): AreaState => ({
    areaType: storageLocal().getItem<AreaState>(areaKey)?.areaType ?? "",
    areaCode: storageLocal().getItem<AreaState>(areaKey)?.areaCode ?? "",
    areaData: [],
    selectedArea: null,
    // 新增字段 - 从localStorage恢复或设置默认值
    userType: storageLocal().getItem<AreaState>(areaKey)?.userType ?? null,
    province: storageLocal().getItem<AreaState>(areaKey)?.province ?? "",
    city: storageLocal().getItem<AreaState>(areaKey)?.city ?? "",
    district: storageLocal().getItem<AreaState>(areaKey)?.district ?? "",
    department: storageLocal().getItem<AreaState>(areaKey)?.department ?? "",
  }),

  getters: {
    // 获取当前用户可访问的区域数据
    getCurrentAreaData: state => state.areaData,
    // 获取当前用户类型
    getCurrentAreaType: state => state.areaType,
    getCurrentAreaCode: state => state.areaCode,
    // 判断是否有区域数据
    hasAreaData: state => state.areaData.length > 0,

    // 新增 getters
    getCurrentUserType: state => state.userType,
    getCurrentProvince: state => state.province || "",
    getCurrentCity: state => state.city || "",
    getCurrentDistrict: state => state.district || "",
    getCurrentDepartment: state => state.department || "",
    // 组合信息
    getFullAddress: state => {
      return [state.province, state.city, state.district]
        .filter(Boolean)
        .join(' ');
    },
    getUserSummary: state => ({
      userType: state.userType,
      adminLevel: state.areaType,
      address: [state.province, state.city, state.district].filter(Boolean).join(' '),
      department: state.department
    })

  },

  actions: {
    SET_AreaType(areaType: any) {
      this.areaType = areaType;
    },
    SET_AreaCode(areaCode: any) {
      this.areaCode = areaCode;
    },

    // 新增 actions
    SET_UserType(userType: number) {
      this.userType = userType;
    },
    SET_Province(province: string) {
      this.province = province;
    },
    SET_City(city: string) {
      this.city = city;
    },
    SET_District(district: string) {
      this.district = district;
    },
    SET_Department(department: string) {
      this.department = department;
    },
    // 批量设置方法
    setUserInfo(userInfo: {
      userType?: number;
      province?: string;
      city?: string;
      district?: string;
      department?: string;
    }) {
      if (userInfo.userType !== undefined) this.userType = userInfo.userType;
      if (userInfo.province !== undefined) this.province = userInfo.province;
      if (userInfo.city !== undefined) this.city = userInfo.city;
      if (userInfo.district !== undefined) this.district = userInfo.district;
      if (userInfo.department !== undefined) this.department = userInfo.department;
      
      // 更新localStorage
      this.updateStorage();
    },
    // 更新localStorage的方法
    updateStorage() {
      const storeData = {
        areaType: this.areaType,
        areaCode: this.areaCode,
        userType: this.userType,
        province: this.province,
        city: this.city,
        district: this.district,
        department: this.department
      };
      storageLocal().setItem(areaKey, storeData);
    },

    // 新增：设置区域数据
    setAreaData(areaData: AreaNode[]) {
      this.areaData = areaData;
      console.log('Store中设置区域数据:', areaData);
    },    

    // 修改现有的 setUserType 方法
    setUserType(areaType, areaCode, additionalInfo?: {
      userType?: number;
      province?: string;
      city?: string;
      district?: string;
      department?: string;
    }) {
      this.SET_AreaType(areaType);
      this.SET_AreaCode(areaCode);
      
      // 设置额外信息
      if (additionalInfo) {
        this.setUserInfo(additionalInfo);
      }
      
      // 更新localStorage
      this.updateStorage();
      
      console.log('设置用户信息:', {
        areaType,
        areaCode,
        additionalInfo
      });
      
      this.loadAreaData(areaType, areaCode);
    },

    // 加载区域数据
    loadAreaData(type, code) {
      try {
        console.log('开始加载区域数据:', { 
          type, 
          code, 
          userType: this.userType,
          province: this.province,
          city: this.city,
          district: this.district 
        });
        
        // 修改：直接传递参数，避免循环依赖
        const areaData = getAreaDataByUserPermission(
          this.userType,
          type,
          code
        );
        
        this.setAreaData(areaData);
        
        console.log('成功加载区域数据:', areaData);
        
        // 根据用户类型设置不同的提示
        if (this.userType === 2) {
          console.log('超级管理员：已加载全部区域数据', areaData.length, '个省份');
        } else {
          console.log('普通管理员：已加载权限范围内的区域数据', areaData.length, '个区域');
        }
        
      } catch (error) {
        console.error("加载区域数据失败:", error);
        this.areaData = [];
      }
    },
    // 强制重新加载区域数据
    reloadAreaData() {
      this.loadAreaData(this.areaType, this.areaCode);
    },

    // 设置选中的区域
    setSelectedArea(area: AreaNode) {
      this.selectedArea = area;
    },

    // 修改清空方法
    clearAreaData() {
      this.areaType = null;
      this.areaCode = null;
      this.areaData = [];
      this.selectedArea = null;
      this.userType = null;
      this.province = "";
      this.city = "";
      this.district = "";
      this.department = "";
      
      // 清空localStorage
      storageLocal().removeItem(areaKey);
    }
  }
});
export function useAreaStoreHook() {
  return useAreaStore(store);
}
