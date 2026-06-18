#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# /** 加载本地 .env 配置，已存在的环境变量优先。 */
load_env_file() {
  local env_file="${PROJECT_ROOT}/.env"
  local line name value

  [[ -f "${env_file}" ]] || return

  while IFS= read -r line || [[ -n "${line}" ]]; do
    [[ "${line}" =~ ^[[:space:]]*$|^[[:space:]]*# ]] && continue
    name="${line%%=*}"
    value="${line#*=}"

    [[ "${name}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue
    [[ -z "${!name:-}" ]] || continue

    printf -v "${name}" '%s' "${value}"
    export "${name}"
  done < "${env_file}"
}

load_env_file

# /** 部署服务器公网 IP。 */
DEPLOY_HOST="${DEPLOY_HOST:-}"

# /** 部署服务器登录用户。 */
DEPLOY_USER="${DEPLOY_USER:-}"

# /** 服务器前端静态文件目录。 */
REMOTE_WEB_DIR="${REMOTE_WEB_DIR:-/opt/training/web}"

# /** 服务器后端 Jar 路径。 */
REMOTE_BACKEND_JAR="${REMOTE_BACKEND_JAR:-/opt/training/app/training.jar}"

# /** 服务器后端 systemd 服务名。 */
REMOTE_BACKEND_SERVICE="${REMOTE_BACKEND_SERVICE:-training}"

# /** 服务器部署备份目录。 */
REMOTE_RELEASE_DIR="${REMOTE_RELEASE_DIR:-/opt/training/releases}"

# /** 服务器临时上传目录。 */
REMOTE_TMP_DIR="${REMOTE_TMP_DIR:-/tmp/training-deploy}"

# /** 前端 Node.js 版本。 */
NODE_VERSION="${NODE_VERSION:-20.19.5}"

# /** 是否只打印部署步骤。 */
DEPLOY_DRY_RUN="${DEPLOY_DRY_RUN:-0}"

# /** 当前部署批次时间戳。 */
DEPLOY_TIMESTAMP="${DEPLOY_TIMESTAMP:-$(date +%Y%m%d%H%M%S)}"

FRONTEND_DIR="${PROJECT_ROOT}/frondend"
BACKEND_DIR="${PROJECT_ROOT}/java"
DEPLOY_TMP_DIR="${PROJECT_ROOT}/.deploy-tmp"

# /** 校验必填环境变量。 */
require_env() {
  local name="$1"

  if [[ -z "${!name:-}" ]]; then
    printf '缺少必填环境变量：%s\n' "${name}" >&2
    exit 1
  fi
}

require_env DEPLOY_HOST
require_env DEPLOY_USER

REMOTE_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"

# /** 输出普通日志。 */
log() {
  printf '\n==> %s\n' "$1"
}

# /** 输出 dry-run 命令。 */
dry_run_log() {
  printf '[dry-run] %s\n' "$1"
}

# /** 判断当前是否为 dry-run。 */
is_dry_run() {
  [[ "${DEPLOY_DRY_RUN}" == "1" ]]
}

# /** 执行本地命令。 */
run_local() {
  if is_dry_run; then
    dry_run_log "$*"
    return
  fi

  "$@"
}

# /** 执行本地 shell 片段。 */
run_local_shell() {
  local command="$1"

  if is_dry_run; then
    dry_run_log "${command}"
    return
  fi

  bash -lc "${command}"
}

# /** 执行远程 shell 片段。 */
run_remote_shell() {
  local command="$1"

  if is_dry_run; then
    dry_run_log "ssh ${REMOTE_TARGET} ${command}"
    return
  fi

  ssh "${REMOTE_TARGET}" "bash -lc $(printf '%q' "${command}")"
}

# /** 上传本地文件到服务器。 */
upload_file() {
  local local_file="$1"
  local remote_file="$2"

  if is_dry_run; then
    dry_run_log "scp ${local_file} ${REMOTE_TARGET}:${remote_file}"
    return
  fi

  scp "${local_file}" "${REMOTE_TARGET}:${remote_file}"
}

# /** 创建本地临时目录。 */
prepare_local_tmp_dir() {
  run_local mkdir -p "${DEPLOY_TMP_DIR}"
}

# /** 创建远程临时目录。 */
prepare_remote_tmp_dir() {
  run_remote_shell "mkdir -p '${REMOTE_TMP_DIR}' '${REMOTE_RELEASE_DIR}'"
}

# /** 构建前端静态文件。 */
build_frontend() {
  log "构建前端"
  run_local_shell "cd '${FRONTEND_DIR}' && if [ -s \"\$HOME/.nvm/nvm.sh\" ]; then . \"\$HOME/.nvm/nvm.sh\" && nvm use '${NODE_VERSION}'; fi && npm run build"
}

# /** 执行后端测试。 */
test_backend() {
  log "执行后端测试"
  run_local_shell "cd '${BACKEND_DIR}' && ./mvnw test"
}

# /** 打包后端 Jar。 */
package_backend() {
  log "打包后端"
  run_local_shell "cd '${BACKEND_DIR}' && ./mvnw -DskipTests package"
}

# /** 打包前端 dist 目录。 */
create_frontend_archive() {
  FRONTEND_ARCHIVE="${DEPLOY_TMP_DIR}/frontend-${DEPLOY_TIMESTAMP}.tar.gz"
  log "打包前端产物"
  run_local tar -czf "${FRONTEND_ARCHIVE}" -C "${FRONTEND_DIR}/dist" .
}

# /** 部署已构建的前端产物。 */
deploy_frontend_artifact() {
  local remote_archive="${REMOTE_TMP_DIR}/frontend-${DEPLOY_TIMESTAMP}.tar.gz"
  local remote_new_dir="${REMOTE_WEB_DIR}.new-${DEPLOY_TIMESTAMP}"
  local remote_backup_dir="${REMOTE_RELEASE_DIR}/web-${DEPLOY_TIMESTAMP}"

  create_frontend_archive
  prepare_remote_tmp_dir

  log "上传前端产物到 ${REMOTE_WEB_DIR}"
  upload_file "${FRONTEND_ARCHIVE}" "${remote_archive}"

  log "替换线上前端并 reload nginx"
  run_remote_shell "set -euo pipefail
nginx -t
rm -rf '${remote_new_dir}'
mkdir -p '${remote_new_dir}'
tar -xzf '${remote_archive}' -C '${remote_new_dir}'
if [ -d '${REMOTE_WEB_DIR}' ]; then
  rm -rf '${remote_backup_dir}'
  mv '${REMOTE_WEB_DIR}' '${remote_backup_dir}'
fi
mv '${remote_new_dir}' '${REMOTE_WEB_DIR}'
systemctl reload nginx"
}

# /** 查找最新生成的后端可执行 Jar。 */
find_backend_jar() {
  local latest_jar=""
  local jar

  for jar in "${BACKEND_DIR}"/target/*.jar; do
    [[ -e "${jar}" ]] || continue
    [[ "${jar}" == *.original ]] && continue

    if [[ -z "${latest_jar}" || "${jar}" -nt "${latest_jar}" ]]; then
      latest_jar="${jar}"
    fi
  done

  if [[ -z "${latest_jar}" ]]; then
    printf '未找到后端 Jar，请先执行打包。\n' >&2
    exit 1
  fi

  printf '%s\n' "${latest_jar}"
}

# /** 部署已构建的后端 Jar。 */
deploy_backend_artifact() {
  local local_jar
  local remote_new_jar="${REMOTE_TMP_DIR}/training-${DEPLOY_TIMESTAMP}.jar"
  local remote_backup_jar="${REMOTE_RELEASE_DIR}/training-${DEPLOY_TIMESTAMP}.jar"

  local_jar="$(find_backend_jar)"
  prepare_remote_tmp_dir

  log "上传后端 Jar 到 ${REMOTE_BACKEND_JAR}"
  upload_file "${local_jar}" "${remote_new_jar}"

  log "替换线上后端并 restart training"
  run_remote_shell "set -euo pipefail
test -f '${remote_new_jar}'
if [ -f '${REMOTE_BACKEND_JAR}' ]; then
  cp '${REMOTE_BACKEND_JAR}' '${remote_backup_jar}'
fi
install -m 0644 '${remote_new_jar}' '${REMOTE_BACKEND_JAR}'
systemctl restart '${REMOTE_BACKEND_SERVICE}'
systemctl status '${REMOTE_BACKEND_SERVICE}' --no-pager"
}

# /** 检查线上前端与后端状态。 */
check_remote_status() {
  log "检查线上状态"
  run_local curl -I "http://${DEPLOY_HOST}"
  run_local curl "http://${DEPLOY_HOST}/api/auth/status"
  run_remote_shell "systemctl status '${REMOTE_BACKEND_SERVICE}' --no-pager"
}
