#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/deploy-common.sh
source "${SCRIPT_DIR}/deploy-common.sh"

prepare_local_tmp_dir
build_frontend
deploy_frontend_artifact
check_remote_status

log "前端部署完成"
