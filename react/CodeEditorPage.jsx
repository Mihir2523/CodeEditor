import { useState, useRef } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { codeAtom, outputAtom, authAtom } from "../atoms";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

export default function CodeEditorPage() {
  const [code, setCode] = useRecoilState(codeAtom);
  const setOutput = useSetRecoilState(outputAtom);
  const { token } = useRecoilValue(authAtom);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const editorRef = useRef(null);

  const runCode = async () => {
    const res = await fetch("http://localhost:3000/submit-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    if (!res.ok) return alert("Error submitting code");

    pollForResult(data.jobId);
  };

  const pollForResult = async (id) => {
    let retries = 20;
    const delay = 1000;

    while (retries-- > 0) {
      const res = await fetch(`http://localhost:3000/code/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (data.isComplete) {
        setOutput({
          output: data.output,
          imageUrl: data.imageLink,
          error: data.errors,
        });
        return;
      }

      await new Promise((r) => setTimeout(r, delay));
    }

    alert("Still processing. Try again later.");
  };

  const generateWithAI = () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate AI API call with hardcoded responses
    setTimeout(() => {
      let generatedCode = "";
      
      if (aiPrompt.toLowerCase().includes("sort")) {
        generatedCode = `# Sorting algorithm\nnumbers = [5, 2, 8, 1, 3]\nsorted_numbers = sorted(numbers)\nprint("Sorted numbers:", sorted_numbers)`;
      } 
      else if (aiPrompt.toLowerCase().includes("plot")) {
        generatedCode = `# Data visualization\nimport matplotlib.pyplot as plt\n\nx = [1, 2, 3, 4, 5]\ny = [2, 3, 5, 7, 11]\n\nplt.plot(x, y)\nplt.title("Sample Plot")\nplt.xlabel("X-axis")\nplt.ylabel("Y-axis")\nplt.show()`;
      }
      else {
        generatedCode = `# Generated code based on your request\n# ${aiPrompt}\n\ndef main():\n    print("Hello from AI-generated code!")\n\nif __name__ == "__main__":\n    main()`;
      }
      
      setCode(generatedCode);
      setAiPrompt("");
      setShowAIPrompt(false);
      setIsGenerating(false);
      
      // Focus the editor after generation
      if (editorRef.current) {
        editorRef.current.view?.focus();
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col">
      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col">
        <h1 className="text-3xl font-bold mb-6 text-indigo-700">Python Code Editor</h1>
        
        <div className="flex-1 flex flex-col md:flex-row gap-6">
          {/* Editor Column */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Code Editor</h2>
              <div className="flex gap-2">
                {!showAIPrompt && (
                  <button
                    onClick={() => setShowAIPrompt(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
                  >
                    Generate with AI
                  </button>
                )}
                <button
                  onClick={runCode}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                >
                  Run Code
                </button>
              </div>
            </div>

            {showAIPrompt && (
              <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what code you want to generate..."
                  className="w-full p-3 border border-gray-300 rounded mb-2"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAIPrompt(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateWithAI}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {isGenerating ? "Generating..." : "Generate Code"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-hidden rounded-lg border border-gray-300 shadow-sm">
              <CodeMirror
                ref={editorRef}
                value={code}
                height="100%"
                extensions={[python()]}
                theme={oneDark}
                onChange={(value) => setCode(value)}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  bracketMatching: true,
                  autocompletion: true,
                  indentOnInput: true,
                  syntaxHighlighting: true,
                }}
              />
            </div>
          </div>

          {/* Output Column */}
          <div className="md:w-1/3 flex flex-col">
            <h2 className="text-xl font-semibold mb-2">Output</h2>
            <OutputDisplay />
          </div>
        </div>
      </div>
    </div>
  );
}

function OutputDisplay() {
  const output = useRecoilValue(outputAtom);
  
  return (
    <div className="flex-1 bg-white p-4 rounded-lg border border-gray-300 shadow-sm overflow-auto">
      {output.error ? (
        <pre className="text-red-600 bg-red-50 p-3 rounded whitespace-pre-wrap">
          {output.output}
        </pre>
      ) : (
        <pre className="text-gray-800 bg-gray-50 p-3 rounded whitespace-pre-wrap">
          {output.output || "No output yet. Run your code to see results."}
        </pre>
      )}
      
      {output.imageUrl && (
        <div className="mt-4 p-2 bg-gray-50 rounded border border-gray-200">
          <h3 className="text-sm font-medium mb-2">Generated Image:</h3>
          <img 
            src={output.imageUrl} 
            alt="Generated plot" 
            className="max-w-full h-auto rounded border border-gray-200"
          />
        </div>
      )}
    </div>
  );
}