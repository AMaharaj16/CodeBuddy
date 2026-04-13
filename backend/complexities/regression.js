import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runtimePath = path.join(__dirname, '../data/runtime.csv');
const memoryPath = path.join(__dirname, '../data/memoryusage.csv');

const MIN_SLOPE = 1e-8;
const PENALTY_WEIGHT = 0.01; // penalizes overly complex models

// -------------------- CSV READER --------------------

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

// -------------------- UTILITIES --------------------

function r2Score(y, yPred) {
    const meanY = y.reduce((a,b) => a+b, 0)/y.length;
    const ssRes = y.reduce((sum, val, i) => sum + (val - yPred[i])**2, 0);
    const ssTot = y.reduce((sum, val) => sum + (val - meanY)**2, 0);
    return ssTot === 0 ? 0 : 1 - ssRes/ssTot;
}

function normalize(arr) {
    const max = Math.max(...arr);
    return max === 0 ? arr : arr.map(v => v / max);
}

function removeOutliers(X, y) {
    const sorted = [...y].sort((a,b) => a-b);
    const q1 = sorted[Math.floor(sorted.length/4)];
    const q3 = sorted[Math.floor(sorted.length*3/4)];
    const iqr = q3 - q1;

    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    const Xf = [], yf = [];
    for (let i=0; i<y.length; i++) {
        if (y[i] >= lower && y[i] <= upper) {
            Xf.push(X[i]);
            yf.push(y[i]);
        }
    }
    return { X: Xf, y: yf };
}

// -------------------- REGRESSION --------------------

class SimpleLinearRegression {
    constructor(x, y) {
        const n = x.length;
        const sumX = x.reduce((a,b) => a+b, 0);
        const sumY = y.reduce((a,b) => a+b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

        const denom = (n * sumX2 - sumX * sumX);
        this.slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
        this.intercept = (sumY - this.slope * sumX) / n;
    }

    predict(x) {
        return this.slope * x + this.intercept;
    }
}

// -------------------- MODEL DEFINITIONS --------------------

const complexityPenalty = {
    '1': 0,
    'logn': 1,
    'n': 2,
    'nlogn': 3,
    'n^2': 4,
    'n^3': 5,
    'n^4': 6,
    '2^n': 7,
    'n^n': 8
};

function transformInput(xArr, model) {
    switch(model) {
        case '1': return Array(xArr.length).fill(1);
        case 'logn': return xArr.map(x => Math.log(x));
        case 'n': return [...xArr];
        case 'nlogn': return xArr.map(x => x * Math.log(x));
        case 'n^2': return xArr.map(x => x**2);
        case 'n^3': return xArr.map(x => x**3);
        case 'n^4': return xArr.map(x => x**4);
        case '2^n': return [...xArr]; // log(y) vs x
        case 'n^n': return xArr.map(x => x * Math.log(x)); // log(y) vs xlogx
        default: throw new Error('Unknown model');
    }
}

// -------------------- CONSTANT DETECTION --------------------

function isConstantComplexity(X, y) {
    const reg = new SimpleLinearRegression(X, y);
    return Math.abs(reg.slope) < MIN_SLOPE;
}

// -------------------- CORE DETECTION --------------------

export function detectComplexity(X, y) {

    if (X.length < 3) {
        return { complexity: 'N/A', r2: 0 };
    }

    const { X: filteredX, y: filteredY } = removeOutliers(X, y);

    if (filteredX.length < 3) {
        return { complexity: 'N/A', r2: 0 };
    }

    // Normalize inputs for stability
    const normX = normalize(filteredX);

    // Detect constant first (more principled)
    if (isConstantComplexity(normX, filteredY)) {
        return { complexity: '1', r2: 1 };
    }

    const models = ['1','logn','n','nlogn','n^2','n^3','n^4','2^n','n^n'];

    let bestScore = -Infinity;
    let bestModel = null;
    let bestR2 = 0;

    for (const model of models) {

        let xTrans = transformInput(normX, model);
        let yTrans = [...filteredY];

        // exponential models use log(y)
        if (model === '2^n' || model === 'n^n') {
            if (yTrans.some(v => v <= 0)) continue;
            yTrans = yTrans.map(v => Math.log(v));
        }

        const reg = new SimpleLinearRegression(xTrans, yTrans);

        if (Math.abs(reg.slope) < MIN_SLOPE) continue;

        const yPred = xTrans.map(v => reg.predict(v));
        const r2 = r2Score(yTrans, yPred);

        // Penalized score to prevent overfitting
        const adjustedScore = r2 - PENALTY_WEIGHT * complexityPenalty[model];

        if (adjustedScore > bestScore) {
            bestScore = adjustedScore;
            bestModel = model;
            bestR2 = r2;
        }
    }

    return {
        complexity: bestModel || 'N/A',
        r2: bestR2
    };
}

// -------------------- CSV ANALYSIS --------------------

export async function analyzeComplexityFromCSV(filePath, valueColumn) {
    const results = await readCSV(filePath, valueColumn);

    if (results.length === 0) {
        return { complexity: 'N/A', r2: 0 };
    }

    const X = results.map(r => r.input);
    const y = results.map(r => r.value);

    return detectComplexity(X, y);
}

export async function analyzeRuntimeComplexity() {
    return analyzeComplexityFromCSV(runtimePath, 'Runtime');
}

export async function analyzeMemoryComplexity() {
    return analyzeComplexityFromCSV(memoryPath, 'MemoryUsage');
}