export default {
  path: "/itemsOrTools",
  redirect: "/itemsOrTools",
  meta: {
    icon: "ri/information-line",
    title: "物品/工具",
    rank: 13
  },
  children: [
    {
      path: "/itemsOrTools/MotorBind",
      name: "MBind",
      component: () => import("@/views/itemsOrTools/MBind.vue"),
      meta: {
        title: "箱格绑定",
      }
    },
    {
      path: "/itemsOrTools/MList",
      name: "MList",
      component: () => import("@/views/itemsOrTools/MList.vue"),
      meta: {
        title: "物品清单",
      }
    },
    {
      path: "/itemsOrTools/RFIDList",
      name: "RFIDList",
      component: () => import("@/views/itemsOrTools/RFIDList.vue"),
      meta: {
        title: "RFID绑定清单",
      }
    },
    {
      path: "/itemsOrTools/MClass",
      name: "MClass",
      component: () => import("@/views/itemsOrTools/MClass.vue"),
      meta: {
        title: "物品分类",
      }
    }
  ]
} satisfies RouteConfigsTable;
