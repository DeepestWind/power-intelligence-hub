<script setup lang="ts">
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { loginRules } from "./utils/rule";
import { ref, reactive, toRaw } from "vue";
import { debounce } from "@pureadmin/utils";
import { useNav } from "@/layout/hooks/useNav";
import { useEventListener } from "@vueuse/core";
import type { FormInstance } from "element-plus";
import { useLayout } from "@/layout/hooks/useLayout";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter, getTopMenu } from "@/router/utils";
import { bg, avatar, illustration } from "./utils/static";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import { ElMessageBox } from 'element-plus';
import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";

defineOptions({
  name: "Login"
});

const router = useRouter();
const loading = ref(false);
const disabled = ref(false);
const ruleFormRef = ref<FormInstance>();

const { initStorage } = useLayout();
initStorage();

const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title } = useNav();

const ruleForm = reactive({
  employeeId: "111",
  password: "12345"
});

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;
      useUserStoreHook()
        .loginByUsername({
          employeeId: ruleForm.employeeId,
          password: ruleForm.password
        })
        .then(res => {
          if (res.code == 200) {
            // 获取后端路由
            return initRouter().then(() => {
              disabled.value = true;
              router
                .push(getTopMenu(true).path)
                .then(() => {
                  message("登录成功", { type: "success" });
                })
                .finally(() => (disabled.value = false));
            });
          } else {
            message("登录失败", { type: "error" });
          }
        })
        .catch(error => {
          // 🔥 添加权限校验逻辑
          console.error('登录错误:', error);
          
          // 检查是否是普通用户无权登录的错误
          if (error.response && error.response.data) {
            const errorData = error.response.data;
            
            // 检查后端返回的错误码和消息
            if (errorData.code === -7 && errorData.data === "普通用户无权登录") {
              // 显示权限不足弹窗
              ElMessageBox.alert(
                '抱歉，您的账户权限不足，无法访问运营端管理系统。如需帮助，请联系系统管理员。',
                '权限不足',
                {
                  confirmButtonText: '确定',
                  type: 'warning',
                  customClass: 'login-permission-alert',
                  showClose: false,
                  center: true
                }
              ).then(() => {
                // 用户点击确定后，清空密码字段
                ruleForm.password = '';
                // 聚焦到密码输入框
                setTimeout(() => {
                  const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
                  if (passwordInput) {
                    passwordInput.focus();
                  }
                }, 100);
              });
              return;
            }
          }
          
          // 🔥 其他类型的登录错误处理
          if (error.response && error.response.status === 500) {
            // 服务器内部错误
            message("服务器内部错误，请稍后重试", { type: "error" });
          } else if (error.response && error.response.status === 401) {
            // 认证失败
            message("用户名或密码错误", { type: "error" });
          } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
            // 网络错误
            message("网络连接失败，请检查网络状态", { type: "error" });
          } else {
            // 其他未知错误
            const errorMsg = error.response?.data?.msg || error.response?.data?.data || error.message || "登录失败，请重试";
            message(errorMsg, { type: "error" });
          }
        })
        .finally(() => (loading.value = false));
    }
  });
};

const immediateDebounce: any = debounce(
  formRef => onLogin(formRef),
  1000,
  true
);

useEventListener(document, "keydown", ({ code }) => {
  if (
    ["Enter", "NumpadEnter"].includes(code) &&
    !disabled.value &&
    !loading.value
  )
    immediateDebounce(ruleFormRef.value);
});
</script>

<template>
  <div class="select-none">
    <img :src="bg" class="wave" />
    <div class="flex-c absolute right-5 top-3">
      <!-- 主题 -->
      <el-switch
        v-model="dataTheme"
        inline-prompt
        :active-icon="dayIcon"
        :inactive-icon="darkIcon"
        @change="dataThemeChange"
      />
    </div>
    <div class="login-container">
      <div class="img">
        <component :is="toRaw(illustration)" />
      </div>
      <div class="login-box">
        <div class="login-form">
          <avatar class="avatar" />
          <Motion>
            <h2 class="outline-hidden">{{ title }}</h2>
          </Motion>

          <el-form
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="loginRules"
            size="large"
          >
            <Motion :delay="100">
              <el-form-item
                :rules="[
                  {
                    required: true,
                    message: '请输入账号',
                    trigger: 'blur'
                  }
                ]"
                prop="employeeId"
              >
                <el-input
                  v-model="ruleForm.employeeId"
                  clearable
                  placeholder="账号"
                  :prefix-icon="useRenderIcon(User)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="150">
              <el-form-item prop="password">
                <el-input
                  v-model="ruleForm.password"
                  clearable
                  show-password
                  placeholder="密码"
                  :prefix-icon="useRenderIcon(Lock)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="250">
              <el-button
                class="w-full mt-4!"
                size="default"
                type="primary"
                :loading="loading"
                :disabled="disabled"
                @click="onLogin(ruleFormRef)"
              >
                登录
              </el-button>
            </Motion>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("@/style/login.css");
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}
</style>
