export default {
  path: "/bns",
  redirect: "/bns",
  meta: {
    icon: "ri/information-line",
    title: "温湿度控制",
    rank: 12
  },
  children: [
    {
      path: "/bns/humiture",
      name: "HumitureInfo",
      component: () => import("@/views/bns/humiture.vue"),
      meta: {
        title: "温湿度参数",
      }
    },
    {
      path: "/bns/motor",
      name: "Motor",
      component: () => import("@/views/bns/motor.vue"),
      meta: {
        title: "点击设置",
      }
    },
    {
      path: "/bns/motorRec",
      name: "MotorRec",
      component: () => import("@/views/bns/motorRec.vue"),
      meta: {
        title: "RFID配置",
      }
    }
  ]
} satisfies RouteConfigsTable;
