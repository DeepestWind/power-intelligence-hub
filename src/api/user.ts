import { http } from "@/utils/http";

export type UserResult = {
  code: number;
  msg: string;
  data: string;
  extra: {
    userVo: {
      id: any;
      userName: any;
      department: any;
      employeeId: any;
      userType: any;
      adminLevel: any;
      province: any;
      city: any;
      district: any;
      address: any;
    };
  };
};

export type RefreshTokenResult = {
  success: boolean;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>("post", "/api/auth/login", { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/api/refresh-token", {
    data
  });
};
