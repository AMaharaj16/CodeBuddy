import { useState } from "react";
import "./App.css";

function App() {
    // useState returns its parameter (variable set equal to it) 
    // and a function to change the variables value at render.
    const [codeInput, setCodeInput] = useState("");
    const [testInput, setTestInput] = useState("");
    const [codeOutput, setCodeOutput] = useState("");

    // Will pass this data to graphs later
    const [complexityGraph, setComplexityGraph] = useState({
        input_sizes : [],
        runtimes : [],
        memory_usage : []
    });
    const [complexityText, setComplexityText] = useState("");


    // Sends data to backend server (FastAPI) via POST
    // Backend returns code execution and performance results
    // Updates necessary variables to be displayed in UI
    async function analyzecomplexities() {
        const response = await fetch("http://localhost:8000/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: codeInput })
        });

        const data = await response.json();

        setCodeOutput(data.output);
        setComplexityText(data.complexity);
        setComplexityGraph(data.graphData);
    }

    return(
    <div>
        <textarea 
            className="box"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="Input your code here."
        />
        <textarea
            className="box"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Write your test cases here."
        />
        <textarea 
            className="box"
            readOnly
            value={codeOutput}
            placeholder="Code output here."
        />
    
        <textarea 
            className="box"
            value={JSON.stringify(complexityGraph, null, 2)}
        />
        <textarea 
            className="box"
            value={complexityText}
            placeholder="Complexities here."
        />
        <button onClick={analyzecomplexities}>ANALYZE COMPLEXITIES</button>
    </div>
    );
}

export default App;
