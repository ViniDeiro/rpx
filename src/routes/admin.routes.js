/**
 * Rotas administrativas
 */

const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const Match = require('../models/match.model');
const mongoose = require('mongoose');

// Middleware para verificar se o usuário é administrador
router.use(isAdmin);

/**
 * @route GET /api/admin/salas
 * @desc Obter lista de salas oficiais
 * @access Admin
 */
router.get('/salas', async (req, res) => {
  try {
    const salas = await Match.find({ isOfficialRoom: true })
      .sort({ created_at: -1 })
      .lean();
    
    res.json({ success: true, data: salas });
  } catch (error) {
    console.error('Erro ao buscar salas oficiais:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar salas oficiais', 
      error: error.message 
    });
  }
});

/**
 * @route GET /api/admin/salas/:id
 * @desc Obter detalhes de uma sala específica
 * @access Admin
 */
router.get('/salas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de sala inválido' 
      });
    }
    
    const sala = await Match.findOne({
      _id: id,
      isOfficialRoom: true
    }).lean();
    
    if (!sala) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sala não encontrada' 
      });
    }
    
    res.json({ success: true, data: sala });
  } catch (error) {
    console.error('Erro ao buscar detalhes da sala:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar detalhes da sala', 
      error: error.message 
    });
  }
});

/**
 * @route POST /api/admin/salas
 * @desc Criar uma nova sala oficial
 * @access Admin
 */
router.post('/salas', async (req, res) => {
  try {
    const salaData = req.body;
    
    // Validar dados obrigatórios
    if (!salaData.title || !salaData.type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Dados incompletos. Verifique se todos os campos obrigatórios foram fornecidos.' 
      });
    }
    
    // Adicionar campos específicos
    salaData.isOfficialRoom = true;
    salaData.created_by = req.user._id;
    
    // Criar a sala no banco de dados
    const novaSala = new Match(salaData);
    await novaSala.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Sala criada com sucesso',
      data: novaSala 
    });
  } catch (error) {
    console.error('Erro ao criar sala oficial:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao criar sala oficial', 
      error: error.message 
    });
  }
});

/**
 * @route PUT /api/admin/salas/:id
 * @desc Atualizar uma sala existente
 * @access Admin
 */
router.put('/salas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Validar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de sala inválido' 
      });
    }
    
    // Não permitir alteração de campos específicos
    delete updateData._id;
    delete updateData.created_by;
    delete updateData.isOfficialRoom;
    
    // Atualizar a sala
    const updatedSala = await Match.findOneAndUpdate(
      { _id: id, isOfficialRoom: true },
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!updatedSala) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sala não encontrada' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Sala atualizada com sucesso',
      data: updatedSala 
    });
  } catch (error) {
    console.error('Erro ao atualizar sala:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao atualizar sala', 
      error: error.message 
    });
  }
});

/**
 * @route DELETE /api/admin/salas/:id
 * @desc Excluir uma sala
 * @access Admin
 */
router.delete('/salas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de sala inválido' 
      });
    }
    
    // Verificar estado atual da sala
    const sala = await Match.findOne({ _id: id, isOfficialRoom: true });
    
    if (!sala) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sala não encontrada' 
      });
    }
    
    // Não permitir exclusão de salas em andamento
    if (sala.status === 'in_progress') {
      return res.status(400).json({ 
        success: false, 
        message: 'Não é possível excluir uma sala em andamento' 
      });
    }
    
    // Excluir a sala
    await Match.deleteOne({ _id: id, isOfficialRoom: true });
    
    res.json({ 
      success: true, 
      message: 'Sala excluída com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao excluir sala:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao excluir sala', 
      error: error.message 
    });
  }
});

module.exports = router; 