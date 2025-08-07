package model_setting

import (
	"math/rand"
	"one-api/setting/config"
	"time"
)

// RegionConfig 定义区域配置
type RegionConfig struct {
	Region string  `json:"region"`
	Weight float64 `json:"weight"`
}

// GeminiSettings 定义Gemini模型的配置
type GeminiSettings struct {
	SafetySettings                        map[string]string         `json:"safety_settings"`
	VersionSettings                       map[string]string         `json:"version_settings"`
	RegionSettings                        map[string][]RegionConfig `json:"region_settings"`
	SupportedImagineModels                []string                  `json:"supported_imagine_models"`
	ThinkingAdapterEnabled                bool                      `json:"thinking_adapter_enabled"`
	ThinkingAdapterBudgetTokensPercentage float64                   `json:"thinking_adapter_budget_tokens_percentage"`
}

// 默认配置
var defaultGeminiSettings = GeminiSettings{
	SafetySettings: map[string]string{
		"default":                       "OFF",
		"HARM_CATEGORY_CIVIC_INTEGRITY": "BLOCK_NONE",
	},
	VersionSettings: map[string]string{
		"default":        "v1beta",
		"gemini-1.0-pro": "v1",
	},
	RegionSettings: map[string][]RegionConfig{
		"default": {
			{Region: "global", Weight: 1.0},
		},
	},
	SupportedImagineModels: []string{
		"gemini-2.0-flash-exp-image-generation",
		"gemini-2.0-flash-exp",
	},
	ThinkingAdapterEnabled:                false,
	ThinkingAdapterBudgetTokensPercentage: 0.6,
}

// 全局实例
var geminiSettings = defaultGeminiSettings

func init() {
	// 注册到全局配置管理器
	config.GlobalConfig.Register("gemini", &geminiSettings)
}

// GetGeminiSettings 获取Gemini配置
func GetGeminiSettings() *GeminiSettings {
	return &geminiSettings
}

// GetGeminiSafetySetting 获取安全设置
func GetGeminiSafetySetting(key string) string {
	if value, ok := geminiSettings.SafetySettings[key]; ok {
		return value
	}
	return geminiSettings.SafetySettings["default"]
}

// GetGeminiVersionSetting 获取版本设置
func GetGeminiVersionSetting(key string) string {
	if value, ok := geminiSettings.VersionSettings[key]; ok {
		return value
	}
	return geminiSettings.VersionSettings["default"]
}

// GetGeminiRegionSetting 获取区域设置
func GetGeminiRegionSetting(key string) []RegionConfig {
	if regions, ok := geminiSettings.RegionSettings[key]; ok {
		return regions
	}
	return geminiSettings.RegionSettings["default"]
}

// SelectGeminiRegionByWeight 基于权重选择区域
func SelectGeminiRegionByWeight(modelName string) string {
	regions := GetGeminiRegionSetting(modelName)
	if len(regions) == 0 {
		return ""
	}

	if len(regions) == 1 {
		return regions[0].Region
	}

	// 计算总权重
	totalWeight := 0.0
	for _, r := range regions {
		totalWeight += r.Weight
	}

	if totalWeight <= 0 {
		return regions[0].Region // 如果权重为0或负数，返回第一个
	}

	// 生成随机数选择区域
	random := rand.New(rand.NewSource(time.Now().UnixNano())).Float64() * totalWeight
	current := 0.0
	for _, r := range regions {
		current += r.Weight
		if random <= current {
			return r.Region
		}
	}

	return regions[0].Region // 兜底返回第一个
}

func IsGeminiModelSupportImagine(model string) bool {
	for _, v := range geminiSettings.SupportedImagineModels {
		if v == model {
			return true
		}
	}
	return false
}
