import { useState, useRef } from "react";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import { codeAtom, outputAtom, authAtom } from "../atoms";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { generateCode,URLL } from "../services/huggingFace";
export default function CodeEditorPage() {
  const [code, setCode] = useRecoilState(codeAtom);
  const [output,setOutput] = useRecoilState(outputAtom);
  const { token } = useRecoilValue(authAtom);
  const [showAIPrompt, setShowAIPrompt] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const editorRef = useRef(null);

  const runCode = async () => {
    if (isExecuting) return;
    
    setIsExecuting(true);
    
    try {
      const res = await fetch(`${URLL}/submit-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit code");
      }

      const data = await res.json();
      await pollForResult(data.jobId);
    } catch (error) {
      setOutput({
        output: `Error: ${error.message}`,
        imageUrl: null,
        error: true,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const pollForResult = async (id) => {
    let retries = 30; // Increased from 20
    const delay = 1000;

    while (retries-- > 0) {
      try {
        const res = await fetch(`${URLL}/code/${id}`, {
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
      } catch (error) {
        console.error("Polling error:", error);
      }

      await new Promise((r) => setTimeout(r, delay));
    }

    setOutput({
      output: "Error: Execution timed out (30s)",
      imageUrl: null,
      error: true,
    });
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    
    try {
      const generatedCode = await generateCode(aiPrompt);
      setCode(generatedCode);
      setAiPrompt("");
      setShowAIPrompt(false);
      
      if (editorRef.current) {
        editorRef.current.view?.focus();
      }
    } catch (error) {
      setCode(`# Error generating code: ${error.message}\n# Try being more specific with your request`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-900 p-4 flex flex-col">
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
                    disabled={isGenerating || isExecuting}
                    className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition ${
                      (isGenerating || isExecuting) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Generate with AI
                  </button>
                )}
                <button
                  onClick={runCode}
                  disabled={isExecuting || isGenerating}
                  className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition ${
                    (isExecuting || isGenerating) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isExecuting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Executing...
                    </>
                  ) : (
                    "Run Code"
                  )}
                </button>
              </div>
            </div>

            {showAIPrompt && (
              <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe what Python code you want to generate..."
                  className="w-full p-3 border border-gray-300 rounded mb-2"
                  rows={3}
                  disabled={isGenerating}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAIPrompt(false)}
                    disabled={isGenerating}
                    className={`px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition ${
                      isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateWithAI}
                    disabled={isGenerating}
                    className={`px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition ${
                      isGenerating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      "Generate Code"
                    )}
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
          </div>
        </div>
      </div>
    </div>
  );
}
