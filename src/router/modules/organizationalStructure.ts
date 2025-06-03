export default {
  path: "/organizational-structure",
  redirect: "/organizational-structure",
  meta: {
    icon: "ri/information-line",
    // showLink: false,
    title: "组织架构",
    rank: 10
  },
  children: [
    {
      path: "/organizational-structure/department",
      name: "DepartmentInfo",
      component: () => import("@/views/organizational-structure/department.vue"),
      meta: {
        title: "部门信息",
        // showParent: true
      }
    },
    {
      path: "/organizational-structure/customerUser",
      name: "UserInfo",
      component: () => import("@/views/organizational-structure/customerUser.vue"),
      meta: {
        title: "所辖用户",
        // showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
