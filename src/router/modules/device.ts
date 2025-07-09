export default {
  path: "/device",
  name: "Device", 
  component: () => import("@/layout/index.vue"),
  meta: {
    title: "设备管理",
    icon: "ep:monitor",
    rank: 6
  },
  children: [
    {
      path: "/device/purchase",
      name: "PurchaseRecord",
      component: () => import("@/views/device/purchase.vue"),
      meta: {
        title: "购买记录",
        icon: "ep:shopping-cart"
      }
    },
    {
      path: "/device/shelving",
      name: "ShelvingRecord",
      component: () => import("@/views/device/shelving.vue"),
      meta: {
        title: "上架记录",
        icon: "ep:upload"
      }
    },
    {
      path: "/device/requisition",
      name: "RequisitionRecord", 
      component: () => import("@/views/device/requisition.vue"),
      meta: {
        title: "领用记录",
        icon: "ep:document-checked"
      }
    },
    {
      path: "/device/return",
      name: "ReturnRecord",
      component: () => import("@/views/device/return.vue"),
      meta: {
        title: "归还记录", 
        icon: "ep:document-copy"
      }
    },
    {
      path: "/device/maintain",
      name: "MaintainRecord",
      component: () => import("@/views/device/maintain.vue"),
      meta: {
        title: "维修记录", 
        icon: "ep:document-checked"
      }
    },
    {
      path: "/device/overtime",
      name: "OvertimeRecord",
      component: () => import("@/views/device/overtime.vue"),
      meta: {
        title: "超时记录",
        icon: "ep:warning"
      }
    },
    {
      path: "/device/offshelving",
      name: "OffshelvingRecord",
      component: () => import("@/views/device/offshelving.vue"),
      meta: {
        title: "下架记录",
        icon: "ep:download"
      }
    },
    {
      path: "/device/environmental",
      name: "EnvironmentalRecord",
      component: () => import("@/views/device/environmental.vue"),
      meta: {
        title: "环控记录",
        icon: "ep:aim"
      }
    }
  ]
} satisfies RouteConfigsTable;