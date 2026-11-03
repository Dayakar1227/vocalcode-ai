import { useEffect, useState } from "react";
import { Code2 } from "lucide-react";
import CodeEditor from "../components/CodeEditor.jsx";
import { PageHeader } from "../components/ui.jsx";

const STARTERS = {
  Java: 'class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, VocalCode!");\n  }\n}',
  Python: 'def solve():\n    print("Hello, VocalCode!")\n\nsolve()',
  JavaScript: 'function solve() {\n  console.log("Hello, VocalCode!");\n}\n\nsolve();',
};

export default function Playground() {
  const [language, setLanguage] = useState("JavaScript");
  const [code, setCode] = useState(STARTERS.JavaScript);

  useEffect(() => setCode(STARTERS[language]), [language]);

  return (
    <div>
      <PageHeader
        title="Code practice"
        sub="Write and run small programs in Java, Python, or JavaScript."
      />
      <section className="panel space-y-5 p-5 sm:p-7">
        <label className="block text-sm font-semibold" htmlFor="practice-language">Language</label>
        <select
          id="practice-language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-xl border border-line bg-white px-3 py-2 text-sm"
        >
          {Object.keys(STARTERS).map((name) => <option key={name}>{name}</option>)}
        </select>
        <CodeEditor key={language} language={language} code={code} onChange={setCode} />
      </section>
      <div className="mt-6 rounded-xl bg-cobalt-tint p-4 text-sm text-cobalt">
        <Code2 size={16} className="mr-2 inline" />
        To get a coding challenge and have your solution reviewed, start an interview and choose Coding.
      </div>
    </div>
  );
}
