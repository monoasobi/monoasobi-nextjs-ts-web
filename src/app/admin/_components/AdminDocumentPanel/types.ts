export type AdminMessage = {
  tone: "success" | "error";
  text: string;
};

export type DocumentField = {
  key: string;
  value: string;
};

export type SelectedDocument = {
  collection: string;
  title: string;
  fields: DocumentField[];
  jsonText?: string;
};

export type EditorFieldConfigBase = {
  name: string;
  label: string;
  showWhen?: (flags: Record<string, boolean>) => boolean;
};

export type EditorFieldConfig =
  | (EditorFieldConfigBase & {
      type: "text" | "url" | "number";
      defaultValue?: string | number | null;
      required?: boolean;
    })
  | (EditorFieldConfigBase & {
      type: "readonly";
      defaultValue: string;
      displayValue?: string;
      required?: boolean;
    })
  | (EditorFieldConfigBase & {
      type: "textarea";
      defaultValue?: string | null;
      required?: boolean;
    })
  | (EditorFieldConfigBase & {
      type: "checkbox";
      defaultChecked?: boolean;
    })
  | (EditorFieldConfigBase & {
      type: "select";
      defaultValue?: string;
      options: { value: string; label: string }[];
    });

export interface EditorConfig {
  title: string;
  submitLabel: string;
  endpoint: string;
  deleteEndpoint?: string;
  deleteDescription: string;
  method: "POST" | "PUT";
  fields: EditorFieldConfig[];
  toPayload: (formData: FormData) => Record<string, unknown>;
}
