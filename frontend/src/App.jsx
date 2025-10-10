import { useState } from "react";
import "./App.css";

function App() {
    // useState returns its parameter (variable set equal to it) 
    // and a function to change the variables value at render.
    const [codeInput, setCodeInput] = useState("");
    const [codeOutput, setCodeOutput] = useState("");

    // Will pass this data to graphs later
    const [complexityGraph, setComplexityGraph] = useState({
        input_sizes : [],
        runtimes : [],
        memory_usage : []
    });
    const [complexityText, setComplexityText] = useState("");

    // Should look at the complexity graph values
    // to determine a time and space complexity
    function analyzecomplexities() {
        return
    }

    // Compile code and return output printed
    function displayoutput() {
        return
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
        <button onClick={analyzecomplexities}> ANALYZE COMPLEXITIES</button>
        <button onClick={displayoutput}> DISPLAY OUTPUT</button>
    </div>
    );
}

export default App;
