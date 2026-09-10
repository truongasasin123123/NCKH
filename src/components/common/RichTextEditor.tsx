import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  minHeight?: number; // chiều cao tối thiểu vùng soạn thảo (px)
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const RichTextEditor = ({ value, onChange, placeholder, minHeight = 150 }: RichTextEditorProps) => {
  return (
    <div className="rich-text-editor" style={{ ['--rte-min-height' as string]: `${minHeight}px` } as React.CSSProperties}>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        placeholder={placeholder}
      />
      <style>{`
        .rich-text-editor .ql-editor {
          min-height: var(--rte-min-height, 150px);
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;