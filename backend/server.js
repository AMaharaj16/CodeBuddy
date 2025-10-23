import express from "express";
import cors from "cors";

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
  const { code } = req.body;
  // TODO: Add code execution and complexity analysis functionality here
  return res.json({});
});

app.listen(8000, () => {
  console.log("Server running on port 8000");
});