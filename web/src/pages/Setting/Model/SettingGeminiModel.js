import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row, Spin } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';
import Text from '@douyinfe/semi-ui/lib/es/typography/text.js';

const GEMINI_SETTING_EXAMPLE = {
  default: 'OFF',
  HARM_CATEGORY_CIVIC_INTEGRITY: 'BLOCK_NONE',
};

const GEMINI_VERSION_EXAMPLE = {
  default: 'v1beta',
};

const GEMINI_REGION_EXAMPLE = {
  "default": [
    {"region": "global", "weight": 1},
    {"region": "europe-central2", "weight": 1},
    {"region": "asia-northeast1", "weight": 1}
  ],
  "gemini-2.5-pro": [
    {"region": "europe-central2", "weight": 2},
    {"region": "us-central1", "weight": 1},
    {"region": "global", "weight": 1}
  ],
  "gemini-2.5-flash": [
    {"region": "europe-central2", "weight": 1}
  ]
};

export default function SettingGeminiModel(props) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    'gemini.safety_settings': '',
    'gemini.version_settings': '',
    'gemini.region_settings': '',
    'gemini.supported_imagine_models': '',
    'gemini.thinking_adapter_enabled': false,
    'gemini.thinking_adapter_budget_tokens_percentage': 0.6,
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState({});

  async function onSubmit() {
    await refForm.current
      .validate()
      .then(() => {
        const updateArray = compareObjects(inputs, inputsRow);
        if (!updateArray.length) return showWarning(t('你似乎并没有修改什么'));
        const requestQueue = updateArray.map((item) => {
          let value = String(inputs[item.key]);
          return API.put('/api/option/', {
            key: item.key,
            value,
          });
        });
        setLoading(true);
        Promise.all(requestQueue)
          .then((res) => {
            if (requestQueue.length === 1) {
              if (res.includes(undefined)) return;
            } else if (requestQueue.length > 1) {
              if (res.includes(undefined))
                return showError(t('部分保存失败，请重试'));
            }
            showSuccess(t('保存成功'));
            props.refresh();
          })
          .catch(() => {
            showError(t('保存失败，请重试'));
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .catch((error) => {
        console.error('Validation failed:', error);
        showError(t('请检查输入'));
      });
  }

  useEffect(() => {
    if (!props.options || !refForm.current) {
      return;
    }

    const currentInputs = {};
    // 初始化所有表单字段，包括新添加的字段
    for (let key in inputs) {
      currentInputs[key] = props.options[key] !== undefined ? props.options[key] : inputs[key];
    }

    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    refForm.current.setValues(currentInputs);
  }, [props.options]);

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('Gemini设置')}>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.TextArea
                  label={t('Gemini安全设置')}
                  placeholder={
                    t('为一个 JSON 文本，例如：') +
                    '\n' +
                    JSON.stringify(GEMINI_SETTING_EXAMPLE, null, 2)
                  }
                  field={'gemini.safety_settings'}
                  extraText={t(
                    'default为默认设置，可单独设置每个分类的安全等级',
                  )}
                  autosize={{ minRows: 6, maxRows: 12 }}
                  trigger='blur'
                  stopValidateWithError
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t('不是合法的 JSON 字符串'),
                    },
                  ]}
                  onChange={(value) =>
                    setInputs({ ...inputs, 'gemini.safety_settings': value })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.TextArea
                  label={t('Gemini版本设置')}
                  placeholder={
                    t('为一个 JSON 文本，例如：') +
                    '\n' +
                    JSON.stringify(GEMINI_VERSION_EXAMPLE, null, 2)
                  }
                  field={'gemini.version_settings'}
                  extraText={t('default为默认设置，可单独设置每个模型的版本')}
                  autosize={{ minRows: 6, maxRows: 12 }}
                  trigger='blur'
                  stopValidateWithError
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t('不是合法的 JSON 字符串'),
                    },
                  ]}
                  onChange={(value) =>
                    setInputs({ ...inputs, 'gemini.version_settings': value })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.TextArea
                  label={t('Gemini区域设置')}
                  placeholder={
                    t('为一个 JSON 文本，例如：') +
                    '\n' +
                    JSON.stringify(GEMINI_REGION_EXAMPLE, null, 2)
                  }
                  field={'gemini.region_settings'}
                  extraText={t(
                    '配置Gemini模型的全局区域和权重分配，weight相同表示等概率选择。仅对Vertex AI渠道中的Gemini模型生效',
                  )}
                  autosize={{ minRows: 6, maxRows: 12 }}
                  trigger='blur'
                  stopValidateWithError
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t('不是合法的 JSON 字符串'),
                    },
                  ]}
                  onChange={(value) =>
                    setInputs({ ...inputs, 'gemini.region_settings': value })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.TextArea
                  field={'gemini.supported_imagine_models'}
                  label={t('支持的图像模型')}
                  placeholder={t('例如：') + '\n' + JSON.stringify(['gemini-2.0-flash-exp-image-generation'], null, 2)}
                  onChange={(value) => setInputs({ ...inputs, 'gemini.supported_imagine_models': value })}
                  trigger='blur'
                  stopValidateWithError
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t('不是合法的 JSON 字符串'),
                    },
                  ]}
                />
              </Col>
            </Row>
          </Form.Section>

          <Form.Section text={t('Gemini思考适配设置')}>
            <Row>
              <Col span={16}>
                <Text>
                  {t(
                    "和Claude不同，默认情况下Gemini的思考模型会自动决定要不要思考，就算不开启适配模型也可以正常使用，" +
                    "如果您需要计费，推荐设置无后缀模型价格按思考价格设置"
                  )}
                </Text>
              </Col>
            </Row>
            <Row>
              <Col span={16}>
                <Form.Switch
                  label={t('启用Gemini思考后缀适配')}
                  field={'gemini.thinking_adapter_enabled'}
                  extraText={"适配-thinking和-nothinking后缀"}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'gemini.thinking_adapter_enabled': value,
                    })
                  }
                />
              </Col>
            </Row>
            <Row>
              <Col span={16}>
                <Text>
                  {t(
                    'Gemini思考适配 BudgetTokens = MaxTokens * BudgetTokens 百分比',
                  )}
                </Text>
              </Col>
            </Row>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.InputNumber
                  label={t('请求模型带-thinking后缀的BudgetTokens数（超出24576的部分将被忽略）')}
                  field={'gemini.thinking_adapter_budget_tokens_percentage'}
                  initValue={''}
                  extraText={t('0.1-1之间的小数')}
                  min={0.1}
                  max={1}
                  onChange={(value) =>
                    setInputs({
                      ...inputs,
                      'gemini.thinking_adapter_budget_tokens_percentage': value,
                    })
                  }
                />
              </Col>
            </Row>
          </Form.Section>

          <Row>
            <Button size='default' onClick={onSubmit}>
              {t('保存')}
            </Button>
          </Row>
        </Form>
      </Spin>
    </>
  );
}
