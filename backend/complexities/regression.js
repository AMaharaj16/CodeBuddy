import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runtimePath = path.join(__dirname, '../data/runtime.csv');
const memoryPath = path.join(__dirname, '../data/memoryusage.csv');

async function readCSV(filePath, valueColumn) {
    const results = [];
    for await (const row of fs.createReadStream(filePath).pipe(csv())) {
        results.push({
            input: Number(row.Input),
            value: Number(row[valueColumn])
        });
    }
    return results;
}

// R² calculation
function r2Score(y, yPred) {
    const meanY = y.reduce((a,b) => a+b, 0)/y.length;
    const ssRes = y.reduce((sum, val, i) => sum + Math.pow(val - yPred[i], 2), 0);
    const ssTot = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
    return 1 - ssRes/ssTot;
}

// Simple Linear Regression class
class SimpleLinearRegression {
    constructor(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

        this.slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        this.intercept = (sumY - this.slope * sumX) / n;
    }

    predict(x) {
        return this.slope * x + this.intercept;
    }
}

// Candidate transformations
function transformInput(xArr, model) {
    switch(model) {
        case '1': return Array(xArr.length).fill(1);
        case 'logn': return xArr.map(x => Math.log(x));
        case 'n': return [...xArr];
        case 'nlogn': return xArr.map(x => x * Math.log(x));
        case 'n^2': return xArr.map(x => x**2);
        case 'n^3': return xArr.map(x => x**3);
        case 'n^4': return xArr.map(x => x**4);
        case '2^n': return xArr; // will use log(y) vs x
        case 'n^n': return xArr.map(x => x * Math.log(x)); // log(y) vs x*log(x)
        default: throw new Error('Unknown model');
    }
}

// Fit all models and pick best
export function detectComplexity(X, y) {
    const models = ['1','logn','n','nlogn','n^2','n^3','n^4','2^n','n^n'];
    let bestR2 = -Infinity;
    let bestModel = null;

    for (const model of models) {
        let xTrans = transformInput(X, model);
        let yTrans = [...y];

        if (model === '2^n' || model === 'n^n') {
            yTrans = y.map(v => Math.log(v));
        }

        const reg = new SimpleLinearRegression(xTrans, yTrans);
        const yPred = xTrans.map(v => reg.predict(v));

        const r2 = r2Score(yTrans, yPred);

        if (r2 > bestR2) {
            bestR2 = r2;
            bestModel = model;
        }
    }

    return { complexity: bestModel, r2: bestR2 };
}

// Analyze complexity from CSV file
export async function analyzeComplexityFromCSV(filePath, valueColumn) {
    const results = await readCSV(filePath, valueColumn);
    
    if (results.length === 0) {
        return { complexity: 'N/A', r2: 0 };
    }

    const X = results.map(r => r.input);
    const y = results.map(r => r.value);

    return detectComplexity(X, y);
}

// Convenience functions for runtime and memory analysis
export async function analyzeRuntimeComplexity() {
    return analyzeComplexityFromCSV(runtimePath, 'Runtime');
}

export async function analyzeMemoryComplexity() {
    return analyzeComplexityFromCSV(memoryPath, 'MemoryUsage');
}