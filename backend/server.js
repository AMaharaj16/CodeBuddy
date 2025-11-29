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
app.post("/run", async (req, res) => {
  const { code, testInput} = req.body;

  let outputs = [];
  
  // Use regular expressions to extract function name from code
  const funcName = code.match(/function\s+([a-zA-Z0-9_]+)/)?.[1];
  
  if (!funcName) throw new Error("No function found in code");

  // Wrap code to call the function with test input
  const wrappedCode = `
  ${code}
  ${funcName}(input);
  `;

  const script = new vm.Script(wrappedCode);

  const parsedInputs = JSON.parse(testInput);

  for (const inp of parsedInputs) {
    try {
      // Sandbox environment contains chosen variables and console
      const sandbox = vm.createContext({
          input : inp,
          console: console
      });
    
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
  } 

  res.json({
            output: outputs
        });
  return;
});

app.post("/analyze", async (req, res) => {
   const { code, testInput, testScale} = req.body;

   let outputs = "";
   let testInputs = [];
   
   // Create n inputs, each n times larger than the first test input.
   for (let i = 1; i <= testScale; i++) {
    testInputs.push(testInput*i);
   }

   const timer = setTimeout(() => {
    res.json({
        output: "Time Limit Exceeded: Please reduce input size."
        });
    clearTimeout(timer);
    return;
   }, 10000);

   let start = 0;
   let end = 0;
   let time = 0;

   for (const input of testInputs) {
    try {
        const sandbox = vm.createContext({
        input : [input],
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

        start = performance.now();
        script.runInContext(sandbox);
        end = performance.now();
        time = end - start;

        outputs += input.toString() + " : " + time.toString() + "\n";
    } catch(err) {
        res.json({
        output: "Error: " + err.message,
        });
        clearTimeout(timer)
        return;
    }
   };

   res.json({
            output: outputs
        });
    clearTimeout(timer)
});

// Shown in terminal to ensure backend is running
app.listen(8000, () => {
  console.log("Server running on port 8000");
});