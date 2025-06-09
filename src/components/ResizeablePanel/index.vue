<template>
  <div class="resizable-panel" :style="{ width: panelWidth + 'px' }">
    <div class="panel-content">
      <slot></slot>
    </div>
    <div 
      class="resize-handle"
      @mousedown="startResize"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';

interface Props {
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  background?: string;
  showBorder?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  initialWidth: 200,
  minWidth: 150,
  maxWidth: 400,
  background: '#fafafa',
  showBorder: true
});

const emit = defineEmits<{
  resize: [width: number];
}>();

const panelWidth = ref(props.initialWidth);
const isResizing = ref(false);
const startX = ref(0);
const startWidth = ref(0);

const startResize = (e: MouseEvent) => {
  e.preventDefault();
  isResizing.value = true;
  startX.value = e.clientX;
  startWidth.value = panelWidth.value;
  
  document.addEventListener('mousemove', handleResize);
  document.addEventListener('mouseup', stopResize);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
  
  // 添加全局样式类
  document.body.classList.add('resizing');
};

const handleResize = (e: MouseEvent) => {
  if (!isResizing.value) return;
  
  const diff = e.clientX - startX.value;
  const newWidth = startWidth.value + diff;
  
  if (newWidth >= props.minWidth && newWidth <= props.maxWidth) {
    panelWidth.value = newWidth;
    emit('resize', newWidth);
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  
  // 移除全局样式类
  document.body.classList.remove('resizing');
};

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize);
  document.removeEventListener('mouseup', stopResize);
  document.body.classList.remove('resizing');
});
</script>

<style scoped>
.resizable-panel {
  position: relative;
  background-color: v-bind(background);
  border-right: v-bind('showBorder ? "1px solid #e4e7ed" : "none"');
  overflow-y: auto;
  flex-shrink: 0;
  
  .panel-content {
    padding: 10px;
    height: 100%;
    overflow: hidden;
  }
  
  .resize-handle {
    position: absolute;
    top: 0;
    right: -2px;
    width: 4px;
    height: 100%;
    cursor: col-resize;
    background-color: transparent;
    transition: background-color 0.2s ease;
    z-index: 10;
    
    &:hover {
      background-color: #409eff;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 2px;
      height: 20px;
      background-color: #dcdfe6;
      border-radius: 1px;
      transition: background-color 0.2s ease;
      opacity: 0;
    }
    
    &:hover::after {
      background-color: #409eff;
      opacity: 1;
    }
  }
}

/* 全局样式 - 拖拽时禁用文本选择 */
:global(body.resizing) {
  cursor: col-resize !important;
  user-select: none !important;
}

:global(body.resizing *) {
  cursor: col-resize !important;
  user-select: none !important;
}
</style>