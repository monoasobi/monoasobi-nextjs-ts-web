"use client";

import { Checkbox, Select, Text, TextArea, TextField } from "@radix-ui/themes";
import styles from "../AdminPage.module.css";
import type { EditorFieldConfig } from "./types";

interface AdminEditorFieldProps {
  field: EditorFieldConfig;
  visibilityFlags: Record<string, boolean>;
  onVisibilityChange: (key: string, value: boolean) => void;
}

export const AdminEditorField = ({
  field,
  visibilityFlags,
  onVisibilityChange,
}: AdminEditorFieldProps) => {
  if (field.type === "textarea") {
    return (
      <TextArea
        className={`${styles.editorInput} ${styles.editorTextarea}`}
        name={field.name}
        defaultValue={field.defaultValue ?? ""}
        required={field.required}
      />
    );
  }

  if (field.type === "readonly") {
    return (
      <>
        <input type="hidden" name={field.name} value={field.defaultValue} />
        <Text className={styles.readonlyValue} size="2">
          {field.displayValue ?? field.defaultValue}
        </Text>
      </>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className={styles.editorCheckboxLabel}>
        <Checkbox
          name={field.name}
          checked={visibilityFlags[field.name] ?? field.defaultChecked ?? false}
          onCheckedChange={(checked) =>
            onVisibilityChange(field.name, checked === true)
          }
        />
        <Text size="2">{field.label}</Text>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <Select.Root
        name={field.name}
        defaultValue={field.defaultValue ?? ""}
        size="2"
      >
        <Select.Trigger className={styles.editorInput} />
        <Select.Content>
          {field.options.map((option) => (
            <Select.Item key={option.value} value={option.value}>
              {option.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    );
  }

  return (
    <TextField.Root
      className={styles.editorInput}
      name={field.name}
      type={field.type}
      defaultValue={field.defaultValue ?? ""}
      required={field.required}
      step={field.type === "number" ? "any" : undefined}
    />
  );
};
