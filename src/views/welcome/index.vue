<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStoreHook } from '@/store/modules/user';
import { useAreaStore } from '@/store/modules/area';
import { useNav } from '@/layout/hooks/useNav';
import { 
  //Building, 
  CreditCard, 
  Location, 
  User, 
  CircleCheck,
  Warning 
} from '@element-plus/icons-vue';
import { 
  getOvertimeRecordsList as getOvertimeRecordsListApi,
  calculateOvertimeDuration,
  formatDateTime,
  type OvertimeRecordData,
  type OvertimeRecordQueryParams
} from '@/api/overtime';

// 获取用户信息
const userStore = useUserStoreHook();
const areaStore = useAreaStore();
// 从 useNav 中获取头像
const { userAvatar } = useNav();
// 用户信息
const userInfo = computed(() => userStore.getCurrentUserInfo);

// 超时记录相关数据
const overtimeLoading = ref(false);
const overtimeData = ref<OvertimeRecordData[]>([]);


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

// 获取超时记录列表
const getOvertimeRecords = async () => {
  overtimeLoading.value = true;
  try {
    const params: OvertimeRecordQueryParams = {
      pageNum: 1,
      pageSize: 10 // 只显示前10条
    };
    
    const response = await getOvertimeRecordsListApi(params);
    
    if (response.code === 200) {
      overtimeData.value = response.data.records;
      console.log('获取超时记录成功:', overtimeData.value);
    } else {
      ElMessage.error(response.msg || '获取超时记录失败');
    }
  } catch (error) {
    console.error('获取超时记录失败:', error);
    ElMessage.error('获取超时记录失败，请检查网络连接');
  } finally {
    overtimeLoading.value = false;
  }
};

// 在生命周期钩子中调用
onMounted(() => {
  getOvertimeRecords();
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
        <!-- 右侧竖框 - 消息通知 -->
        <div class="panel notification-panel">
          <div class="notification-header">
            <h3>消息通知</h3>
            <!-- <el-button type="primary" text size="small">查看全部</el-button> -->
          </div>
          
          <!-- 超时记录作为消息内容 -->
          <div class="notification-content">
            <div class="message-section">
              <div class="message-title">
                <el-icon><Warning /></el-icon>
                <span>超时记录</span>
              </div>
              
              <div class="message-content" v-loading="overtimeLoading">
                <div v-if="overtimeData.length === 0" class="empty-message">
                  <el-empty description="暂无超时记录" :image-size="60" />
                </div>
                <div v-else class="overtime-table-container">
                  <el-table 
                    :data="overtimeData" 
                    size="default"
                    stripe
                    style="width: 100%"
                    :max-height="400"
                  >
                    <el-table-column prop="cabinetName" label="柜子名" min-width="120" show-overflow-tooltip />
                    <el-table-column prop="materialName" label="物品名" min-width="120" show-overflow-tooltip />
                    <el-table-column prop="operatorName" label="借用人" min-width="100" />
                    <el-table-column label="归还时间" min-width="140">
                      <template #default="{ row }">
                        <span v-if="row.actualReturnTime">
                          {{ formatDateTime(row.actualReturnTime) }}
                        </span>
                        <el-tag v-else type="warning" size="small">未归还</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="超时时长" min-width="120">
                      <template #default="{ row }">
                        <el-tag type="danger" size="small">
                          {{ calculateOvertimeDuration(row.plannedReturnTime, row.actualReturnTime) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </div>
          </div>
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
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.notification-header {
  padding: 20px;
  border-bottom: 1px solid #f0f2f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    font-size: 18px;
    color: #303133;
    font-weight: 600;
  }
}

.notification-content {
  flex: 1;
  padding: 20px;
  overflow: auto;
}

.message-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .message-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    color: #E6A23C;
    font-size: 16px;
    font-weight: 500;
    
    .el-icon {
      font-size: 18px;
    }
  }
  
  .message-content {
    flex: 1;
    
    .empty-message {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 300px;
    }
    
    .overtime-table-container {
      width: 100%;
      
      .el-table {
        font-size: 14px;
        
        .el-table__header {
          .el-table__cell {
            background-color: #fafafa;
            color: #606266;
            font-weight: 600;
          }
        }
        
        .el-table__body {
          .el-table__cell {
            padding: 12px 0;
          }
        }
        
        .el-tag {
          font-size: 12px;
          padding: 4px 8px;
          height: auto;
          line-height: 1.2;
        }
      }
    }
  }
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