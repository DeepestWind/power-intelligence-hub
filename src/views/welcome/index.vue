<script setup lang="ts">
import { computed } from 'vue';
import { useUserStoreHook } from '@/store/modules/user';
import { useAreaStore } from '@/store/modules/area';
import { useNav } from '@/layout/hooks/useNav';
import { 
  //Building, 
  CreditCard, 
  Location, 
  User, 
  CircleCheck 
} from '@element-plus/icons-vue';

// 获取用户信息
const userStore = useUserStoreHook();
const areaStore = useAreaStore();

// 从 useNav 中获取头像
const { userAvatar } = useNav();

// 用户信息
const userInfo = computed(() => userStore.getCurrentUserInfo);


// 格式化用户类型
const formatUserType = (userType: string | number) => {
  if (userType === null || userType === undefined || userType === '') return '-';
  
  // 转换为数字进行判断
  const typeNumber = Number(userType);
  
  const typeMap: Record<number, string> = {
    0: '普通用户',
    1: '管理员',
    2: '超级管理员'
  };
  
  return typeMap[typeNumber] || '-';
};

// 格式化地区信息
const formatAreaInfo = computed(() => {
  const province = areaStore.getCurrentProvince;
  const city = areaStore.getCurrentCity;
  const district = areaStore.getCurrentDistrict;
  
  // 构建地区字符串
  const parts = [province, city, district].filter(Boolean);
  
  if (parts.length === 0) return '-';
  
  return parts.join('');
});
</script>





<template>
  <div class="dashboard-container">
    <div class="dashboard-layout">
      <!-- 左侧区域 -->
      <div class="left-column">
        <!-- 左上方横框 - 用户信息 -->
        <div class="panel user-panel">
          <div class="user-info-content">
            <!-- 第一竖条：头像和名字 -->
            <div class="user-section avatar-section">
              <div class="user-avatar">
                <el-avatar :size="80" :src="userAvatar">
                  {{ userInfo.userName?.substring(0, 1) || 'U' }}
                </el-avatar>
              </div>
              <div class="user-name-section">
                <h2 class="user-name">{{ userInfo.userName || '-' }}</h2>
              </div>
            </div>
            
            <!-- 第二竖条：级别、部门和工号 -->
            <div class="user-section info-section">
              <div class="section-title">
                <el-icon><User /></el-icon>
                <span>基本信息</span>
              </div>
              <div class="info-list">
                <div class="info-item">
                  <div class="info-label">级别</div>
                  <div class="info-value user-type">{{ formatUserType(userInfo.userType) }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">部门</div>
                  <div class="info-value">{{ userInfo.department || '-' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">工号</div>
                  <div class="info-value">{{ userInfo.employeeId || '-' }}</div>
                </div>
              </div>
            </div>
            
            <!-- 第三竖条：地区信息 -->
            <div class="user-section location-section">
              <div class="location-list">
                <div class="location-item">
                  <div class="location-label">省份：{{ areaStore.getCurrentProvince || '-' }}</div>
                </div>
                <div class="location-item">
                  <div class="location-label">城市：{{ areaStore.getCurrentCity || '-' }}</div>
                </div>
                <div class="location-item">
                  <div class="location-label">区域：{{ areaStore.getCurrentDistrict || '-' }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 左下方横框 -->
        <div class="panel chart-panel">
          <!-- 图表将在这里展示 -->
        </div>
      </div>
      
      <!-- 右侧区域 -->
      <div class="right-column">
        <!-- 右侧竖框 -->
        <div class="panel notification-panel">
          <!-- 消息通知将在这里展示 -->
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-container {
  width: 100%;
  height: 100%;
  padding: 16px;
  background-color: #f0f2f5;
  overflow: auto;
}

.dashboard-layout {
  display: flex;
  width: 100%;
  height: 100%;
  gap: 16px;
}

.left-column {
  flex: 7;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.right-column {
  flex: 3;
}

.panel {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f2f5;
}

.user-panel {
  height: 200px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
  }
}

.chart-panel {
  flex: 1;
}

.notification-panel {
  height: 100%;
}

/* 用户信息样式 */
.user-info-content {
  display: flex;
  height: 100%;
  gap: 24px;
  position: relative;
  z-index: 1;
}

.user-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  
  &:not(:last-child) {
    border-right: 1px solid rgba(255, 255, 255, 0.2);
    padding-right: 24px;
  }
}

/* 头像区域样式 */
.avatar-section {
  align-items: center;
  justify-content: center;
  text-align: center;
  
  .user-avatar {
    margin-bottom: 16px;
    
    .el-avatar {
      border: 4px solid rgba(255, 255, 255, 0.3);
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
  }
  
  .user-name {
    margin: 0 0 12px 0;
    font-size: 22px;
    font-weight: 600;
    color: white;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
}

/* 基本信息区域样式 */
.info-section {
  justify-content: flex-start;
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    font-weight: 500;
    
    .el-icon {
      font-size: 16px;
    }
  }
  
  .info-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    .info-label {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 400;
    }
    
    .info-value {
      font-size: 16px;
      color: white;
      font-weight: 500;
      
      &.user-type {
        background: rgba(255, 255, 255, 0.2);
        padding: 4px 12px;
        border-radius: 16px;
        font-size: 14px;
        display: inline-block;
        width: fit-content;
      }
    }
  }
}

/* 地区信息样式 */
.location-section {
  justify-content: flex-start;
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    font-weight: 500;
    
    .el-icon {
      font-size: 16px;
    }
  }
  
  .location-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .location-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    .location-label {
      font-size: 16px;
      color: white;
      font-weight: 500;
      padding: 8px 12px;
    }
    
  }
}
</style>