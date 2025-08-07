package vertex

import (
	"one-api/common"
	"one-api/setting/model_setting"
	"strings"
)

func GetModelRegion(other string, localModelName string) string {

	// 1. 回退到渠道自带的区域配置（现有逻辑）
	if common.IsJsonStr(other) {
		m := common.StrToMap(other)
		if m[localModelName] != nil {
			return m[localModelName].(string)
		}
	}
	// 2. 优先检查全局Gemini区域配置（仅对Gemini模型生效）
	if isGeminiModel(localModelName) {
		if globalRegion := model_setting.SelectGeminiRegionByWeight(localModelName); globalRegion != "" {
			return globalRegion
		}
	}
	return "global"
}

// isGeminiModel 判断是否为Gemini模型
func isGeminiModel(modelName string) bool {
	return strings.HasPrefix(modelName, "gemini") || strings.Contains(modelName, "gemini")
}
