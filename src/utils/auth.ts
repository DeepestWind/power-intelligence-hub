import Cookies from "js-cookie";
import { useUserStoreHook } from "@/store/modules/user";
import { storageLocal, isString, isIncludeAllChildren } from "@pureadmin/utils";

export interface UserInfo<T> {
  id: any;
  /** 用户名 */
  userName: any;
  /** 部门 */
  department: any;
  /** 卡号 */
  employeeId: any;
  /** 用户类型 */
  userType: any;
  adminLevel: any;
  province: any;
  city: any;
  district: any;
  address: any;
}

export const userKey = "user-info";
export const TokenKey = "authorized-token";
/**
 * 通过`multiple-tabs`是否在`cookie`中，判断用户是否已经登录系统，
 * 从而支持多标签页打开已经登录的系统后无需再登录。
 * 浏览器完全关闭后`multiple-tabs`将自动从`cookie`中销毁，
 * 再次打开浏览器需要重新登录系统
 * */
export const multipleTabsKey = "multiple-tabs";

/** 获取`token` */
export function getToken(): UserInfo<number> {
  // 此处与`TokenKey`相同，此写法解决初始化时`Cookies`中不存在`TokenKey`报错
  return Cookies.get(TokenKey)
    ? JSON.parse(Cookies.get(TokenKey))
    : storageLocal().getItem(userKey);
}

/**
 * @description 设置`token`以及一些必要信息并采用无感刷新`token`方案
 * 无感刷新：后端返回`accessToken`（访问接口使用的`token`）、`refreshToken`（用于调用刷新`accessToken`的接口时所需的`token`，`refreshToken`的过期时间（比如30天）应大于`accessToken`的过期时间（比如2小时））、`expires`（`accessToken`的过期时间）
 * 将`accessToken`、`expires`、`refreshToken`这三条信息放在key值为authorized-token的cookie里（过期自动销毁）
 * 将`avatar`、`username`、`nickname`、`roles`、`permissions`、`refreshToken`、`expires`这七条信息放在key值为`user-info`的localStorage里（利用`multipleTabsKey`当浏览器完全关闭后自动销毁）
 */
export function setToken(data: UserInfo<Date>, token: any) {
  const accessToken = token;
  const { isRemembered, loginDay } = useUserStoreHook();
  const cookieString = JSON.stringify({ accessToken });
  Cookies.set(TokenKey, cookieString);

  Cookies.set(
    multipleTabsKey,
    "true",
    isRemembered
      ? {
          expires: loginDay
        }
      : {}
  );

  function setUserKey({ id, userName, department, employeeId, userType }) {
    useUserStoreHook().SET_ID(id);
    useUserStoreHook().SET_USERNAME(userName);
    useUserStoreHook().SET_department(department);
    useUserStoreHook().SET_employeeId(employeeId);
    useUserStoreHook().SET_userType(userType);
    storageLocal().setItem(userKey, {
      id,
      userName,
      department,
      employeeId,
      userType
    });
  }

  if (data.userType) {
    const { userName, userType } = data;
    setUserKey({
      id: data?.id ?? 0,
      userName,
      department: data?.department ?? "",
      employeeId: data?.employeeId ?? "",
      userType
    });
  } else {
    const id = storageLocal().getItem<UserInfo<number>>(userKey)?.id ?? 0;
    const userName =
      storageLocal().getItem<UserInfo<number>>(userKey)?.userName ?? "";
    const department =
      storageLocal().getItem<UserInfo<number>>(userKey)?.department ?? "";
    const employeeId =
      storageLocal().getItem<UserInfo<number>>(userKey)?.employeeId ?? "";
    const userType =
      storageLocal().getItem<UserInfo<number>>(userKey)?.userType ?? 0;
    setUserKey({
      id,
      userName,
      department,
      employeeId,
      userType
    });
  }
}

/** 删除`token`以及key值为`user-info`的localStorage信息 */
export function removeToken() {
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
  storageLocal().removeItem(userKey);
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
  return "Bearer " + token;
};

/** 是否有按钮级别的权限（根据登录接口返回的`permissions`字段进行判断）*/
export const hasPerms = (value: string | Array<string>): boolean => {
  if (!value) return false;
  // const allPerms = "*:*:*";
  const { userType } = useUserStoreHook();
  if (!userType) return false;
  if (userType > 0) return true;
  const isAuths = isString(value)
    ? userType == value
    : isIncludeAllChildren(value, userType);
  return isAuths ? true : false;
};
