<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import { useUserStoreHook } from '@/store/modules/user';
import { useAreaStore } from '@/store/modules/area';
import { useNav } from '@/layout/hooks/useNav';
import * as echarts from 'echarts';
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

import { 
  getCabinetInfo,
  calculateUsageRate,
  getCabinetStatusType,
  formatCabinetStatus,
  type CabinetInfoData
} from '@/api/welcome';

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

// 柜子信息相关数据
const cabinetLoading = ref(false);
const cabinetData = ref<CabinetInfoData[]>([]);

// 饼图相关数据
const chartRef = ref<HTMLDivElement>();
let chartInstance: echarts.ECharts | null = null;

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


// 计算汇总数据
const summaryData = computed(() => {
  const summary = {
    total: 0,
    inStock: 0,
    borrowed: 0,
    repairing: 0
  };
  
  cabinetData.value.forEach(cabinet => {
    summary.total += cabinet.total;
    summary.inStock += cabinet.inStock;
    summary.borrowed += cabinet.borrowed;
    summary.repairing += cabinet.repairing;
  });
  
  return summary;
});

// 初始化饼图
const initChart = () => {
  if (!chartRef.value) return;
  
  // 销毁之前的实例
  if (chartInstance) {
    chartInstance.dispose();
  }
  
  chartInstance = echarts.init(chartRef.value);
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}件 ({d}%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderWidth: 0,
      textStyle: {
        color: '#fff',
        fontSize: 14
      },
      // 添加这些配置来控制提示框的层级和位置
      // appendToBody: true,        // 将提示框添加到 body 上
      // position: function (point, params, dom, rect, size) {
      //   // 自定义提示框位置，避免被遮挡
      //   const x = point[0];
      //   const y = point[1];
      //   const viewWidth = size.viewSize[0];
      //   const viewHeight = size.viewSize[1];
      //   const boxWidth = size.contentSize[0];
      //   const boxHeight = size.contentSize[1];
        
      //   let posX = x + 10;
      //   let posY = y + 10;
        
      //   // 如果提示框会超出右边界，就显示在左边
      //   if (posX + boxWidth > viewWidth) {
      //     posX = x - boxWidth - 10;
      //   }
        
      //   // 如果提示框会超出下边界，就显示在上边
      //   if (posY + boxHeight > viewHeight) {
      //     posY = y - boxHeight - 10;
      //   }
        
      //   return [posX, posY];
      // }
    },
    legend: {
      bottom: '10%',
      left: 'center',
      data: ['在柜', '借出', '维修中'],
      itemWidth: 18,        // 图例标记的宽度
      itemHeight: 14,       // 图例标记的高度
      itemGap: 20,          // 图例项之间的间隔
      textStyle: {
        fontSize: 18,       // 放大字体
        color: '#606266',
        fontWeight: 500
      },
      icon: 'circle'        // 图例标记的图形
    },
    series: [
      {
        name: '物品状态',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '40%'],      // 稍微上移，为图例留出更多空间
        avoidLabelOverlap: false,
        emphasis: {
          scale: true,
          scaleSize: 10,             // 增大鼠标悬停时的放大效果
          focus: 'self'              // 聚焦效果
        },
        label: {
          show: false,              
          position: 'outside'
        },
        labelLine: {
          show: false               
        },
        data: [
          { 
            value: summaryData.value.inStock, 
            name: '在柜',
            itemStyle: { 
              color: '#67C23A',
              borderWidth: 2,
              borderColor: '#fff'
            }
          },
          { 
            value: summaryData.value.borrowed, 
            name: '借出',
            itemStyle: { 
              color: '#E6A23C',
              borderWidth: 2,
              borderColor: '#fff'
            }
          },
          { 
            value: summaryData.value.repairing, 
            name: '维修中',
            itemStyle: { 
              color: '#F56C6C',
              borderWidth: 2,
              borderColor: '#fff'
            }
          }
        ]
      }
    ]
  };
  
  chartInstance.setOption(option);
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize();
    }
  });
};

// 同时修改 updateChart 函数
const updateChart = () => {
  if (!chartInstance) return;
  
  const option = {
    series: [
      {
        data: [
          { 
            value: summaryData.value.inStock, 
            name: '在柜',
            itemStyle: { 
              color: '#67C23A',
              borderWidth: 2,
              borderColor: '#fff'
            }
          },
          { 
            value: summaryData.value.borrowed, 
            name: '借出',
            itemStyle: { 
              color: '#E6A23C',
              borderWidth: 2,
              borderColor: '#fff'
            }
          },
          { 
            value: summaryData.value.repairing, 
            name: '维修中',
            itemStyle: { 
              color: '#F56C6C',
              borderWidth: 2,
              borderColor: '#fff'
            }
          }
        ]
      }
    ]
  };
  
  chartInstance.setOption(option);
};

// 监听柜子数据变化，更新图表
watch(cabinetData, () => {
  nextTick(() => {
    if (chartInstance) {
      updateChart();
    }
  });
});

// 获取柜子信息列表
const getCabinetInfoList = async () => {
  cabinetLoading.value = true;
  try {
    const response = await getCabinetInfo();
    
    if (response.code === 200) {
      cabinetData.value = response.data;
      console.log('获取柜子信息成功:', cabinetData.value);
      
      // 数据加载完成后初始化图表
      nextTick(() => {
        initChart();
      });
    } else {
      ElMessage.error(response.msg || '获取柜子信息失败');
    }
  } catch (error) {
    console.error('获取柜子信息失败:', error);
    ElMessage.error('获取柜子信息失败，请检查网络连接');
  } finally {
    cabinetLoading.value = false;
  }
};

// 在生命周期钩子中调用
onMounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
  }
  window.removeEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize();
    }
  });
  
  // 获取数据
  getOvertimeRecords();
  getCabinetInfoList();
});

// 添加 onUnmounted 钩子确保资源清理
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose();
  }
  window.removeEventListener('resize', () => {
    if (chartInstance) {
      chartInstance.resize();
    }
  });
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
          <div class="chart-content">
            <!-- 左侧柜子信息表格 -->
            <div class="cabinet-section">
              <div class="cabinet-header">
                <!-- <h3>柜子信息</h3> -->
                <!-- <el-button type="primary" text size="small">查看详情</el-button> -->
              </div>
              
              <div class="cabinet-table-container" v-loading="cabinetLoading">
                <div v-if="cabinetData.length === 0" class="empty-cabinet">
                  <el-empty description="暂无柜子信息" :image-size="60" />
                </div>
                <div v-else>
                  <el-table 
                    :data="cabinetData" 
                    size="default"
                    stripe
                    style="width: 100%"
                    :max-height="400"
                  >
                    <el-table-column prop="cabinetName" label="柜子名" min-width="100" show-overflow-tooltip />
                    <el-table-column prop="total" label="物品总数" min-width="100" align="center">
                      <template #default="{ row }">
                        <el-tag type="info" size="small">{{ row.total }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="inStock" label="在柜数量" min-width="100" align="center">
                      <template #default="{ row }">
                        <el-tag type="success" size="small">{{ row.inStock }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="borrowed" label="借出数量" min-width="100" align="center">
                      <template #default="{ row }">
                        <el-tag type="warning" size="small">{{ row.borrowed }}</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column prop="repairing" label="维修数量" min-width="100" align="center">
                      <template #default="{ row }">
                        <el-tag type="danger" size="small">{{ row.repairing }}</el-tag>
                      </template>
                    </el-table-column>
                    <!-- <el-table-column label="使用率" min-width="100" align="center">
                      <template #default="{ row }">
                        <el-progress 
                          :percentage="calculateUsageRate(row)" 
                          :color="calculateUsageRate(row) > 80 ? '#F56C6C' : '#67C23A'"
                          :stroke-width="8"
                          :show-text="true"
                          :format="(percentage) => `${percentage}%`"
                        />
                      </template>
                    </el-table-column> -->
                    <!-- <el-table-column label="状态" min-width="100" align="center">
                      <template #default="{ row }">
                        <el-tag :type="getCabinetStatusType(row)" size="small">
                          {{ formatCabinetStatus(row) }}
                        </el-tag>
                      </template>
                    </el-table-column> -->
                  </el-table>
                </div>
              </div>
            </div>
            
            <!-- 分割线 -->
            <div class="divider"></div>
            
            <!-- 右侧区域 -->
            <div class="right-section">
              <div class="right-header">
                <!-- <h3>物品状态统计</h3> -->
              </div>
              <div class="right-content">
                <div class="chart-container">
                  <!-- 汇总信息卡片 -->
                  <div class="summary-cards">
                    <div class="summary-card total">
                      <div class="card-value">{{ summaryData.total }}</div>
                      <div class="card-label">物品总数</div>
                    </div>
                    <div class="summary-card in-stock">
                      <div class="card-value">{{ summaryData.inStock }}</div>
                      <div class="card-label">在柜数量</div>
                    </div>
                    <div class="summary-card borrowed">
                      <div class="card-value">{{ summaryData.borrowed }}</div>
                      <div class="card-label">借出数量</div>
                    </div>
                    <div class="summary-card repairing">
                      <div class="card-value">{{ summaryData.repairing }}</div>
                      <div class="card-label">维修数量</div>
                    </div>
                  </div>
                  
                  <!-- 饼图 -->
                  <div class="chart-wrapper">
                    <div ref="chartRef" class="pie-chart" v-loading="cabinetLoading"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
                    <el-table-column label="借出时间" min-width="140">
                      <template #default="{ row }">
                        <span v-if="row.lentOutTime">
                          {{ formatDateTime(row.lentOutTime) }}
                        </span>
                        <el-tag v-else type="warning" size="small">-</el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="超时时长" min-width="120">
                      <template #default="{ row }">
                        <el-tag type="danger" size="small"
                        v-if="calculateOvertimeDuration(row.lentOutTime) !== '未超时'">
                          {{ calculateOvertimeDuration(row.lentOutTime) }}
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
.chart-panel {
  flex: 1;
  padding: 20px;
}

.chart-content {
  display: flex;
  height: 100%;
  gap: 20px;
}

.cabinet-section {
  flex: 3;
  display: flex;
  flex-direction: column;
  
  .cabinet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
      font-size: 18px;
      color: #303133;
      font-weight: 600;
    }
  }
  
  .cabinet-table-container {
    flex: 1;
    overflow: auto;
    
    .empty-cabinet {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }
    
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
      
      .el-progress {
        width: 80px;
        
        .el-progress-bar {
          padding-right: 0;
        }
        
        .el-progress__text {
          font-size: 12px;
          min-width: 30px;
        }
      }
    }
  }
}

.divider {
  width: 2px;
  background: linear-gradient(to bottom, transparent, #e4e7ed, transparent);
  margin: 0 10px;
  flex-shrink: 0;
}

.right-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  
  .right-header {
    margin-bottom: 16px;
    
    h3 {
      margin: 0;
      font-size: 18px;
      color: #303133;
      font-weight: 600;
    }
  }
  
  .right-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .chart-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
      
      .summary-cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        
        .summary-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          border: 2px solid transparent;
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          .card-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          
          .card-label {
            font-size: 12px;
            color: #666;
            font-weight: 500;
          }
          
          &.total {
            border-color: #909399;
            .card-value { color: #909399; }
          }
          
          &.in-stock {
            border-color: #67C23A;
            .card-value { color: #67C23A; }
          }
          
          &.borrowed {
            border-color: #E6A23C;
            .card-value { color: #E6A23C; }
          }
          
          &.repairing {
            border-color: #F56C6C;
            .card-value { color: #F56C6C; }
          }
        }
      }
      
      .chart-wrapper {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 250px;
        position: relative; /* 添加相对定位 */
        z-index: 10; /* 增加层级 */
        
        .pie-chart {
          width: 100%;
          height: 250px;
          position: relative;
          z-index: 15;
        }
      }
    }
  }
}
</style>