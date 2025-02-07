import { useEffect, useRef, useState } from 'react';
import { Modal, Tabs, Input, Button, Space, Typography, Form } from 'antd';
import { CheckOutlined, CopyOutlined, EditOutlined } from '@ant-design/icons';
import styled from 'styled-components';

import { useSecurityContext } from '../../hooks';
import { copyToClipboard } from '../../utils';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Text, Link } = Typography;

type TFlexBoxProps = {
  editing: boolean;
};

const FlexBox = styled.div<TFlexBoxProps>`
  display: flex;
  gap: 8px;

  input {
    text-overflow: ${(props) => (props.editing ? 'unset' : 'ellipsis')};
  }
`;

export function SecurityContext() {
  const {
    payload,
    token,
    isModalOpen,
    setIsModalOpen,
    saveToken,
    onTokenPayloadChange,
  } = useSecurityContext();

  const [form] = Form.useForm();
  const [editingToken, setEditingToken] = useState(false);
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [tmpPayload, setPayload] = useState<string>(payload || '');
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    if (editingToken) {
      inputRef.current?.focus();
    }
  }, [editingToken]);

  useEffect(() => {
    setEditingToken(!token);
    setPayload(payload);

    form.setFieldsValue({
      token,
    });
  }, [form, token, payload]);

  function handleTokenSave(values) {
    saveToken(values?.token || null);
    setEditingToken(false);
    setIsModalOpen(false);
  }

  function handlePayloadChange(event) {
    const { value } = event.target;
    setPayload(value);

    try {
      JSON.parse(value);
      setIsJsonValid(true);
    } catch (error) {
      setIsJsonValid(false);
    }
  }

  async function handlePayloadSave() {
    if (isJsonValid) {
      if (typeof onTokenPayloadChange !== 'function') {
        throw new Error(
          'Saving token requires the `onTokenPayloadChange` function provided to the `SecurityContext`'
        );
      }

      setSubmitting(true);

      try {
        saveToken(await onTokenPayloadChange(tmpPayload || ''));
      } catch (error) {
        console.error(error);
      }

      setSubmitting(false);
    } else if (!tmpPayload) {
      saveToken(null);
    }

    setIsModalOpen(false);
  }

  return (
    <Modal
      title="Security Context"
      visible={isModalOpen}
      footer={null}
      bodyStyle={{
        paddingTop: 16,
      }}
      onCancel={() => {
        setIsModalOpen(false);
        setEditingToken(false);
      }}
    >
      <div data-testid="security-context-modal">
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <Tabs
            defaultActiveKey="json"
            style={{ minHeight: 200 }}
            onChange={(tabKey) => {
              if (tabKey !== 'token' && editingToken && token) {
                setEditingToken(false);
                form.resetFields();
              }
            }}
          >
            <TabPane tab="JSON" key="json">
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <TextArea
                  data-testid="security-context-textarea"
                  value={tmpPayload || ''}
                  rows={6}
                  style={{ width: '100%' }}
                  onChange={handlePayloadChange}
                />

                <Button
                  data-testid="save-security-context-payload-btn"
                  type="primary"
                  disabled={Boolean(tmpPayload && !isJsonValid)}
                  loading={isSubmitting}
                  onClick={handlePayloadSave}
                >
                  Save
                </Button>
              </Space>
            </TabPane>

            <TabPane data-testid="security-modal-token-tab" tab="Token" key="token">
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Text type="secondary">
                  Edit or copy the generated token from below
                </Text>

                <Form
                  form={form}
                  initialValues={{
                    token,
                  }}
                  onFinish={handleTokenSave}
                >
                  <FlexBox editing={editingToken}>
                    <Form.Item
                      name="token"
                      style={{
                        width: 'auto',
                        flexGrow: 1,
                      }}
                    >
                      <Input
                        data-testid="security-context-token-input"
                        ref={inputRef}
                        disabled={!editingToken}
                      />
                    </Form.Item>

                    {!editingToken ? (
                      <>
                        <Button
                          ghost
                          type="primary"
                          icon={<EditOutlined />}
                          onClick={() => {
                            setEditingToken(true);
                          }}
                        />
                        <Button
                          type="primary"
                          icon={<CopyOutlined />}
                          disabled={!token}
                          onClick={() => copyToClipboard(token)}
                        >
                          Copy
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        htmlType="submit"
                      />
                    )}
                  </FlexBox>
                </Form>
              </Space>
            </TabPane>
          </Tabs>

          <Text type="secondary">
            Learn more about Security Context in{' '}
            <Link href="https://cube.dev/docs/security/context" target="_blank">
              docs
            </Link>
          </Text>
        </Space>
      </div>
    </Modal>
  );
}
