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
      path: "/business-management/adjustment",
      name: "Adjustment",
      component: () => import("@/views/business-management/adjustment.vue"),
      meta: {
        title: "存件调整",
      }
    }, {
      path: "/business-management/doExcept",
      name: "DoExcept",
      component: () => import("@/views/business-management/doExcept.vue"),
      meta: {
        title: "反馈信息",
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
    {
      path: "/business-management/timeout",
      name: "Timeout",
      component: () => import("@/views/business-management/timeout.vue"),
      meta: {
        title: "超时未归还",
      }
    }
  ]
} satisfies RouteConfigsTable;
