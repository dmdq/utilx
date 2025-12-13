#!/bin/bash

# macOS 应用公证脚本
# 用于对已构建的 DMG 进行公证和装订

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${PROJECT_ROOT}/dist"
BUNDLE_ID="cn.util.app"

# 检查环境变量
check_env() {
    echo -e "${BLUE}🔍 检查环境变量...${NC}"

    if [ -z "$APPLE_ID" ]; then
        echo -e "${RED}❌ 错误: 请设置 APPLE_ID 环境变量${NC}"
        echo "export APPLE_ID=\"your@apple.id\""
        exit 1
    fi

    if [ -z "$APPLE_PASSWORD" ]; then
        echo -e "${RED}❌ 错误: 请设置 APPLE_PASSWORD 环境变量${NC}"
        echo "export APPLE_PASSWORD=\"app-specific-password\""
        exit 1
    fi

    if [ -z "$APPLE_TEAM_ID" ]; then
        echo -e "${RED}❌ 错误: 请设置 APPLE_TEAM_ID 环境变量${NC}"
        echo "export APPLE_TEAM_ID=\"your-team-id\""
        exit 1
    fi

    echo -e "${GREEN}✅ 环境变量检查通过${NC}"
}

# 查找 DMG 文件
find_dmg() {
    echo -e "${BLUE}📦 查找 DMG 文件...${NC}"

    local dmg_file=$(find "$DIST_DIR" -name "*.dmg" -type f | head -1)

    if [ -z "$dmg_file" ]; then
        echo -e "${RED}❌ 错误: 在 ${DIST_DIR} 中未找到 DMG 文件${NC}"
        exit 1
    fi

    echo "找到 DMG: $dmg_file"
    echo "$dmg_file"
}

# 上传公证
upload_notarization() {
    local dmg_file="$1"

    echo -e "${BLUE}📤 上传应用公证...${NC}"
    echo "DMG 文件: $dmg_file"

    # 上传公证请求
    local result=$(xcrun altool --notarize-app \
        --primary-bundle-id "$BUNDLE_ID" \
        --username "$APPLE_ID" \
        --password "$APPLE_PASSWORD" \
        --asc-provider "$APPLE_TEAM_ID" \
        --file "$dmg_file" \
        --output-format xml)

    echo "$result"

    # 提取请求 UUID
    local request_uuid=$(echo "$result" | xpath -e "//key[text()='RequestUUID']/following-sibling::string[1]/text()" 2>/dev/null || echo "")

    if [ -z "$request_uuid" ]; then
        echo -e "${RED}❌ 错误: 无法获取公证请求 UUID${NC}"
        exit 1
    fi

    echo "公证请求 UUID: $request_uuid"
    echo "$request_uuid"
}

# 检查公证状态
check_notarization_status() {
    local request_uuid="$1"

    echo -e "${BLUE}🔍 检查公证状态...${NC}"
    echo "请求 UUID: $request_uuid"

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        echo "检查状态 (尝试 $attempt/$max_attempts)..."

        local result=$(xcrun altool --notarization-info "$request_uuid" \
            --username "$APPLE_ID" \
            --password "$APPLE_PASSWORD" \
            --output-format xml 2>/dev/null)

        echo "$result"

        # 检查状态
        local status=$(echo "$result" | xpath -e "//key[text()='Status']/following-sibling::string[1]/text()" 2>/dev/null || echo "")

        case "$status" in
            "Success")
                echo -e "${GREEN}✅ 公证成功！${NC}"
                return 0
                ;;
            "Invalid")
                echo -e "${RED}❌ 公证失败: 无效${NC}"
                echo "$result"
                return 1
                ;;
            "Rejected")
                echo -e "${RED}❌ 公证失败: 被拒绝${NC}"
                echo "$result"
                return 1
                ;;
            "In Progress")
                echo -e "${YELLOW}⏳ 公证进行中，等待 30 秒...${NC}"
                sleep 30
                ;;
            *)
                echo -e "${YELLOW}⏳ 未知状态: $status，等待 30 秒...${NC}"
                sleep 30
                ;;
        esac

        attempt=$((attempt + 1))
    done

    echo -e "${RED}❌ 公证超时${NC}"
    return 1
}

# 装订票据
staple_ticket() {
    local dmg_file="$1"

    echo -e "${BLUE}📋 装订公证票据...${NC}"
    echo "DMG 文件: $dmg_file"

    # 装订票据
    xcrun stapler staple "$dmg_file"

    # 验证装订
    if xcrun stapler validate "$dmg_file"; then
        echo -e "${GREEN}✅ 票据装订成功${NC}"
    else
        echo -e "${RED}❌ 票据装订失败${NC}"
        return 1
    fi
}

# 显示公证信息
show_notarization_info() {
    local dmg_file="$1"

    echo -e "${BLUE}📊 公证信息:${NC}"
    echo "文件: $dmg_file"
    echo "Bundle ID: $BUNDLE_ID"
    echo ""

    # 显示文件信息
    if [ -f "$dmg_file" ]; then
        local file_size=$(du -sh "$dmg_file" | cut -f1)
        echo "文件大小: $file_size"
    fi

    # 显示公证状态（如果已装订）
    if command -v spctl &> /dev/null; then
        echo "公证状态:"
        spctl -a -vvv "$dmg_file" || true
    fi
}

# 主函数
main() {
    echo -e "${GREEN}🎯 macOS 应用公证开始${NC}"
    echo "时间: $(date)"
    echo ""

    check_env

    local dmg_file
    dmg_file=$(find_dmg)

    local request_uuid
    request_uuid=$(upload_notarization "$dmg_file")

    echo -e "${YELLOW}⏳ 等待公证完成（这可能需要几分钟）...${NC}"
    echo "您可以使用以下命令手动检查状态:"
    echo "xcrun altool --notarization-info $request_uuid --username $APPLE_ID --password $APPLE_PASSWORD"
    echo ""

    if check_notarization_status "$request_uuid"; then
        staple_ticket "$dmg_file"
        show_notarization_info "$dmg_file"

        echo ""
        echo -e "${GREEN}🎉 公证完成！${NC}"
        echo "应用已成功公证并装订票据"
    else
        echo ""
        echo -e "${RED}❌ 公证失败${NC}"
        echo "请检查 Apple Developer 控制台获取详细信息"
        exit 1
    fi
}

# 脚本选项
case "${1:-}" in
    "status")
        if [ -z "$2" ]; then
            echo -e "${RED}❌ 请提供公证请求 UUID${NC}"
            echo "用法: $0 status <uuid>"
            exit 1
        fi
        check_env
        check_notarization_status "$2"
        ;;
    "staple")
        if [ -z "$2" ]; then
            local dmg_file
            dmg_file=$(find_dmg)
            staple_ticket "$dmg_file"
        else
            staple_ticket "$2"
        fi
        ;;
    "validate")
        if [ -z "$2" ]; then
            local dmg_file
            dmg_file=$(find_dmg)
            show_notarization_info "$dmg_file"
        else
            show_notarization_info "$2"
        fi
        ;;
    "help"|"-h"|"--help")
        echo "用法: $0 [选项] [参数]"
        echo ""
        echo "选项:"
        echo "  (无参数)     - 完整的公证流程"
        echo "  status <uuid> - 检查指定 UUID 的公证状态"
        echo "  staple [file] - 装订公证票据"
        echo "  validate [file] - 验证公证状态"
        echo "  help         - 显示此帮助信息"
        echo ""
        echo "环境变量:"
        echo "  APPLE_ID       - Apple ID"
        echo "  APPLE_PASSWORD - App 专用密码"
        echo "  APPLE_TEAM_ID  - Apple 团队 ID"
        echo ""
        echo "示例:"
        echo "  export APPLE_ID=\"your@apple.id\""
        echo "  export APPLE_PASSWORD=\"abcd-efgh-ijkl-mnop\""
        echo "  export APPLE_TEAM_ID=\"ABCD123456\""
        echo "  $0"
        echo ""
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo -e "${RED}❌ 未知选项: $1${NC}"
        echo "使用 $0 help 查看帮助"
        exit 1
        ;;
esac