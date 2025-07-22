import { useRecoilState } from "recoil";
import { codeAtom } from "../atoms";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import CodeMirror from "@uiw/react-codemirror";

export default function CodeEditor() {
  const [code, setCode] = useRecoilState(codeAtom);

  return (
    <div className="h-[500px]">
      <CodeMirror
        value={code}
        height="100%"
        extensions={[python()]}
        theme={oneDark}
        onChange={(value) => setCode(value)}
      />
    </div>
  );
}
