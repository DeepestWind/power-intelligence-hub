export default {
  path: "/test",
  redirect: "/test/index",
  meta: {
    icon: "ri/information-line",
    // showLink: false,
    title: "测试页面",
    rank: 10
  },
  children: [
    {
      path: "/test/index",
      name: "Test",
      component: () => import("@/views/test.vue"),
      meta: {
        title: "测试页面"
      }
    }
  ]
} satisfies RouteConfigsTable;
