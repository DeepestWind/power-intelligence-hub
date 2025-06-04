export default {
  path: "/sysMangement",
  redirect: "/sysMangement",
  meta: {
    icon: "ri/information-line",
    showLink: true,
    title: "系统管理",
    rank: 15
  },
  children: [
    {
      path: "/sysMangement/userMng",
      name: "UserManager",
      component: () => import("@/views/sysMangement/userMng.vue"),
      meta: {
        title: "用户管理"
      }
    }
  ]
} satisfies RouteConfigsTable;
