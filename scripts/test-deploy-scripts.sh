#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# /** 输出测试日志。 */
log() {
  printf '[test] %s\n' "$1"
}

# /** 断言文件存在且可执行。 */
assert_executable() {
  local file="$1"

  if [[ ! -x "${file}" ]]; then
    printf '期望脚本存在且可执行：%s\n' "${file}" >&2
    exit 1
  fi
}

# /** 断言文本中包含关键词。 */
assert_contains() {
  local content="$1"
  local expected="$2"

  if [[ "${content}" != *"${expected}"* ]]; then
    printf '期望输出包含：%s\n实际输出：\n%s\n' "${expected}" "${content}" >&2
    exit 1
  fi
}

cd "${PROJECT_ROOT}"

log '检查部署脚本存在'
assert_executable "${SCRIPT_DIR}/deploy-frontend.sh"
assert_executable "${SCRIPT_DIR}/deploy-backend.sh"
assert_executable "${SCRIPT_DIR}/deploy-full.sh"

log '检查 Bash 语法'
bash -n "${SCRIPT_DIR}/deploy-common.sh"
bash -n "${SCRIPT_DIR}/deploy-frontend.sh"
bash -n "${SCRIPT_DIR}/deploy-backend.sh"
bash -n "${SCRIPT_DIR}/deploy-full.sh"

# /** 执行部署脚本 dry-run。 */
run_deploy_dry_run() {
  DEPLOY_DRY_RUN=1 DEPLOY_HOST=example.com DEPLOY_USER=deploy "$@"
}

log '检查前端 dry-run 输出'
frontend_output="$(run_deploy_dry_run "${SCRIPT_DIR}/deploy-frontend.sh")"
assert_contains "${frontend_output}" '构建前端'
assert_contains "${frontend_output}" '/opt/training/web'
assert_contains "${frontend_output}" 'reload nginx'

log '检查后端 dry-run 输出'
backend_output="$(run_deploy_dry_run "${SCRIPT_DIR}/deploy-backend.sh")"
assert_contains "${backend_output}" '执行后端测试'
assert_contains "${backend_output}" '/opt/training/app/training.jar'
assert_contains "${backend_output}" 'restart training'

log '检查完整部署 dry-run 输出'
full_output="$(run_deploy_dry_run "${SCRIPT_DIR}/deploy-full.sh")"
assert_contains "${full_output}" '构建前端'
assert_contains "${full_output}" '执行后端测试'
assert_contains "${full_output}" '检查线上状态'

log '部署脚本测试通过'
