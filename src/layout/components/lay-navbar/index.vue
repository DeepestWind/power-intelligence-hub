<script setup lang="ts">
import { computed } from "vue";
import { useNav } from "@/layout/hooks/useNav";
import LaySearch from "../lay-search/index.vue";
//import LayNotice from "../lay-notice/index.vue"; //移除通知组件
import LayNavMix from "../lay-sidebar/NavMix.vue";
import LaySidebarFullScreen from "../lay-sidebar/components/SidebarFullScreen.vue";
import LaySidebarBreadCrumb from "../lay-sidebar/components/SidebarBreadCrumb.vue";
import LaySidebarTopCollapse from "../lay-sidebar/components/SidebarTopCollapse.vue";

import LogoutCircleRLine from "~icons/ri/logout-circle-r-line";
import Setting from "~icons/ri/settings-3-line";

import { useUserStoreHook } from "@/store/modules/user";// 添加用户store

const {
  layout,
  device,
  logout,
  onPanel,
  pureApp,
  username,
  userAvatar,
  avatarsStyle,
  toggleSideBar
} = useNav();

// 获取用户信息
const userStore = useUserStoreHook();

// 获取当前登录用户的真实姓名
const currentUserName = computed(() => {
  // 使用store中的getter方法获取用户信息
  const userName = userStore.userName;
  if (userName) {
    return userName;
  }
  
  // 如果没有，使用username作为兜底
  return username || "用户";
});



</script>

<template>
  <div class="navbar bg-[#fff] shadow-xs shadow-[rgba(0,21,41,0.08)]">
    <LaySidebarTopCollapse
      v-if="device === 'mobile'"
      class="hamburger-container"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />

    <!-- 面包屑导航 -->
    <LaySidebarBreadCrumb
      v-if="layout !== 'mix' && device !== 'mobile'"
      class="breadcrumb-container"
    />

    <!-- 居中显示的系统名 -->
    <div class="center-title">
      <span>电力智能柜后台管理系统——运营端</span>
    </div>
    
    <LayNavMix v-if="layout === 'mix'" />

    <div v-if="layout === 'vertical'" class="vertical-header-right">
      <!-- 菜单搜索 -->
      <LaySearch id="header-search" />
      <!-- 全屏 -->
      <LaySidebarFullScreen id="full-screen" />
      <!-- 移除消息通知 -->
      <!-- <LayNotice id="header-notice" /> -->

      <!-- 退出登录 -->
      <el-dropdown trigger="click">
        <span class="el-dropdown-link navbar-bg-hover select-none">
          <img :src="userAvatar" :style="avatarsStyle" />
          <!-- 在头像右侧显示用户信息 -->
          <div class="user-info">
            <div class="user-name">{{ currentUserName }}</div>
          </div>
        </span>
        <template #dropdown>
          <el-dropdown-menu class="logout">
            <el-dropdown-item @click="logout">
              <IconifyIconOffline
                :icon="LogoutCircleRLine"
                style="margin: 5px"
              />
              退出系统
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <span
        class="set-icon navbar-bg-hover"
        title="打开系统配置"
        @click="onPanel"
      >
        <IconifyIconOffline :icon="Setting" />
      </span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navbar {
  width: 100%;
  height: 48px;
  overflow: hidden;

  // 居中文字样式
  .center-title {
    position: absolute;
    left: 50%;
    top: 35%;
    transform: translate(-50%, -50%);
    z-index: 1;
    
    span {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      white-space: nowrap;
    }
  }

  .hamburger-container {
    float: left;
    height: 100%;
    line-height: 48px;
    cursor: pointer;
  }

  .vertical-header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 280px;
    height: 48px;
    color: #000000d9;

    .el-dropdown-link {
      display: flex;
      align-items: center;
      height: 48px;
      padding: 8px 12px;
      color: #000000d9;
      cursor: pointer;
      border-radius: 6px;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f5f5;
      }

      img {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid #e5e7eb;
        margin-right: 8px;
      }

      .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        min-width: 0;

        .user-name {
          font-size: 14px;
          font-weight: 500;
          color: #1f2937;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }

        .user-role {
          font-size: 12px;
          color: #6366f1;
          font-weight: 400;
          line-height: 1.2;
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }
      }
    }

    .set-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      cursor: pointer;
      border-radius: 6px;
      margin-left: 8px;

      &:hover {
        background-color: #f5f5f5;
      }
    }
  }

  .breadcrumb-container {
    float: left;
    margin-left: 16px;
  }
}

.logout {
  min-width: 120px;

  ::v-deep(.el-dropdown-menu__item) {
    display: inline-flex;
    flex-wrap: wrap;
    min-width: 100%;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .navbar {
    .center-title {
      display: none;
    }
    
    .vertical-header-right {
      .el-dropdown-link {
        .user-info {
          .user-role {
            display: none; // 小屏幕隐藏角色信息
          }
        }
      }
    }
  }
}
</style>
