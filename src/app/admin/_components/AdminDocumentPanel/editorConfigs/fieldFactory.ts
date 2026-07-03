import type { EditorFieldConfig, EditorFieldConfigBase } from "../types";

export const field = (
  name: string,
  label: string,
  defaultValue?: string | null,
  required = false,
  options: Pick<EditorFieldConfigBase, "showWhen"> = {},
): EditorFieldConfig => ({
  type: "text",
  name,
  label,
  defaultValue,
  required,
  ...options,
});

export const urlField = (
  name: string,
  label: string,
  defaultValue?: string | null,
  required = false,
  options: Pick<EditorFieldConfigBase, "showWhen"> = {},
): EditorFieldConfig => ({
  type: "url",
  name,
  label,
  defaultValue,
  required,
  ...options,
});

export const readonlyField = (
  name: string,
  label: string,
  defaultValue: string,
  displayValue?: string,
  required = false,
): EditorFieldConfig => ({
  type: "readonly",
  name,
  label,
  defaultValue,
  displayValue,
  required,
});

export const numberField = (
  name: string,
  label: string,
  defaultValue?: number,
  required = false,
): EditorFieldConfig => ({
  type: "number",
  name,
  label,
  defaultValue,
  required,
});

export const textareaField = (
  name: string,
  label: string,
  defaultValue?: string,
  required = false,
): EditorFieldConfig => ({
  type: "textarea",
  name,
  label,
  defaultValue,
  required,
});

export const checkboxField = (
  name: string,
  label: string,
  defaultChecked: boolean,
): EditorFieldConfig => ({
  type: "checkbox",
  name,
  label,
  defaultChecked,
});

export const selectField = (
  name: string,
  label: string,
  defaultValue: string,
  options: { value: string; label: string }[],
  fieldOptions: Pick<EditorFieldConfigBase, "showWhen"> = {},
): EditorFieldConfig => ({
  type: "select",
  name,
  label,
  defaultValue,
  options,
  ...fieldOptions,
});
