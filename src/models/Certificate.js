// src/models/Certificate.js
const db = require('../config/database');

class Certificate {
    static async findById(id) {
        try {
            // Verifica se o ID é numérico antes de buscar
            if (isNaN(id)) {
                // Se não for numérico, busca por certificate_id
                const result = await db.query(
                    'SELECT * FROM certificates WHERE certificate_id = $1',
                    [id]
                );
                return result.rows[0];
        }
            
            // Se for numérico, busca pelo ID normal
            const result = await db.query(
                'SELECT * FROM certificates WHERE id = $1',
                [parseInt(id)]
            );
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findByCertificateId(certificateId) {
        try {
            const result = await db.query(
                'SELECT * FROM certificates WHERE certificate_id = $1',
                [certificateId]
            );
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async create(certificateData) {
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
            } = certificateData;
            
            const result = await db.query(
                `INSERT INTO certificates 
                 (participant_name, course_name, hours, issue_date, completion_date, 
                  certificate_id, modalidade, instrutor, diretor, organizacao, 
                  hash_verificacao, valido) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
                 RETURNING *`,
                [participant_name, course_name, hours, issue_date, completion_date,
                 certificate_id, modalidade, instrutor, diretor, organizacao,
                 hash_verificacao, valido]
            );
            
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async findAll() {
        try {
            const result = await db.query(
                'SELECT * FROM certificates ORDER BY created_at DESC'
            );
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    static async update(id, certificateData) {
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
                valido 
            } = certificateData;
            
            const result = await db.query(
                `UPDATE certificates 
                 SET participant_name = $1, course_name = $2, hours = $3, 
                     issue_date = $4, completion_date = $5, certificate_id = $6,
                     modalidade = $7, instrutor = $8, diretor = $9, 
                     organizacao = $10, hash_verificacao = $11, valido = $12,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $13 
                 RETURNING *`,
                [participant_name, course_name, hours, issue_date, completion_date,
                 certificate_id, modalidade, instrutor, diretor, organizacao,
                 hash_verificacao, valido, id]
            );
            
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async delete(id) {
        try {
            const result = await db.query(
                'DELETE FROM certificates WHERE id = $1 RETURNING *',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async incrementDownloadCount(id) {
        try {
            const result = await db.query(
                'UPDATE certificates SET download_count = download_count + 1 WHERE id = $1 RETURNING *',
                [id]
            );
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    }

    static async getStats() {
        try {
            const totalResult = await db.query('SELECT COUNT(*) as total FROM certificates');
            const validResult = await db.query('SELECT COUNT(*) as valid FROM certificates WHERE valido = true');
            const downloadsResult = await db.query('SELECT SUM(download_count) as total_downloads FROM certificates');
            
            return {
                total: parseInt(totalResult.rows[0].total),
                valid: parseInt(validResult.rows[0].valid),
                total_downloads: parseInt(downloadsResult.rows[0].total_downloads || 0)
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Certificate;