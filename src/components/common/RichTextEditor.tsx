import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: number; // chiều cao tối thiểu vùng soạn thảo (px)
  readOnly?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

const defaultModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const readOnlyModules = {
  toolbar: false,
};

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  minHeight = 150,
  readOnly = false,
  style,
  className = '',
}: RichTextEditorProps) => {
  const isContentEmpty = !value || value.trim() === '' || value === '<p><br></p>';

  if (readOnly && isContentEmpty) {
    return (
      <div
        className={`rich-text-editor is-readonly empty ${className}`.trim()}
        style={{
          padding: '12px 14px',
          color: '#8c8c8c',
          fontStyle: 'italic',
          background: '#fafcfb',
          border: '1px solid #e8ede9',
          borderRadius: 8,
          fontSize: 14,
          ...style,
        }}
      >
        {placeholder || 'Chưa cập nhật mô tả.'}
      </div>
    );
  }

  return (
    <div
      className={`rich-text-editor ${readOnly ? 'is-readonly' : ''} ${className}`.trim()}
      style={
        {
          ['--rte-min-height' as string]: readOnly ? 'auto' : `${minHeight}px`,
          ...style,
        } as React.CSSProperties
      }
    >
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={readOnly ? readOnlyModules : defaultModules}
        placeholder={placeholder}
        readOnly={readOnly}
      />
      <style>{`
        .rich-text-editor .ql-editor {
          min-height: var(--rte-min-height, 150px);
        }
        .rich-text-editor.is-readonly .ql-toolbar {
          display: none !important;
        }
        .rich-text-editor.is-readonly .ql-container.ql-snow {
          border: 1px solid #e8ede9;
          border-radius: 8px;
          background: #fafcfb;
        }
        .rich-text-editor.is-readonly .ql-editor {
          min-height: auto;
          padding: 12px 16px;
          font-size: 14px;
          line-height: 1.65;
          color: #2b3b35;
          cursor: default;
        }
        .rich-text-editor.is-readonly .ql-editor:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;