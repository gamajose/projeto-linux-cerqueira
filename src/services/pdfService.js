// src/services/pdfService.js
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PDFService {
    constructor() {
        this.templatePath = path.join(__dirname, '..', '..', 'certificates', 'templates', 'certificado-template.html');
        this.chromiumPath = this.getChromiumPath();
    }

    getChromiumPath() {
        try {
            // Tenta encontrar o Chromium instalado no sistema
            if (process.platform === 'win32') {
                return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
            } else if (process.platform === 'linux') {
                // Linux - tenta vários caminhos comuns
                const paths = [
                    '/usr/bin/google-chrome',
                    '/usr/bin/google-chrome-stable',
                    '/usr/bin/chromium',
                    '/usr/bin/chromium-browser'
                ];
                
                for (const p of paths) {
                    if (fs.existsSync(p)) return p;
                }
                
                // Tenta instalar o Chromium se não encontrar
                try {
                    execSync('which chromium || which google-chrome', { stdio: 'pipe' });
                } catch (e) {
                    console.log('Instalando Chromium...');
                    execSync('sudo apt-get update && sudo apt-get install -y chromium-browser', { stdio: 'inherit' });
                    return '/usr/bin/chromium-browser';
                }
            }
        } catch (error) {
            console.warn('Não foi possível encontrar/instalar Chromium:', error.message);
        }
        return null;
    }

    async generateCertificate(participantName, courseName, hours, date, certificateId, hash) {
        console.log('🚀 Iniciando geração de PDF para:', participantName);
        
        let browser;
        try {
            // Configuração robusta do browser
            const browserOptions = {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                    '--font-render-hinting=none'
                ],
                timeout: 120000
            };

            // Usa Chromium do sistema se disponível
            if (this.chromiumPath && fs.existsSync(this.chromiumPath)) {
                browserOptions.executablePath = this.chromiumPath;
                console.log('Usando Chromium do sistema:', this.chromiumPath);
            }

            browser = await puppeteer.launch(browserOptions);
            const page = await browser.newPage();

            // Configura viewport para A4
            await page.setViewport({
                width: 1050,
                height: 750,
                deviceScaleFactor: 1
            });

            // Ler e processar template
            let htmlTemplate = fs.readFileSync(this.templatePath, 'utf8');
            
            // Substitui placeholders - mais robusto
            const replacements = {
                '{{NOME_DO_PARTICIPANTE}}': participantName,
                '{{CURSO}}': courseName,
                '{{CARGA_HORARIA}}': hours.toString(),
                '{{DATA}}': date,
                '{{CERTIFICATE_ID}}': certificateId,
                '{{HASH}}': hash || 'a7b9c3d2e1f4'
            };

            Object.entries(replacements).forEach(([key, value]) => {
                htmlTemplate = htmlTemplate.replace(new RegExp(key, 'g'), value);
            });

            // Configura content security policy para permitir recursos
            await page.setContent(htmlTemplate, {
                waitUntil: 'networkidle0',
                timeout: 60000
            });

            // Espera um pouco mais para garantir renderização completa
            await page.evaluateHandle('document.fonts.ready');

            // Gera PDF com configurações otimizadas
            const pdfBuffer = await page.pdf({
                width: '1050px',
                heigtht: '750px',
                printBackground: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
                timeout: 60000
            });

            await browser.close();
            
            console.log('✅ PDF gerado com sucesso! Tamanho:', pdfBuffer.length, 'bytes');
            return pdfBuffer;

        } catch (error) {
            console.error('❌ Erro ao gerar PDF:', error.message);
            if (browser) await browser.close();
            
            // Fallback: tenta método alternativo
            return await this.fallbackMethod(participantName, courseName, hours, date, certificateId, hash);
        }
    }

    async fallbackMethod(participantName, courseName, hours, date, certificateId, hash) {
        console.log('Tentando método alternativo...');
        
        try {
            // Usa html-pdf como fallback
            const pdf = require('html-pdf');
            const htmlTemplate = fs.readFileSync(this.templatePath, 'utf8');
            
            const replacements = {
                '{{NOME_DO_PARTICIPANTE}}': participantName,
                '{{CURSO}}': courseName,
                '{{CARGA_HORARIA}}': hours.toString(),
                '{{DATA}}': date,
                '{{CERTIFICATE_ID}}': certificateId,
                '{{HASH}}': hash || 'a7b9c3d2e1f4'
            };

            let processedHtml = htmlTemplate;
            Object.entries(replacements).forEach(([key, value]) => {
                processedHtml = processedHtml.replace(new RegExp(key, 'g'), value);
            });

            return new Promise((resolve, reject) => {
                pdf.create(processedHtml, {
                    format: 'A4',
                    orientation: 'landscape',
                    border: '0',
                    quality: '100',
                    timeout: 60000
                }).toBuffer((err, buffer) => {
                    if (err) reject(err);
                    else resolve(buffer);
                });
            });

        } catch (fallbackError) {
            console.error('❌ Fallback também falhou:', fallbackError.message);
            throw new Error('Não foi possível gerar o PDF');
        }
    }

    async generateCertificateFromData(certificateData) {
        return this.generateCertificate(
            certificateData.participant_name,
            certificateData.course_name,
            certificateData.hours,
            certificateData.completion_date,
            certificateData.certificate_id,
            certificateData.hash_verificacao
        );
    }
}

module.exports = new PDFService();