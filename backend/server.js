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

app.post("/isFunction", async (req, res) => {
    const { code } = req.body;

    let isFunction =  /^\s*(function|\([\s\S]*?\)\s*=>|[a-zA-Z_$][\w$]*\s*=>)/.test(code);

    res.json({
        output: isFunction
    })
})


// Runs when React calls POST /runtests
app.post("/runtests", async (req, res) => {
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

// Runs when React calls POST /analyzetime
app.post("/analyzetime", async (req, res) => {
   const { code, testInput, testScale, type} = req.body;

   let outputs = "";
   let testInputs = [];

   const maxTime = 5000; // If any case exceeds 5 seconds, return time limit exceeded warning.
   
   // Create n inputs, each n times larger than the first test input.
   if (type == "array"){
    // This concatenates the array with itself testScale times.
    testInputs = Array(testScale).fill(testInput).flat();
   } else {
    // In descending order so first case is largest and time limit exceeded warning returns sooner.
    for (let i = testScale; i > 0; i--) {
        testInputs.push(testInput*i);
    }
   }
   

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

        try {
            script.runInContext(sandbox, { timeout : maxTime });
        } catch(err) {
            res.json({
              output: "Time Limit Exceeded: Reduce input size or test scale.",
            });
            return;
        }
        
        end = performance.now();
        time = end - start;
        
        outputs += input.toString() + " : " + time.toString() + "\n";
    } catch(err) {
        res.json({
          output: "Error: " + err.message,
        });
        return;
    }
   };

   res.json({
            output: outputs
        });
});

// Runs when React calls POST /analyzememory
app.post("/analyzememory", async (req, res) => {
   const { code, testInput, testScale, type} = req.body;

   let outputs = "";
   let testInputs = [];

   const maxTime = 5000; // If any case exceeds 5 seconds, return time limit exceeded warning.
   
   // Create n inputs, each n times larger than the first test input.
   if (type == "array"){
    // This concatenates the array with itself testScale times.
    testInputs = Array(testScale).fill(testInput).flat();
   } else{
    // In descending order so first case is largest and time limit exceeded warning returns sooner.
    for (let i = testScale; i > 0; i--) {
        testInputs.push(testInput*i);
    }
   }
   

   let start = 0;
   let end = 0;
   let memory = 0;

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

        start = process.memoryUsage();
        try {
            script.runInContext(sandbox, { timeout : maxTime });
        } catch(err) {
            res.json({
              output: "Time Limit Exceeded: Reduce input size or test scale.",
            });
            return;
        }
        
        end = process.memoryUsage();
        memory = end.heapUsed - start.heapUsed;

        outputs += input.toString() + " : " + memory.toString() + "\n";
    } catch(err) {
        res.json({
          output: "Error: " + err.message,
        });
        return;
    }
   };

   res.json({
            output: outputs
        });
});

app.post("/getType", async (req, res) => {
    const {testInputString} = req.body;

    let parsedInput;

    try {
        parsedInput = JSON.parse(testInputString);
    } catch (err) {
        return res.status(400).json({ error: "Test inputs cannot be parsed." });
    }

    if (!Array.isArray(parsedInput)) {
        return res.status(400).json({
            error: "Test inputs must be in list format. Example: [1,2,3]"
        });
    }

    let expectedType;
    let array;

    if (Array.isArray(parsedInput[0])) {
        expectedType = "array";
        array = true;
    } else {
        expectedType = typeof parsedInput[0];
        array = false;
    }

    if (array) {
        for (let i=0; i < parsedInput.length; i++) {
            if (!Array.isArray(parsedInput[i])) {
                return res.status(400).json({
                    error: "All test inputs must be the same type."
                });
            }
        }
    } else {
        for (let i=0; i < parsedInput.length; i++) {
            if (typeof parsedInput[i] != expectedType) {
                return res.status(400).json({
                    error: "All test inputs must be the same type."
                });
            }
        }
    }
    
    return res.json({ type: expectedType });
})

// Shown in terminal to ensure backend is running
app.listen(8000, () => {
  console.log("Server running on port 8000");
});