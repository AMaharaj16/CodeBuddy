import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const runtimePath = path.join(__dirname, '../data/runtime.csv');
const memoryPath = path.join(__dirname, '../outputs/memoryusage.csv');

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
