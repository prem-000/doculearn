const lucide = require('lucide-react');
const logoKeys = Object.keys(lucide).filter(key => key.toLowerCase().includes('logo') || key.toLowerCase().includes('brand'));
console.log('Logo/Brand related keys:', logoKeys);
