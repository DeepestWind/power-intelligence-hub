import { http } from "@/utils/http";

type Result = {
  success: boolean;
  data: Array<any>;
};

// 手动预设管理员路由数据
const mockAsyncRoutes = 
{
    "success": true,
    "data": [
        {
            "path": "/permission",
            "meta": {
                "title": "权限管理",
                "icon": "ep:lollipop",
                "rank": 10
            },
            "children": [
                {
                    "path": "/permission/page/index",
                    "name": "PermissionPage",
                    "meta": {
                        "title": "页面权限",
                        "roles": [
                            "admin",
                            "common"
                        ]
                    }
                },
                {
                    "path": "/permission/button",
                    "meta": {
                        "title": "按钮权限",
                        "roles": [
                            "admin",
                            "common"
                        ]
                    },
                    "children": [
                        {
                            "path": "/permission/button/router",
                            "component": "permission/button/index",
                            "name": "PermissionButtonRouter",
                            "meta": {
                                "title": "路由返回按钮权限",
                                "auths": [
                                    "permission:btn:add",
                                    "permission:btn:edit",
                                    "permission:btn:delete"
                                ]
                            }
                        },
                        {
                            "path": "/permission/button/login",
                            "component": "permission/button/perms",
                            "name": "PermissionButtonLogin",
                            "meta": {
                                "title": "登录接口返回按钮权限"
                            }
                        }
                    ]
                }
            ]
        }
    ]
}

// export const getAsyncRoutes = () => {
//   return http.request<Result>("get", "/api/get-async-routes");
// };

export const getAsyncRoutes = () => {
  // 模拟异步请求，返回预设的数据

  return new Promise<Result>((resolve) => {
    setTimeout(() => {
      resolve(mockAsyncRoutes);
    }, 100); // 模拟100ms的网络延迟
  });
  
  // 如果以后要恢复真实的HTTP请求，取消注释下面这行，注释掉上面的Promise
  // return http.request<Result>("get", "/api/get-async-routes");
};