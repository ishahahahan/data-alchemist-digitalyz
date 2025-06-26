const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const sampleDataDir = path.join(__dirname, '..', 'sample-data');

// List of CSV files to convert
const csvFiles = [
  'clients-sample.csv',
  'clients-with-errors.csv',
  'workers-sample.csv',
  'workers-with-errors.csv',
  'tasks-sample.csv',
  'tasks-with-errors.csv'
];

console.log('Converting CSV files to XLSX...');

csvFiles.forEach(csvFile => {
  const csvPath = path.join(sampleDataDir, csvFile);
  const xlsxFile = csvFile.replace('.csv', '.xlsx');
  const xlsxPath = path.join(sampleDataDir, xlsxFile);
  
  try {
    // Read CSV file
    const csvData = fs.readFileSync(csvPath, 'utf8');
    
    // Parse CSV and create workbook
    const workbook = xlsx.read(csvData, { type: 'string' });
    
    // Write XLSX file
    xlsx.writeFile(workbook, xlsxPath);
    
    console.log(`✓ Converted ${csvFile} to ${xlsxFile}`);
  } catch (error) {
    console.error(`✗ Error converting ${csvFile}:`, error.message);
  }
});

console.log('Conversion complete!');
