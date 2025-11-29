import { useState } from "react";
import { Scatter } from "react-chartjs-2";
import "./App.css";
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

function App() {
    // useState returns its parameter (variable set equal to it) 
    // and a function to change the variables value at render.
    const [codeInput, setCodeInput] = useState("");
    const [testInput, setTestInput] = useState("");
    const [codeOutput, setCodeOutput] = useState("");
    const [testScale, setTestScale] = useState("");

    // Will pass this data to graphs later
    const [complexityGraph, setComplexityGraph] = useState([]);;
    const [complexityText, setComplexityText] = useState("");


    // Sends data to backend server (FastAPI) via POST
    // Backend returns code execution and performance results
    // Updates necessary variables to be displayed in UI
    async function analyzecomplexities() {
        setCodeOutput("Running test cases...");
        setComplexityText("Running test cases...");
        const run = await fetch("http://localhost:8000/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                code: codeInput,
                testInput: testInput
             })
        });

        const runOutput = await run.json();

        setCodeOutput(JSON.stringify(runOutput.output));
        
        const analyze = await fetch("http://localhost:8000/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                code: codeInput,
                testInput: JSON.parse(testInput)[0], // Send first test input for analysis, will be scaled for graphing
                testScale: testScale
             })
        }); 

        // String containing input/time pairs
        const analyzeOutput = await analyze.json();

        setComplexityText(analyzeOutput.output);
        setComplexityGraph(parseTimeComplexityOutput(analyzeOutput.output)); // Parse input/time pairs for graphing

    }

    function resetPage() {
        setCodeInput("");
        setTestInput("");
        setTestScale("");
        setCodeOutput("");
        setComplexityText("");
        setComplexityGraph("");
    }

    // Parses string input/time pairs into points for graphing
    function parseTimeComplexityOutput(text) {
        return text
            .trim()
            .split("\n")
            .map(line => {
                const [input, time] = line.split(":").map(s => s.trim());
                return {
                    x: Number(input),
                    y: Number(time)
                };
            });
    }

    return (
    <div>
        <div className="row">
            <div className="column">
                <textarea
                className="box"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Input your code here."
                />

                <textarea
                className="box"
                readOnly
                value={codeOutput}
                placeholder="Code output here."
                />

                <textarea
                className="box"
                readOnly
                value={complexityText}
                placeholder="Complexities here."
                />
            </div>

            <div className="column">
                <textarea
                className="box"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Write your test cases here."
                />

                <textarea
                className="box"
                value={testScale}
                onChange={(e) => setTestScale(e.target.value)}
                placeholder="Test Scale!"
                />

                <div className="box" style={{ background: "white" }}>
                    {complexityGraph && complexityGraph.length > 0 ? (
                        <Scatter
                            data={{
                                datasets: [
                                    {
                                        label: "Input Size vs Time (ms)",
                                        data: complexityGraph,
                                        pointRadius: 5,
                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                scales: {
                                    x: { title: { display: true, text: "Input Size" } },
                                    y: { title: { display: true, text: "Execution Time (ms)" } }
                                }
                            }}
                        />
                    ) : (
                        <p>Complexity Graphs!</p>
                    )}
                </div>
            </div>
        </div>

        <button onClick={analyzecomplexities}>ANALYZE COMPLEXITIES</button>
        <button onClick={resetPage}>RESET</button>
    </div>
    );
}

export default App;
