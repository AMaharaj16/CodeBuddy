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
    const [timeGraph, setTimeGraph] = useState([]);;
    const [timeText, setTimeText] = useState("");

    const [memoryGraph, setMemoryGraph] = useState([]);
    const [memoryText, setMemoryText] = useState("");

    // Sends data to backend server (FastAPI) via POST
    // Backend returns code execution and performance results
    // Updates necessary variables to be displayed in UI
    async function analyzecomplexities() {
        setCodeOutput("Running test cases...");
        setTimeText("Running test cases...");
        setMemoryText("Running test cases...");

        let inputType;

        try {
            inputType = getType();
        } catch (error) {
            setTestInput(error.message);
            return;
        }

        // Run test cases here and pass it to set output function
        const run = await fetch("http://localhost:8000/runtests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                code: codeInput,
                testInput: testInput,
                type: inputType
             })
        });

        const runOutput = await run.json();
        setCodeOutput(JSON.stringify(runOutput.output));

        // Run first test case with test scale and parse input/time pairs
        const time = await fetch("http://localhost:8000/analyzetime", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                code: codeInput,
                testInput: JSON.parse(testInput)[0], // Send first test input for analysis, will be scaled for graphing
                testScale: testScale
             })
        }); 

        // String containing input/time pairs
        const timeOutput = await time.json();
        setTimeText(timeOutput.output);
        setTimeGraph(parseComplexityOutput(timeOutput.output)); // Parse input/time pairs for graphing

        // Run first test case with test scale and parse input/memory pairs
        const memory = await fetch("http://localhost:8000/analyzememory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                code: codeInput,
                testInput: JSON.parse(testInput)[0], // Send first test input for analysis, will be scaled for graphing
                testScale: testScale
             })
        }); 

        // String containing input/time pairs
        const memoryOutput = await memory.json();
        setMemoryText(memoryOutput.output);
        setMemoryGraph(parseComplexityOutput(memoryOutput.output)); // Parse input/memory pairs for graphing
    }

    function resetPage() {
        setCodeInput("");
        setTestInput("");
        setTestScale("");
        setCodeOutput("");
        setTimeText("");
        setMemoryText("");
        setTimeGraph([]);
        setMemoryGraph([]);
    }

    async function getType() {
        const inputString = testInput.trim();

        if (inputString == "") {
            throw new Error("Please add input tests here.")
        }

        // Send inputString to backend and check cases:
        //  1. It is not a list
        //  2. JSON.parse does not work
        //  3. Each individual test case must be the same type

        const type = await fetch("http://localhost:8000/getType", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                code: inputString
             })
        }); 

        return type;
    }

    // Parses string input/time pairs into points for graphing
    function parseComplexityOutput(text) {
        return text
            .trim()
            .split("\n")
            .map(line => {
                const [input, usage] = line.split(":").map(s => s.trim());
                return {
                    x: Number(input),
                    y: Number(usage)
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
                value={timeText}
                placeholder="Time Complexities here."
                />

                <textarea
                className="box"
                readOnly
                value={memoryText}
                placeholder="Memory Complexities here"
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
                    {timeGraph && timeGraph.length > 0 ? (
                        <Scatter
                            data={{
                                datasets: [
                                    {
                                        label: "Input Size vs Time (ms)",
                                        data: timeGraph,
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
                        <p>Runtime Graphs!</p>
                    )}
                </div>

                <div className="box" style={{ background: "white" }}>
                    {memoryGraph && memoryGraph.length > 0 ? (
                        <Scatter
                            data={{
                                datasets: [
                                    {
                                        label: "Input Size vs Memory (bytes)",
                                        data: memoryGraph,
                                        pointRadius: 5,
                                    },
                                ],
                            }}
                            options={{
                                responsive: true,
                                scales: {
                                    x: { title: { display: true, text: "Input Size" } },
                                    y: { title: { display: true, text: "Memory Usage (bytes)" } }
                                }
                            }}
                        />
                    ) : (
                        <p>Memory Usage Graphs!</p>
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
