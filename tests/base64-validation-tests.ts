import { Base64Utils } from '../src/utils/base64Utils';
import { MediaProcessor } from '../src/services/MediaProcessor';
import { MediaContentProcessor } from '../src/utils/MediaContentProcessor';

// Dados de teste em base64 simulados
const testData = {
  // QR Code simulado (PNG pequeno)
  qrCode: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  
  // Imagem JPEG simulada
  imageJpeg: '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/AB8AAQAB',
  
  // Imagem PNG simulada
  imagePng: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  
  // Áudio MP3 simulado (header)
  audioMp3: 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA',
  
  // Vídeo MP4 simulado (header)
  videoMp4: 'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAsdtZGF0',
  
  // Documento PDF simulado
  documentPdf: 'JVBERi0xLjQKJcOkw7zDtsOfCjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovRmlsdGVyIC9GbGF0ZURlY29kZQo+PgpzdHJlYW0KeJxLy8wpTVWwUShILUlVyMxLyU/NK1HwSCwpysxLt1Uw1DPg5+eDABZQSwECHgMUAAAACABZtElJqJqF2AAAABQAAAAIABgAAAAAAAEAAACkgQAAAAB0ZXN0LnR4dFVUBQADDQcOYXV4CwABBOgDAAAE6AMAAFBLBQYAAAAAAQABAE4AAABCAAAAAABQSwUGAAAAAAEAAQBOAAAAQgAAAAAA',
  
  // Sticker WebP simulado
  stickerWebp: 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
  
  // Texto normal (não é base64)
  normalText: 'Esta é uma mensagem de texto normal que não deve ser processada como mídia.',
  
  // Base64 inválido
  invalidBase64: 'Este não é um base64 válido!@#$%'
};

// Função para testar processamento de QR Code
function testQRCodeProcessing() {
  console.log('\n🔍 === TESTE: Processamento de QR Code ===');
  
  const qrResult = Base64Utils.processQRCode(testData.qrCode);
  console.log('QR Code processado:', qrResult);
  
  if (qrResult.isValid) {
    console.log('✅ QR Code processado com sucesso');
    console.log('Data URL gerada:', qrResult.dataUrl?.substring(0, 100) + '...');
  } else {
    console.log('❌ Erro no processamento do QR Code:', qrResult.error);
  }
}

// Função para testar processamento de mídias
function testMediaProcessing() {
  console.log('\n🎯 === TESTE: Processamento de Mídias ===');
  
  const testCases = [
    { name: 'Imagem JPEG', data: testData.imageJpeg, type: 'image' },
    { name: 'Imagem PNG', data: testData.imagePng, type: 'image' },
    { name: 'Áudio MP3', data: testData.audioMp3, type: 'audio' },
    { name: 'Vídeo MP4', data: testData.videoMp4, type: 'video' },
    { name: 'Documento PDF', data: testData.documentPdf, type: 'document' },
    { name: 'Sticker WebP', data: testData.stickerWebp, type: 'sticker' },
    { name: 'Texto Normal', data: testData.normalText, type: 'text' },
    { name: 'Base64 Inválido', data: testData.invalidBase64, type: 'text' }
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n--- Testando: ${testCase.name} ---`);
    
    // Teste com MediaProcessor
    const mediaResult = MediaProcessor.process(testCase.data, testCase.type);
    console.log('MediaProcessor resultado:', {
      type: mediaResult.type,
      isProcessed: mediaResult.isProcessed,
      hasUrl: mediaResult.url.length > 0,
      mimeType: mediaResult.mimeType,
      size: mediaResult.size,
      error: mediaResult.error
    });
    
    // Teste com MediaContentProcessor
    const contentResult = MediaContentProcessor.processMediaContent(testCase.data, testCase.type);
    console.log('MediaContentProcessor resultado:', {
      isDataUrl: contentResult.startsWith('data:'),
      length: contentResult.length,
      preview: contentResult.substring(0, 50) + (contentResult.length > 50 ? '...' : '')
    });
  });
}

// Função para testar validação de Base64
function testBase64Validation() {
  console.log('\n🔧 === TESTE: Validação de Base64 ===');
  
  const testCases = [
    { name: 'QR Code válido', data: testData.qrCode },
    { name: 'Imagem PNG válida', data: testData.imagePng },
    { name: 'Texto normal', data: testData.normalText },
    { name: 'Base64 inválido', data: testData.invalidBase64 },
    { name: 'String vazia', data: '' },
    { name: 'Null', data: null as any }
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n--- Validando: ${testCase.name} ---`);
    
    const isValid = Base64Utils.isValidBase64(testCase.data);
    console.log('É base64 válido:', isValid);
    
    if (isValid) {
      const mimeType = Base64Utils.detectMimeType(testCase.data);
      console.log('MIME type detectado:', mimeType);
      
      const size = Base64Utils.getBase64Size(testCase.data);
      console.log('Tamanho estimado:', size);
    }
  });
}

// Função para testar formatação de Base64
function testBase64Formatting() {
  console.log('\n📝 === TESTE: Formatação de Base64 ===');
  
  const testCases = [
    { name: 'Base64 puro', data: testData.imagePng },
    { name: 'Data URL existente', data: `data:image/png;base64,${testData.imagePng}` },
    { name: 'Base64 com espaços', data: testData.imagePng.replace(/(.{10})/g, '$1 ') },
    { name: 'Base64 inválido', data: testData.invalidBase64 }
  ];
  
  testCases.forEach(testCase => {
    console.log(`\n--- Formatando: ${testCase.name} ---`);
    
    const result = Base64Utils.formatBase64String(testCase.data);
    console.log('Resultado da formatação:', {
      isValid: result.isValid,
      hasFormatted: !!result.formatted,
      error: result.error,
      preview: result.formatted?.substring(0, 100) + (result.formatted && result.formatted.length > 100 ? '...' : '')
    });
  });
}

// Função principal para executar todos os testes
function runAllTests() {
  console.log('🚀 === INICIANDO TESTES DE VALIDAÇÃO ===');
  console.log('Testando as correções implementadas no sistema de chat\n');
  
  try {
    testQRCodeProcessing();
    testMediaProcessing();
    testBase64Validation();
    testBase64Formatting();
    
    console.log('\n✅ === TODOS OS TESTES CONCLUÍDOS ===');
    console.log('Verifique os logs acima para validar as correções implementadas.');
    
  } catch (error) {
    console.error('\n❌ === ERRO DURANTE OS TESTES ===');
    console.error('Erro:', error);
  }
}

// Executar testes se este arquivo for executado diretamente
if (typeof window === 'undefined') {
  // Ambiente Node.js
  runAllTests();
} else {
  // Ambiente browser - expor função globalmente
  (window as any).runChatTests = runAllTests;
  console.log('Testes disponíveis. Execute runChatTests() no console para iniciar.');
}

export {
  testData,
  testQRCodeProcessing,
  testMediaProcessing,
  testBase64Validation,
  testBase64Formatting,
  runAllTests
};

