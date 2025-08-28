// test-complex-template.js
const PDFService = require('./src/services/pdfService');

async function testComplexTemplate() {
    try {
        const testData = {
            participant_name: 'Maria Silva Santos',
            course_name: 'Curso Avançado de Linux Administração',
            hours: 40,
            completion_date: '20/12/2025',
            certificate_id: 'LINUX2025-ADV001',
            hash_verificacao: 'adv123hash456'
        };

        console.log('Testando template complexo...');
        
        const pdfBuffer = await PDFService.generateCertificateFromData(testData);
        
        const fs = require('fs');
        fs.writeFileSync('test-complex.pdf', pdfBuffer);
        console.log('✅ PDF complexo salvo como test-complex.pdf');
        
        // Verifica se o PDF é válido
        if (pdfBuffer.length > 1000) {
            console.log('✅ PDF parece válido - tamanho:', pdfBuffer.length, 'bytes');
        } else {
            console.log('❌ PDF muito pequeno, pode estar corrompido');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

testComplexTemplate();