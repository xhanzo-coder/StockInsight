import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { StockInfo } from '../services/api';

// 将股票数据转换为导出格式
const prepareExportData = (stocks: StockInfo[]) => {
  return stocks.map(stock => ({
    '股票代码': stock.code,
    '股票名称': stock.name,
    '当前价格': stock.current_price,
    '涨跌幅(%)': stock.change_percent,
    '涨跌额': stock.change_amount,
    '市值': stock.market_cap,
    '市赚率': stock.market_earning_ratio,
    'TTM市盈率': stock.pe_ratio_ttm,
    'ROE(%)': stock.roe,
    '市净率': stock.pb_ratio,
    '股利支付率(%)': stock.dividend_payout_ratio,
    '修正系数': stock.correction_factor,
    '修正市赚率': stock.corrected_market_earning_ratio,
    '理论股价': stock.theoretical_price
  }));
};

// 导出为Excel文件
export const exportToExcel = (stocks: StockInfo[], fileName: string = 'stock-data') => {
  const exportData = prepareExportData(stocks);
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '股票数据');
  
  // 生成Excel文件并下载
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(data, `${fileName}.xlsx`);
};

// 导出为CSV文件
export const exportToCSV = (stocks: StockInfo[], fileName: string = 'stock-data') => {
  const exportData = prepareExportData(stocks);
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);
  
  // 添加UTF-8 BOM标记以确保Excel正确识别中文
  const BOM = '\uFEFF';
  const csvContentWithBOM = BOM + csvContent;
  
  // 生成CSV文件并下载
  const data = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' });
  saveAs(data, `${fileName}.csv`);
};