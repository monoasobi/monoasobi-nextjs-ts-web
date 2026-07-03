"use client";

import {
  CheckIcon,
  MusicalNoteIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  AlertDialog,
  Badge,
  Button,
  Flex,
  Heading,
  IconButton,
  ScrollArea,
  Separator,
  Text,
  Tooltip,
} from "@radix-ui/themes";
import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import type { AdminDashboardData, SelectedNode } from "./AdminDashboard";
import { AdminEditorForm, AdminEditorMessage } from "./AdminDocumentPanel/AdminEditorForm";
import { getEditorConfig } from "./AdminDocumentPanel/adminEditorConfig";
import { getSelectedDocument } from "./AdminDocumentPanel/adminSelectedDocument";
import type {
  AdminMessage,
  EditorConfig,
} from "./AdminDocumentPanel/types";
import {
  getErrorMessage,
  getInitialVisibilityFlags,
  getSelectedNodeKey,
} from "./AdminDocumentPanel/utils";
import styles from "./AdminPage.module.css";

interface AdminDocumentPanelProps {
  data: AdminDashboardData;
  selectedNode: SelectedNode;
  onSaved: () => void;
}

export const AdminDocumentPanel = ({
  data,
  selectedNode,
  onSaved,
}: AdminDocumentPanelProps) => {
  const selectedDocument = getSelectedDocument(data, selectedNode);
  const config = getEditorConfig(data, selectedNode);
  const isNewDocument = config?.method === "POST";
  const [isEditing, setIsEditing] = useState(Boolean(isNewDocument));
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const [visibilityFlags, setVisibilityFlags] = useState<
    Record<string, boolean>
  >(() => getInitialVisibilityFlags(config));
  const formId = `admin-form-${getSelectedNodeKey(selectedNode).replace(
    /[^a-zA-Z0-9]/g,
    "-",
  )}`;

  const handleCancel = () => {
    setMessage(null);
    setIsEditing(false);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
    config: EditorConfig,
  ) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    let payload: Record<string, unknown>;

    try {
      payload = config.toPayload(formData);
    } catch {
      setIsSaving(false);
      setMessage({
        tone: "error",
        text: "입력값을 확인해주세요. lyricJson은 유효한 JSON이어야 합니다.",
      });
      return;
    }

    const response = await fetch(config.endpoint, {
      method: config.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setIsSaving(false);

    if (!response.ok) {
      setMessage({
        tone: "error",
        text: await getErrorMessage(response, "저장에 실패했습니다."),
      });
      return;
    }

    setMessage({
      tone: "success",
      text: config.method === "POST" ? "생성했습니다." : "저장했습니다.",
    });
    setIsEditing(false);
    onSaved();
  };

  const handleDelete = async (config: EditorConfig) => {
    if (!config.deleteEndpoint) return;

    setIsSaving(true);
    setMessage(null);

    const response = await fetch(config.deleteEndpoint, { method: "DELETE" });
    setIsSaving(false);

    if (!response.ok) {
      setMessage({
        tone: "error",
        text: await getErrorMessage(response, "삭제에 실패했습니다."),
      });
      return;
    }

    setMessage({ tone: "success", text: "삭제했습니다." });
    onSaved();
  };

  const visibleFields =
    config?.fields.filter(
      (field) => !field.showWhen || field.showWhen(visibilityFlags),
    ) ?? [];

  return (
    <>
      <Flex className={styles.consolePanelHeader} justify="between" gap="3">
        <Flex direction="column" flexGrow="1" gap="1">
          <Text size="1" color="gray" weight="bold">
            Document
          </Text>
          <div className={styles.documentTitleRow}>
            <Heading size="4">{selectedDocument.title}</Heading>
            {config && isEditing && config.deleteEndpoint && (
              <DeleteDialog
                disabled={isSaving}
                title={selectedDocument.title}
                description={config.deleteDescription}
                onDelete={() => handleDelete(config)}
              />
            )}
          </div>
        </Flex>
        <Flex align="center" gap="2" className={styles.documentActions}>
          <Badge variant="outline">{selectedDocument.collection}</Badge>
          {selectedNode.type === "lyric" && (
            <Tooltip content="Timeline 편집">
              <Button asChild size="1" variant="soft">
                <Link href={`/admin/lyrics/${selectedNode.id}/timeline`}>
                  <MusicalNoteIcon width="14" height="14" />
                  Timeline
                </Link>
              </Button>
            </Tooltip>
          )}
          {config && isEditing ? (
            <>
              <Separator orientation="vertical" decorative />
              <div className={styles.actionGroup}>
                <Tooltip content={config.submitLabel}>
                  <IconButton
                    type="submit"
                    form={formId}
                    size="1"
                    disabled={isSaving}
                    aria-label={config.submitLabel}
                  >
                    <CheckIcon width="16" height="16" />
                  </IconButton>
                </Tooltip>
                <Tooltip content="취소">
                  <IconButton
                    type="button"
                    size="1"
                    variant="soft"
                    color="gray"
                    disabled={isSaving}
                    aria-label="취소"
                    onClick={handleCancel}
                  >
                    <XMarkIcon width="16" height="16" />
                  </IconButton>
                </Tooltip>
              </div>
            </>
          ) : (
            config && (
              <Tooltip content={isNewDocument ? "작성" : "수정"}>
                <IconButton
                  type="button"
                  size="1"
                  variant="soft"
                  aria-label={isNewDocument ? "작성" : "수정"}
                  onClick={() => setIsEditing(true)}
                >
                  <PencilSquareIcon width="16" height="16" />
                </IconButton>
              </Tooltip>
            )
          )}
        </Flex>
      </Flex>

      <ScrollArea
        className={styles.documentScroll}
        type="auto"
        scrollbars="vertical"
      >
        {config && isEditing ? (
          <AdminEditorForm
            formId={formId}
            fields={visibleFields}
            message={message}
            visibilityFlags={visibilityFlags}
            onSubmit={(event) => handleSubmit(event, config)}
            onVisibilityChange={(key, value) =>
              setVisibilityFlags((prev) => ({
                ...prev,
                [key]: value,
              }))
            }
          />
        ) : (
          <div className={styles.documentBody}>
            {selectedDocument.fields.map((field) => (
              <div className={styles.fieldRow} key={field.key}>
                <Text className={styles.fieldKey} size="2">
                  {field.key}
                </Text>
                <Text className={styles.fieldValue} size="2">
                  {field.value}
                </Text>
              </div>
            ))}
            {selectedDocument.jsonText && (
              <section className={styles.jsonSection}>
                <Text size="2" weight="bold">
                  lyricJson
                </Text>
                <pre className={styles.jsonBox}>
                  {selectedDocument.jsonText}
                </pre>
              </section>
            )}
            {message && <AdminEditorMessage message={message} />}
          </div>
        )}
      </ScrollArea>
    </>
  );
};

const DeleteDialog = ({
  disabled,
  title,
  description,
  onDelete,
}: {
  disabled: boolean;
  title: string;
  description: string;
  onDelete: () => void;
}) => (
  <AlertDialog.Root>
    <Tooltip content="삭제">
      <AlertDialog.Trigger>
        <IconButton
          type="button"
          size="1"
          color="red"
          variant="ghost"
          disabled={disabled}
          aria-label="삭제"
        >
          <TrashIcon width="16" height="16" />
        </IconButton>
      </AlertDialog.Trigger>
    </Tooltip>
    <AlertDialog.Content maxWidth="420px">
      <AlertDialog.Title>문서를 삭제할까요?</AlertDialog.Title>
      <AlertDialog.Description size="2">
        {title} 문서를 삭제합니다. {description}
      </AlertDialog.Description>
      <Flex gap="3" justify="end">
        <AlertDialog.Cancel>
          <Button type="button" variant="soft" color="gray">
            취소
          </Button>
        </AlertDialog.Cancel>
        <AlertDialog.Action>
          <Button type="button" color="red" onClick={onDelete}>
            삭제
          </Button>
        </AlertDialog.Action>
      </Flex>
    </AlertDialog.Content>
  </AlertDialog.Root>
);
