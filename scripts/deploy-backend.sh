#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/deploy-common.sh
source "${SCRIPT_DIR}/deploy-common.sh"

prepare_local_tmp_dir
test_backend
package_backend
deploy_backend_artifact
check_remote_status

log "后端部署完成"
