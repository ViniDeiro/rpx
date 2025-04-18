import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Button, 
  Container, 
  Typography, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Paper, 
  Grid,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';

const NotificationPanel = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [target, setTarget] = useState('all');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    fetchSentNotifications();
  }, []);

  const fetchSentNotifications = async () => {
    try {
      setLoading(true);
      // Substituir pela chamada real à API quando estiver disponível
      const response = await axios.get('/api/admin/notifications');
      setSentNotifications(response.data);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      showSnackbar('Erro ao carregar notificações', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !message) {
      showSnackbar('Preencha todos os campos obrigatórios', 'error');
      return;
    }
    
    const notificationData = {
      title,
      message,
      type,
      target,
      sentAt: new Date().toISOString()
    };
    
    try {
      setLoading(true);
      // Substituir pela chamada real à API quando estiver disponível
      const response = await axios.post('/api/admin/notifications', notificationData);
      
      showSnackbar('Notificação enviada com sucesso!', 'success');
      resetForm();
      fetchSentNotifications();
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      showSnackbar('Erro ao enviar notificação', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setType('info');
    setTarget('all');
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 4, mb: 4 }}>
        Painel de Notificações Administrativas
      </Typography>
      
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Enviar Nova Notificação
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <TextField
                label="Título"
                variant="outlined"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                margin="normal"
                required
              />
              
              <TextField
                label="Mensagem"
                variant="outlined"
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                margin="normal"
                required
                multiline
                rows={4}
              />
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  label="Tipo"
                >
                  <MenuItem value="info">Informação</MenuItem>
                  <MenuItem value="warning">Aviso</MenuItem>
                  <MenuItem value="error">Erro</MenuItem>
                  <MenuItem value="success">Sucesso</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>Destinatários</InputLabel>
                <Select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  label="Destinatários"
                >
                  <MenuItem value="all">Todos os usuários</MenuItem>
                  <MenuItem value="premium">Usuários Premium</MenuItem>
                  <MenuItem value="admin">Administradores</MenuItem>
                  <MenuItem value="team">Times</MenuItem>
                </Select>
              </FormControl>
              
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                fullWidth 
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Enviar Notificação'}
              </Button>
            </form>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, maxHeight: 600, overflow: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              Notificações Recentes
            </Typography>
            
            {loading && !sentNotifications.length ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
              </Box>
            ) : sentNotifications.length > 0 ? (
              sentNotifications.map((notification, index) => (
                <Paper 
                  key={index} 
                  elevation={1} 
                  sx={{ 
                    p: 2, 
                    mb: 2, 
                    borderLeft: 6, 
                    borderColor: 
                      notification.type === 'error' ? 'error.main' : 
                      notification.type === 'warning' ? 'warning.main' : 
                      notification.type === 'success' ? 'success.main' : 
                      'info.main' 
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {notification.message}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Enviado para: {notification.target === 'all' ? 'Todos' : 
                                    notification.target === 'premium' ? 'Usuários Premium' : 
                                    notification.target === 'admin' ? 'Administradores' : 'Times'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.sentAt).toLocaleString('pt-BR')}
                    </Typography>
                  </Box>
                </Paper>
              ))
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Nenhuma notificação enviada recentemente.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotificationPanel; 