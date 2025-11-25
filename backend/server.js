import express from "express";
import cors from "cors";
import vm from "vm";

const app = express();

// CORS allows React and backend communication
app.use(
  cors({
    origin: "http://localhost:5173", // React server
    credentials: true,
    methods: ["*"],
    allowedHeaders: ["*"],
  })
);

app.use(express.json());

// Runs when React calls POST /analyze
app.post("/analyze", async (req, res) => {
  const { code, testInput} = req.body;

  let outputs = [];
  
  try {
    const testInp = JSON.parse(testInput);

    // Sandbox environment contains chosen variables and console
    const sandbox = vm.createContext({
        input : testInp,
        console: console
    });

    // Use regular expressions to extract function name from code
    const funcName = code.match(/function\s+([a-zA-Z0-9_]+)/)?.[1];

    if (!funcName) throw new Error("No function found in code");

    // Wrap code to call the function with test input
    const wrappedCode = `
    ${code}
    ${funcName}(...input);
    `;

    const script = new vm.Script(wrappedCode);
    
    let result = script.runInContext(sandbox);

    outputs.push(result);

  } catch(err) { // Catch and display error message in output
    res.json({
        output: "Error: " + err.message,
        complexity: "N/A",
        graphData: {}
    });
    return;
  } 

  res.json({
            output: outputs,
            complexity: "TODO",
            graphData: {}
        });

    // TODO: Add complexity analysis functionality here
});

// Shown in terminal to ensure backend is running
app.listen(8000, () => {
  console.log("Server running on port 8000");
});