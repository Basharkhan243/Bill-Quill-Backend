import XLSX from 'xlsx';

const exportToExcel = (data, fileName, format = 'excel') => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    let ws;
    if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0])) {
      // Data is already in worksheet format (array of arrays)
      ws = XLSX.utils.aoa_to_sheet(data);
    } else {
      // Data is in object format (array of objects)
      ws = XLSX.utils.json_to_sheet(data);
    }
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    // Generate buffer
    if (format === 'excel') {
      return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    } else {
      return XLSX.write(wb, { type: 'buffer', bookType: 'csv' });
    }
  } catch (error) {
    throw new Error(`Excel generation failed: ${error.message}`);
  }
};

export { exportToExcel };