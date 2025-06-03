export default {
  path: "/business-management",
  redirect: "/business-management",
  meta: {
    icon: "ri/information-line",
    title: "业务管理",
    rank: 14
  },
  children: [
    {
      path: "/business-management/add",
      name: "Add",
      component: () => import("@/views/business-management/add.vue"),
      meta: {
        title: "上架记录",
      }
    },
    {
      path: "/business-management/useInfo",
      name: "UseInfo",
      component: () => import("@/views/business-management/useInfo.vue"),
      meta: {
        title: "领用管理",
      }
    },
    {
      path: "/business-management/return",
      name: "Adjustment",
      component: () => import("@/views/business-management/return.vue"),
      meta: {
        title: "归还记录",
      }
    }, 
      {
      path: "/business-management/timeout",
      name: "Timeout",
      component: () => import("@/views/business-management/timeout.vue"),
      meta: {
        title: "超时记录",
      }
    },
    {
      path: "/business-management/remove",
      name: "Remove",
      component: () => import("@/views/business-management/remove.vue"),
      meta: {
        title: "下架记录",
      }
    }, {
      path: "/business-management/useRec",
      name: "UseRecord",
      component: () => import("@/views/business-management/useRec.vue"),
      meta: {
        title: "使用分析",
      }
    }, {
      path: "/business-management/inStoreReport",
      name: "InStoreReport",
      component: () => import("@/views/business-management/inStoreReport.vue"),
      meta: {
        title: "在库分析",
      }
    },

  ]
} satisfies RouteConfigsTable;
