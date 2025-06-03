export default {
  path: "/cabinet-management",
  redirect: "/cabinet-management",
  meta: {
    icon: "ri/information-line",
    title: "箱柜管理",
    rank: 11
  },
  children: [
    {
      path: "/cabinet-management/cabinet",
      name: "CabinetInfo",
      component: () => import("@/views/cabinet-management/cabinet.vue"),
      meta: {
        title: "柜子管理",
      }
    },
    {
      path: "/cabinet-management/boxsSet",
      name: "BoxsSet",
      component: () => import("@/views/cabinet-management/boxsSet.vue"),
      meta: {
        title: "箱格分配",
      }
    },
    {
      path: "/cabinet-management/RFIDSet",
      name: "RFIDSet",
      component: () => import("@/views/cabinet-management/RFIDSet.vue"),
      meta: {
        title: "RFID配置",
      }
    }
  ]
} satisfies RouteConfigsTable;
