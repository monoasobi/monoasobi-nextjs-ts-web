"use client";

import { CheckIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Callout, Text } from "@radix-ui/themes";
import type { FormEvent } from "react";
import styles from "../AdminPage.module.css";
import { AdminEditorField } from "./AdminEditorField";
import type { AdminMessage, EditorFieldConfig } from "./types";

interface AdminEditorFormProps {
  formId: string;
  fields: EditorFieldConfig[];
  message: AdminMessage | null;
  visibilityFlags: Record<string, boolean>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onVisibilityChange: (key: string, value: boolean) => void;
}

export const AdminEditorForm = ({
  formId,
  fields,
  message,
  visibilityFlags,
  onSubmit,
  onVisibilityChange,
}: AdminEditorFormProps) => (
  <form id={formId} className={styles.documentBody} onSubmit={onSubmit}>
    {fields.map((field) => (
      <div className={styles.fieldRow} key={field.name}>
        <Text className={styles.fieldKey} size="2">
          {field.label}
          {"required" in field && field.required && (
            <span className={styles.requiredMark} aria-label="필수값">
              *
            </span>
          )}
        </Text>
        <div className={styles.fieldValue}>
          <AdminEditorField
            field={field}
            visibilityFlags={visibilityFlags}
            onVisibilityChange={onVisibilityChange}
          />
        </div>
      </div>
    ))}
    {message && <AdminEditorMessage message={message} />}
  </form>
);

export const AdminEditorMessage = ({
  message,
}: {
  message: AdminMessage;
}) => (
  <Callout.Root
    className={styles.editorMessage}
    size="2"
    color={message.tone === "error" ? "red" : "green"}
    variant="soft"
  >
    <Callout.Icon>
      {message.tone === "error" ? (
        <ExclamationTriangleIcon width="16" height="16" />
      ) : (
        <CheckIcon width="16" height="16" />
      )}
    </Callout.Icon>
    <Callout.Text>{message.text}</Callout.Text>
  </Callout.Root>
);
