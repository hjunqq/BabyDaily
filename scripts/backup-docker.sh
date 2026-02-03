#!/bin/bash
# ============================================
# BabyDaily Docker 数据库备份脚本 (Linux)
# ============================================
# 用于备份运行在 Docker 中的 PostgreSQL 数据库
# 
# 使用方法:
#   ./backup-docker.sh              # 导出所有表到CSV
#   ./backup-docker.sh backup       # 完整SQL备份
#   ./backup-docker.sh list         # 列出已有备份
#
# 首次使用请授权: chmod +x backup-docker.sh

set -e

# 配置
CONTAINER_NAME="${CONTAINER_NAME:-babydaily-postgres}"
DB_NAME="${DB_NAME:-babydaily}"
DB_USER="${DB_USER:-postgres}"

# 路径设置
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUPS_DIR="$PROJECT_ROOT/database-backups"
EXPORTS_DIR="$PROJECT_ROOT/database-exports"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 确保目录存在
mkdir -p "$BACKUPS_DIR" "$EXPORTS_DIR"

# ============================================
# 辅助函数
# ============================================

show_banner() {
    echo -e "\n${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   BabyDaily Docker 数据库备份工具      ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}\n"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker 命令未找到${NC}"
        exit 1
    fi
    
    if docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" 2>/dev/null | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${GREEN}✓ 找到 Docker 容器: $CONTAINER_NAME${NC}"
        return 0
    else
        echo -e "${RED}✗ 未找到运行中的容器: $CONTAINER_NAME${NC}"
        echo -e "${YELLOW}  请确保 Docker 容器正在运行${NC}"
        exit 1
    fi
}

export_to_csv() {
    echo -e "\n${CYAN}开始导出数据到 CSV...${NC}\n"
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    EXPORT_PATH="$EXPORTS_DIR/$TIMESTAMP"
    mkdir -p "$EXPORT_PATH"
    
    TABLES=("users" "families" "family_members" "babies" "records" "ootd" "notifications" "user_settings")
    
    SUCCESS_COUNT=0
    TOTAL_ROWS=0
    
    for TABLE in "${TABLES[@]}"; do
        printf "  导出: $TABLE..."
        
        # 获取记录数
        COUNT=$(docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null | tr -d ' ' || echo "0")
        
        # 导出到CSV
        CSV_FILE="$EXPORT_PATH/$TABLE.csv"
        if docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME" -c "\COPY (SELECT * FROM $TABLE ORDER BY created_at) TO STDOUT WITH CSV HEADER" > "$CSV_FILE" 2>/dev/null; then
            FILE_SIZE=$(du -h "$CSV_FILE" 2>/dev/null | cut -f1)
            echo -e " ${GREEN}✓ ($COUNT 条, $FILE_SIZE)${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            TOTAL_ROWS=$((TOTAL_ROWS + COUNT))
        else
            echo -e " ${YELLOW}⊘ 空表或失败${NC}"
            rm -f "$CSV_FILE"
        fi
    done
    
    # 创建清单
    cat > "$EXPORT_PATH/manifest.json" << EOF
{
  "export_time": "$TIMESTAMP",
  "database": "$DB_NAME",
  "container": "$CONTAINER_NAME",
  "tables_exported": $SUCCESS_COUNT,
  "total_rows": $TOTAL_ROWS
}
EOF
    
    echo -e "\n${GREEN}✓ 导出完成!${NC}"
    echo -e "${YELLOW}  位置: $EXPORT_PATH${NC}"
    echo -e "${YELLOW}  表数: $SUCCESS_COUNT, 总记录: $TOTAL_ROWS${NC}\n"
}

backup_full_sql() {
    echo -e "\n${CYAN}开始完整 SQL 备份...${NC}\n"
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUPS_DIR/babydaily_$TIMESTAMP.sql"
    
    printf "  执行 pg_dump..."
    if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
        FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e " ${GREEN}✓${NC}"
        
        # 压缩
        printf "  压缩备份文件..."
        gzip "$BACKUP_FILE"
        GZIP_FILE="$BACKUP_FILE.gz"
        GZIP_SIZE=$(du -h "$GZIP_FILE" | cut -f1)
        echo -e " ${GREEN}✓${NC}"
        
        echo -e "\n${GREEN}✓ 备份完成!${NC}"
        echo -e "${YELLOW}  文件: $GZIP_FILE${NC}"
        echo -e "${YELLOW}  大小: $GZIP_SIZE${NC}\n"
    else
        echo -e " ${RED}✗ 备份失败${NC}"
        rm -f "$BACKUP_FILE"
    fi
}

show_backups() {
    echo -e "\n${CYAN}已有备份:${NC}\n"
    
    # SQL 备份
    echo -e "${YELLOW}SQL 备份 ($BACKUPS_DIR):${NC}"
    if ls "$BACKUPS_DIR"/*.gz 2>/dev/null | head -5; then
        for f in $(ls -t "$BACKUPS_DIR"/*.gz 2>/dev/null | head -10); do
            SIZE=$(du -h "$f" | cut -f1)
            NAME=$(basename "$f")
            DATE=$(stat -c %y "$f" 2>/dev/null | cut -d'.' -f1 || stat -f %Sm "$f" 2>/dev/null)
            echo "  📦 $NAME - $SIZE - $DATE"
        done
    else
        echo "  (无)"
    fi
    
    echo ""
    
    # CSV 导出
    echo -e "${YELLOW}CSV 导出 ($EXPORTS_DIR):${NC}"
    if ls -d "$EXPORTS_DIR"/*/ 2>/dev/null | head -5 > /dev/null; then
        for d in $(ls -dt "$EXPORTS_DIR"/*/ 2>/dev/null | head -10); do
            NAME=$(basename "$d")
            if [ -f "$d/manifest.json" ]; then
                TABLES=$(grep -o '"tables_exported": [0-9]*' "$d/manifest.json" | grep -o '[0-9]*')
                ROWS=$(grep -o '"total_rows": [0-9]*' "$d/manifest.json" | grep -o '[0-9]*')
                echo "  📁 $NAME - ${TABLES:-?} 表, ${ROWS:-?} 条记录"
            else
                echo "  📁 $NAME"
            fi
        done
    else
        echo "  (无)"
    fi
    
    echo ""
}

# ============================================
# 主程序
# ============================================

show_banner
check_docker

ACTION="${1:-export}"

case "$ACTION" in
    export)
        export_to_csv
        ;;
    backup)
        backup_full_sql
        ;;
    list)
        show_backups
        ;;
    *)
        echo -e "${RED}未知操作: $ACTION${NC}"
        echo "用法: $0 [export|backup|list]"
        exit 1
        ;;
esac

echo -e "${GREEN}完成!${NC}\n"
