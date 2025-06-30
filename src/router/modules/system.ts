export default {
  path: "/system",
  name: "System", 
  component: () => import("@/layout/index.vue"),
  meta: {
    title: "系统设置",
    icon: "ep:setting",
    rank: 5
  },
  children: [
    {
      path: "/system/cabinet",
      name: "CabinetManagement",
      component: () => import("@/views/system/cabinet.vue"),
      meta: {
        title: "柜子管理",
        icon: "ep:box"
      }
    },
    {
      path: "/system/user",
      name: "UserManagement", 
      component: () => import("@/views/system/user.vue"),
      meta: {
        title: "用户管理",
        icon: "ep:user"
      }
    },
    {
      path: "/system/items",
      name: "ItemsManagement",
      component: () => import("@/views/system/items.vue"),
      meta: {
        title: "物品管理", 
        icon: "ep:goods"
      }
    },
    {
      path: "/system/humiture",
      name: "HumitureSettings",
      component: () => import("@/views/system/humiture.vue"),
      meta: {
        title: "温湿度设置",
        icon: "ep:umbrella"
      }
    },
    {
      path: "/system/department",
      name: "DepartmentManagement",
      component: () => import("@/views/system/department.vue"),
      meta: {
        title: "部门管理",
        icon: "ep:office-building"
      }
    }
  ]
} satisfies RouteConfigsTable;