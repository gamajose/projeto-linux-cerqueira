const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const PDFService = require('../services/pdfService');
const crypto = require('crypto');

// Rota para buscar certificado por ID (numérico)
router.get('/:id', async (req, res) => {
    try {
        const certificate = await Certificate.findById(req.params.id);
        
        if (!certificate) {
            return res.status(404).json({ error: 'Certificado não encontrado' });
        }
        
        res.json(certificate);
    } catch (error) {
        console.error('Erro ao buscar certificado:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para buscar certificado por certificate_id (código string)
router.get('/certificate/:certificateId', async (req, res) => {
    try {
        const certificate = await Certificate.findByCertificateId(req.params.certificateId);
        
        if (!certificate) {
            return res.status(404).json({ error: 'Certificado não encontrado' });
        }
        
        res.json(certificate);
    } catch (error) {
        console.error('Erro ao buscar certificado:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para listar todos os certificados
router.get('/', async (req, res) => {
    try {
        const certificates = await Certificate.findAll();
        res.json(certificates);
    } catch (error) {
        console.error('Erro ao buscar certificados:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para criar certificado (AJUSTADO para nova estrutura)
router.post('/', async (req, res) => {
    try {
        const { 
            participant_name, 
            course_name, 
            hours, 
            issue_date, 
            completion_date, 
            certificate_id, 
            modalidade, 
            instrutor, 
            diretor, 
            organizacao, 
            hash_verificacao,
            valido = true
        } = req.body;

        // VALIDAÇÃO: Verificar se os campos obrigatórios estão presentes
        if (!participant_name || !course_name || !hours || !issue_date || !completion_date || !certificate_id) {
            return res.status(400).json({ 
                error: 'Campos obrigatórios faltando: participant_name, course_name, hours, issue_date, completion_date, certificate_id' 
            });
        }
        
        const newCertificate = await Certificate.create({
            participant_name,
            course_name,
            hours: parseInt(hours),
            issue_date,
            completion_date,
            certificate_id,
            modalidade: modalidade || 'Online',
            instrutor: instrutor || 'José Moraes',
            diretor: diretor || 'Danilo Germano',
            organizacao: organizacao || 'Red Innovations',
            hash_verificacao: hash_verificacao || crypto.randomBytes(6).toString('hex'),
            valido: valido !== undefined ? valido : true
        });
        
        res.status(201).json(newCertificate);
    } catch (error) {
        console.error('Erro ao criar certificado:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para atualizar certificado
router.put('/:id', async (req, res) => {
    try {
        const updatedCertificate = await Certificate.update(req.params.id, req.body);
        
        if (!updatedCertificate) {
            return res.status(404).json({ error: 'Certificado não encontrado' });
        }
        
        res.json(updatedCertificate);
    } catch (error) {
        console.error('Erro ao atualizar certificado:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para deletar certificado
router.delete('/:id', async (req, res) => {
    try {
        const deletedCertificate = await Certificate.delete(req.params.id);
        
        if (!deletedCertificate) {
            return res.status(404).json({ error: 'Certificado não encontrado' });
        }
        
        res.json({ message: 'Certificado deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar certificado:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para gerar PDF do certificado
router.get('/generate/:certificateId', async (req, res) => {
    let certificate;
    try {
        console.log('📥 Requisição recebida para gerar PDF:', req.params.certificateId);
        certificate = await Certificate.findByCertificateId(req.params.certificateId);

        if (!certificate) {
            console.log('❌ Certificado não encontrado:', req.params.certificateId);
            return res.status(404).json({ error: 'Certificado não encontrado' });
        }

        if (!certificate.valido) {
            console.log('❌ Certificado inválido:', req.params.certificateId);
            return res.status(400).json({ error: 'Certificado inválido' });
        }

        console.log('🛠️ Gerando PDF com dados:', JSON.stringify(certificate));
        const pdfBuffer = await PDFService.generateCertificateFromData(certificate);

        if (!pdfBuffer || pdfBuffer.length === 0) {
            throw new Error('Buffer do PDF está vazio');
        }

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="certificado-${certificate.certificate_id}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        res.send(pdfBuffer);

        await Certificate.incrementDownloadCount(certificate.id);
        console.log('✅ PDF enviado com sucesso para:', certificate.certificate_id);

    } catch (error) {
        console.error('❌ Erro ao gerar ou enviar PDF:', error.message, error.stack);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Erro ao gerar PDF',
                details: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
            });
        }
    }
});

// Rota para incrementar contador de downloads
router.post('/:id/download', async (req, res) => {
    try {
        const certificate = await Certificate.incrementDownloadCount(req.params.id);
        
        if (!certificate) {
            return res.status(404).json({ error: 'Certificado não encontrado' });
        }
        
        res.json({ message: 'Contador de downloads incrementado', download_count: certificate.download_count });
    } catch (error) {
        console.error('Erro ao incrementar download:', error.message, error.stack);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para estatísticas
router.get('/stats', async (req, res) => {
    try {
        const stats = await Certificate.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error.message, error.stack);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;