export default {
  path: "/cabinet-management",
  redirect: "/cabinet-management",
  meta: {
    icon: "ri/information-line",
    title: "系统设置",
    rank: 11
  },
  children: [
    {
      path: "/cabinet-management/cabinet",
      name: "cabinet",
      component: () => import("@/views/cabinet-management/cabinet.vue"),
      meta: {
        title: "柜子管理",
      }
    },
    {
      path: "/cabinet-management/user",
      name: "user",
      component: () => import("@/views/cabinet-management/user.vue"),
      meta: {
        title: "用户管理",
      }
    },
    {
      path: "/cabinet-management/goods",
      name: "goods",
      component: () => import("@/views/cabinet-management/goods.vue"),
      meta: {
        title: "物品管理",
      }
    },
    {
      path: "/cabinet-management/TaH",
      name: "TaH",
      component: () => import("@/views/cabinet-management/TaH.vue"),
      meta: {
        title: "温湿度设置",
      }
    }
  ]
} satisfies RouteConfigsTable;
