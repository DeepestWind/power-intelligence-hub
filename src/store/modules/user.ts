import { defineStore } from "pinia";
import { generateAreaCode, transformPcaToTree } from "@/utils/area";

import {
  type userType,
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal
} from "../utils";
import {
  type UserResult,
  // type RefreshTokenResult,
  getLogin
  // refreshTokenApi
} from "@/api/user";
import { useMultiTagsStoreHook } from "./multiTags";
import { type UserInfo, setToken, removeToken, userKey } from "@/utils/auth";

export const useUserStore = defineStore("pure-user", {
  state: (): userType => ({
    // 头像
    id: storageLocal().getItem<UserInfo<number>>(userKey)?.id ?? "",
    // 用户名
    userName: storageLocal().getItem<UserInfo<number>>(userKey)?.userName ?? "",
    //部门
    department:
      storageLocal().getItem<UserInfo<number>>(userKey)?.department ?? "",
    // 卡号
    employeeId:
      storageLocal().getItem<UserInfo<number>>(userKey)?.employeeId ?? "",
    // 页面级别权限
    userType: storageLocal().getItem<UserInfo<number>>(userKey)?.userType ?? "",
    // 是否勾选了登录页的免登录
    isRemembered: false,
    // 登录页的免登录存储几天，默认7天
    loginDay: 7
  }),
  actions: {
    /** 存储头像 */
    SET_ID(id: any) {
      this.id = id;
    },
    /** 存储用户名 */
    SET_USERNAME(userName: any) {
      this.userName = userName;
    },
    /** 存储昵称 */
    SET_department(department: any) {
      this.department = department;
    },
    /** 存储卡号 */
    SET_employeeId(employeeId: any) {
      this.employeeId = employeeId;
    },
    /** 存储级别权限 */
    SET_userType(userType: any) {
      this.userType = userType;
    },
    /** 存储是否勾选了登录页的免登录 */
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    /** 设置登录页的免登录存储几天 */
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
    },
    /** 登入 */
    async loginByUsername(data) {
      return new Promise<UserResult>((resolve, reject) => {
        getLogin(data)
          .then(async data => {
            if (data?.code == 200) {
              setToken(data.extra.userVo, data.data);

              // 假设后端返回的用户信息包含区域权限
              if (data.extra.userVo.adminLevel) {
                const { useAreaStore } = await import("@/store/modules/area");
                const areaStore = useAreaStore();
                const allData = transformPcaToTree();
                const areaCode = generateAreaCode(
                  allData,
                  data.extra.userVo.province,
                  data.extra.userVo.city,
                  data.extra.userVo.district
                );
                //areaStore.setUserType(data.extra.userVo.adminLevel, areaCode);
                // 🔥 使用新的方法，传入完整信息
                areaStore.setUserType(
                  data.extra.userVo.adminLevel, 
                  areaCode,
                  {
                    userType: data.extra.userVo.userType,
                    province: data.extra.userVo.province || '',
                    city: data.extra.userVo.city || '',
                    district: data.extra.userVo.district || '',
                    department: data.extra.userVo.department || ''
                  }
                );
              }
            }
            resolve(data);
          })
          .catch(error => {
            reject(error);
          });
      });
    },
    /** 前端登出（不调用接口） */
    logOut() {
      this.userName = "";
      this.userType = "";
      this.employeeId = "";
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    }
    /** 刷新`token` */
    // async handRefreshToken(data) {
    //   return new Promise<RefreshTokenResult>((resolve, reject) => {
    //     refreshTokenApi(data)
    //       .then(data => {
    //         if (data) {
    //           setToken(data.data);
    //           resolve(data);
    //         }
    //       })
    //       .catch(error => {
    //         reject(error);
    //       });
    //   });
    // }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
