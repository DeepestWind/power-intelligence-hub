<script setup lang='ts'>
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Delete, View, Setting } from '@element-plus/icons-vue';
import AreaSelect from "@/components/AreaSelect/index.vue";
import ResizablePanel from "@/components/ResizeablePanel/index.vue";

defineOptions({
  name: "CabinetManagement"
});

// 柜子数据接口（修改为柜子相关字段）
interface CabinetData {
  id: number;
  cabinetCode: string;
  cabinetName: string;
  region: string;
  address: string;
  onlineStatus: boolean;
  createTime: string;
}

// 响应式数据
const loading = ref(false);
const tableData = ref<CabinetData[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);

// 搜索表单（修改为柜子相关字段）
const searchForm = ref({
  cabinetCode: '',
  cabinetName: '',
  region: '',
  onlineStatus: ''
});

// 模拟数据（修改为柜子数据）
const mockData: CabinetData[] = [
  {
    id: 1,
    cabinetCode: 'CAB001',
    cabinetName: 'A区1号柜',
    region: '浙江省杭州市西湖区',
    address: '西湖大道123号',
    onlineStatus: true,
    createTime: '2024-01-15 10:30:00'
  },
  {
    id: 2,
    cabinetCode: 'CAB002',
    cabinetName: 'B区2号柜',
    region: '浙江省杭州市上城区',
    address: '延安路456号',
    onlineStatus: false,
    createTime: '2024-01-16 14:20:00'
  },
  {
    id: 3,
    cabinetCode: 'CAB003',
    cabinetName: 'C区3号柜',
    region: '浙江省杭州市拱墅区',
    address: '运河路789号',
    onlineStatus: true,
    createTime: '2024-01-17 09:15:00'
  }
];

// 获取柜子列表（修改函数名和注释）
const getCabinetList = async () => {
  loading.value = true;
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 这里应该调用真实的API
    // const response = await getCabinetListApi({
    //   page: currentPage.value,
    //   size: pageSize.value,
    //   ...searchForm.value
    // });
    
    // 模拟数据
    tableData.value = mockData;
    total.value = mockData.length;
    
  } catch (error) {
    ElMessage.error('获取柜子列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  getCabinetList();
};

// 重置搜索（修改为柜子字段）
const handleReset = () => {
  searchForm.value = {
    cabinetCode: '',
    cabinetName: '',
    region: '',
    onlineStatus: ''
  };
  handleSearch();
};

// 查看柜子详情（修改注释）
const handleView = (row: CabinetData) => {
  ElMessage.info(`查看柜子: ${row.cabinetName}`);
  // 这里可以打开详情弹窗或跳转到详情页
};

// 编辑柜子（修改注释）
const handleEdit = (row: CabinetData) => {
  ElMessage.info(`编辑柜子: ${row.cabinetName}`);
  // 这里可以打开编辑弹窗
};

// 柜子配置（修改注释）
const handleSetting = (row: CabinetData) => {
  ElMessage.info(`配置柜子: ${row.cabinetName}`);
  // 这里可以打开配置弹窗
};

// 删除柜子（修改注释和提示文本）
const handleDelete = async (row: CabinetData) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除柜子 "${row.cabinetName}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    // 这里调用删除API
    ElMessage.success('删除成功');
    getCabinetList();
  } catch {
    ElMessage.info('已取消删除');
  }
};

// 分页改变
const handlePageChange = (page: number) => {
  currentPage.value = page;
  getCabinetList();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  getCabinetList();
};

// 面板大小改变回调
const handlePanelResize = (width: number) => {
  console.log('Panel width changed to:', width);
  // 可以在这里保存用户的布局偏好到 localStorage
  localStorage.setItem('cabinet-sidebar-width', width.toString());
};

// 生命周期（修改函数调用）
onMounted(() => {
  getCabinetList();
});
</script>

<template>
  <div class="cabinet-management-container">
    <ResizablePanel 
      :initial-width="200"
      :min-width="150" 
      :max-width="400"
      @resize="handlePanelResize"
    >
      <AreaSelect />
    </ResizablePanel>
    
    <div class="content">
      <div class="main-content">
        <!-- 搜索区域（修改为柜子相关字段） -->
        <el-card class="search-card">
          <el-form :model="searchForm" :inline="true" class="search-form">
            <el-form-item label="柜子编号">
              <el-input 
                v-model="searchForm.cabinetCode" 
                placeholder="请输入柜子编号" 
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="柜子名称">
              <el-input 
                v-model="searchForm.cabinetName" 
                placeholder="请输入柜子名称" 
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="地区">
              <el-input 
                v-model="searchForm.region" 
                placeholder="请输入地区" 
                clearable
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="在线状态">
              <el-select 
                v-model="searchForm.onlineStatus" 
                placeholder="请选择状态"
                clearable
                style="width: 120px"
              >
                <el-option label="在线" value="true" />
                <el-option label="离线" value="false" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSearch">
                搜索
              </el-button>
              <el-button @click="handleReset">
                重置
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 表格区域（修改表头和数据绑定） -->
        <el-card class="table-card">
          <template #header>
            <div class="card-header">
              <span class="title">柜子列表</span>
              <el-button type="primary" size="small">
                新增柜子
              </el-button>
            </div>
          </template>

          <el-table 
            :data="tableData" 
            v-loading="loading"
            style="width: 100%"
            stripe
            border
          >
            <el-table-column prop="cabinetCode" label="柜子编号" width="120" />
            <el-table-column prop="cabinetName" label="柜子名称" width="150" />
            <el-table-column prop="region" label="地区" width="200" />
            <el-table-column prop="address" label="具体地址" min-width="200" />
            <el-table-column label="在线状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.onlineStatus ? 'success' : 'danger'">
                  {{ row.onlineStatus ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="180">
              <template #default="{ row }">
                {{ row.createTime }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button 
                  type="primary" 
                  size="small" 
                  :icon="View"
                  @click="handleView(row)"
                >
                  查看
                </el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  :icon="Edit"
                  @click="handleEdit(row)"
                >
                  编辑
                </el-button>
                <el-button 
                  type="warning" 
                  size="small" 
                  :icon="Setting"
                  @click="handleSetting(row)"
                >
                  配置
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  :icon="Delete"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style lang='scss' scoped>
.cabinet-management-container {
  display: flex;
  height: calc(100vh - 80px);
  
  .content {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    background-color: #f5f7fa;
    
    .main-content {
      .search-card {
        margin-bottom: 20px;
        
        .search-form {
          .el-form-item {
            margin-bottom: 0;
          }
        }
      }
      
      .table-card {
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .title {
            font-size: 16px;
            font-weight: 500;
            color: #303133;
          }
        }
        
        .pagination-container {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }
      }
    }
  }
}

// 覆盖 AreaSelect 组件内部的样式
:deep(.area-tree) {
  background-color: transparent;
  
  .el-tree-node__content {
    overflow: hidden;
    
    .el-tree-node__label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

// 表格样式调整
:deep(.el-table) {
  .el-button + .el-button {
    margin-left: 4px;
  }
}
</style>