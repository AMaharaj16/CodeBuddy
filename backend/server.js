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
  
  // TODO: Add functionality for multiple test cases here
  for (let i = 0; i < testInput.length; i++) {
    try {
        // Create isolated environment
        const sandbox = { console, output: null };
        vm.createContext(sandbox);

        // Wrapped code which can be executed
        const wrappedCode = `
            const solve = ${code};
            output = solve((${JSON.stringify(testInput[i])}));
        `;

        // Run code inside sandbox with timeout after 10 seconds
        vm.runInContext(wrappedCode, sandbox, {timeout: 10000});

        outputs.push(sandbox.output);
    } catch (err) { // Catch and display error message in output
        res.json({
            output: "Error: " + err.message,
            complexity: "N/A",
            graphData: {}
        });
        return;
    }

  }

  const out = outputs.join("\n");

  res.json({
            output: out,
            complexity: "TODO",
            graphData: {}
        });

    // TODO: Add complexity analysis functionality here
});

// Shown in terminal to ensure backend is running
app.listen(8000, () => {
  console.log("Server running on port 8000");
});