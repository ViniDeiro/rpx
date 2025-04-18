import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import NotificationIcon from '../common/NotificationIcon';

const NOTIFICATION_TYPES = [
  { id: 'announcement', label: 'Anúncios', description: 'Notificações gerais e comunicados' },
  { id: 'system', label: 'Sistema', description: 'Atualizações e alterações no sistema' },
  { id: 'game', label: 'Jogos', description: 'Novidades e eventos relacionados a jogos' },
  { id: 'tournament', label: 'Torneios', description: 'Competições e torneios' },
  { id: 'team', label: 'Equipes', description: 'Informações sobre equipes' },
  { id: 'message', label: 'Mensagens', description: 'Comunicações diretas' }
];

const NOTIFICATION_CHANNELS = [
  { id: 'email', label: 'E-mail' },
  { id: 'push', label: 'Push' },
  { id: 'app', label: 'No App' }
];

const AUDIENCE_OPTIONS = [
  { id: 'all', label: 'Todos os usuários' },
  { id: 'premium', label: 'Usuários Premium' },
  { id: 'freemium', label: 'Usuários Gratuitos' },
  { id: 'inactive', label: 'Usuários Inativos' },
  { id: 'specific', label: 'Usuários Específicos' }
];

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const NotificationManager = () => {
  const [tabValue, setTabValue] = useState(0);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    content: '',
    type: 'announcement',
    channels: ['app'],
    audience: 'all',
    scheduledFor: '',
    specificUsers: ''
  });
  
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Simular carregamento de dados
  useEffect(() => {
    setLoading(true);
    
    // Simular chamada API
    setTimeout(() => {
      const mockNotifications = [
        {
          id: 1,
          title: 'Atualização de Sistema',
          content: 'Uma nova atualização está disponível. Confira as novidades!',
          type: 'system',
          channels: ['app', 'email'],
          audience: 'all',
          scheduledFor: '2023-09-25T10:00',
          sentAt: null,
          status: 'scheduled'
        },
        {
          id: 2,
          title: 'Novo Torneio',
          content: 'Um novo torneio foi anunciado. Inscreva-se agora!',
          type: 'tournament',
          channels: ['app', 'push', 'email'],
          audience: 'premium',
          scheduledFor: null,
          sentAt: '2023-09-20T14:30',
          status: 'sent'
        }
      ];

      const mockTemplates = [
        {
          id: 1,
          name: 'Boas-vindas',
          title: 'Bem-vindo(a) à plataforma!',
          content: 'Olá {username}, seja bem-vindo(a) à nossa plataforma de jogos!',
          type: 'announcement',
          channels: ['email', 'app']
        },
        {
          id: 2,
          name: 'Lembrete de Torneio',
          title: 'Seu torneio começa em breve',
          content: 'Olá {username}, não se esqueça que seu torneio "{tournament}" começa em {time}!',
          type: 'tournament',
          channels: ['push', 'email']
        }
      ];

      setNotifications(mockNotifications);
      setTemplates(mockTemplates);
      setLoading(false);
    }, 1500);
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setNotificationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleChannelsChange = (channel) => {
    setNotificationForm(prev => {
      const updatedChannels = prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel];
      
      return {
        ...prev,
        channels: updatedChannels
      };
    });
  };

  const handleOpenDialog = (notification = null) => {
    if (notification) {
      setSelectedNotification(notification);
      setNotificationForm({
        title: notification.title,
        content: notification.content,
        type: notification.type,
        channels: notification.channels,
        audience: notification.audience,
        scheduledFor: notification.scheduledFor || '',
        specificUsers: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedNotification(null);
    resetForm();
  };

  const resetForm = () => {
    setNotificationForm({
      title: '',
      content: '',
      type: 'announcement',
      channels: ['app'],
      audience: 'all',
      scheduledFor: '',
      specificUsers: ''
    });
  };

  const handleCreateOrUpdateNotification = () => {
    setLoading(true);
    
    // Simular envio para API
    setTimeout(() => {
      if (selectedNotification) {
        // Atualizar notificação existente
        const updatedNotifications = notifications.map(notification => 
          notification.id === selectedNotification.id 
            ? { 
                ...notification, 
                ...notificationForm, 
                updatedAt: new Date().toISOString() 
              } 
            : notification
        );
        setNotifications(updatedNotifications);
        
        setSnackbar({
          open: true,
          message: 'Notificação atualizada com sucesso!',
          severity: 'success'
        });
      } else {
        // Criar nova notificação
        const newNotification = {
          id: Date.now(),
          ...notificationForm,
          status: notificationForm.scheduledFor ? 'scheduled' : 'draft',
          createdAt: new Date().toISOString(),
          sentAt: null
        };
        
        setNotifications([...notifications, newNotification]);
        
        setSnackbar({
          open: true,
          message: 'Notificação criada com sucesso!',
          severity: 'success'
        });
      }
      
      setLoading(false);
      handleCloseDialog();
    }, 1000);
  };

  const handleSendNotification = (notificationId) => {
    setLoading(true);
    
    // Simular envio para API
    setTimeout(() => {
      const updatedNotifications = notifications.map(notification => 
        notification.id === notificationId 
          ? { 
              ...notification, 
              status: 'sent',
              sentAt: new Date().toISOString(),
              scheduledFor: null
            } 
          : notification
      );
      
      setNotifications(updatedNotifications);
      
      setSnackbar({
        open: true,
        message: 'Notificação enviada com sucesso!',
        severity: 'success'
      });
      
      setLoading(false);
    }, 1000);
  };

  const handleDeleteNotification = (notificationId) => {
    setLoading(true);
    
    // Simular envio para API
    setTimeout(() => {
      const updatedNotifications = notifications.filter(
        notification => notification.id !== notificationId
      );
      
      setNotifications(updatedNotifications);
      
      setSnackbar({
        open: true,
        message: 'Notificação excluída com sucesso!',
        severity: 'warning'
      });
      
      setLoading(false);
    }, 1000);
  };

  const handleUseTemplate = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      setNotificationForm({
        ...notificationForm,
        title: template.title,
        content: template.content,
        type: template.type,
        channels: template.channels
      });
      
      setSnackbar({
        open: true,
        message: 'Template aplicado com sucesso!',
        severity: 'info'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const getStatusChip = (status) => {
    switch(status) {
      case 'sent':
        return <Chip label="Enviado" color="success" size="small" />;
      case 'scheduled':
        return <Chip label="Agendado" color="primary" size="small" icon={<ScheduleIcon />} />;
      case 'draft':
        return <Chip label="Rascunho" color="default" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3, overflow: 'hidden' }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Gerenciador de Notificações
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="notification manager tabs">
          <Tab label="Notificações" id="notification-tab-0" aria-controls="notification-tabpanel-0" />
          <Tab label="Templates" id="notification-tab-1" aria-controls="notification-tabpanel-1" />
          <Tab label="Relatórios" id="notification-tab-2" aria-controls="notification-tabpanel-2" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Lista de Notificações</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpenDialog()}
          >
            Nova Notificação
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Título</TableCell>
                  <TableCell>Canais</TableCell>
                  <TableCell>Público</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Agendamento</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <NotificationIcon type={notification.type} size="small" />
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {NOTIFICATION_TYPES.find(t => t.id === notification.type)?.label || notification.type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{notification.title}</TableCell>
                    <TableCell>
                      {notification.channels.map(channel => (
                        <Chip 
                          key={channel} 
                          label={NOTIFICATION_CHANNELS.find(c => c.id === channel)?.label || channel} 
                          size="small" 
                          sx={{ mr: 0.5, mb: 0.5 }} 
                        />
                      ))}
                    </TableCell>
                    <TableCell>
                      {AUDIENCE_OPTIONS.find(a => a.id === notification.audience)?.label || notification.audience}
                    </TableCell>
                    <TableCell>{getStatusChip(notification.status)}</TableCell>
                    <TableCell>
                      {notification.scheduledFor ? (
                        new Date(notification.scheduledFor).toLocaleString('pt-BR')
                      ) : (
                        notification.sentAt ? (
                          `Enviado em ${new Date(notification.sentAt).toLocaleString('pt-BR')}`
                        ) : (
                          '-'
                        )
                      )}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog(notification)}
                        disabled={notification.status === 'sent'}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      {notification.status !== 'sent' && (
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleSendNotification(notification.id)}
                        >
                          <SendIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteNotification(notification.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {notifications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                        Nenhuma notificação encontrada.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">Templates de Notificação</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
          >
            Novo Template
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Paper elevation={1} sx={{ p: 2, height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {template.name}
                    </Typography>
                    <NotificationIcon type={template.type} size="small" />
                  </Box>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    {template.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    {template.content}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    {template.channels.map(channel => (
                      <Chip 
                        key={channel} 
                        label={NOTIFICATION_CHANNELS.find(c => c.id === channel)?.label || channel} 
                        size="small" 
                        sx={{ mr: 0.5 }} 
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Button 
                      size="small" 
                      onClick={() => handleUseTemplate(template.id)}
                      startIcon={<RefreshIcon />}
                    >
                      Usar Template
                    </Button>
                    <IconButton size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              </Grid>
            ))}
            {templates.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <Typography variant="body2" color="textSecondary">
                    Nenhum template encontrado.
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          Relatórios de Engajamento
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1">
              Esta funcionalidade estará disponível em breve.
            </Typography>
          </Box>
        )}
      </TabPanel>
      
      {/* Dialog para criar/editar notificação */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {selectedNotification ? 'Editar Notificação' : 'Criar Nova Notificação'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Título"
                name="title"
                value={notificationForm.title}
                onChange={handleFormChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth required>
                <InputLabel id="notification-type-label">Tipo</InputLabel>
                <Select
                  labelId="notification-type-label"
                  name="type"
                  value={notificationForm.type}
                  onChange={handleFormChange}
                  label="Tipo"
                >
                  {NOTIFICATION_TYPES.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <NotificationIcon type={type.id} size="small" />
                        <Typography sx={{ ml: 1 }}>{type.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Conteúdo"
                name="content"
                value={notificationForm.content}
                onChange={handleFormChange}
                required
                multiline
                rows={4}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Canais de Envio
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {NOTIFICATION_CHANNELS.map((channel) => (
                  <FormControlLabel
                    key={channel.id}
                    control={
                      <Switch
                        checked={notificationForm.channels.includes(channel.id)}
                        onChange={() => handleChannelsChange(channel.id)}
                        color="primary"
                      />
                    }
                    label={channel.label}
                  />
                ))}
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="notification-audience-label">Público</InputLabel>
                <Select
                  labelId="notification-audience-label"
                  name="audience"
                  value={notificationForm.audience}
                  onChange={handleFormChange}
                  label="Público"
                >
                  {AUDIENCE_OPTIONS.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Agendar para"
                name="scheduledFor"
                type="datetime-local"
                value={notificationForm.scheduledFor}
                onChange={handleFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            
            {notificationForm.audience === 'specific' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="IDs de usuários específicos (separados por vírgula)"
                  name="specificUsers"
                  value={notificationForm.specificUsers}
                  onChange={handleFormChange}
                  placeholder="ex: 123, 456, 789"
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleCreateOrUpdateNotification} 
            variant="contained"
            disabled={loading || !notificationForm.title || !notificationForm.content}
          >
            {loading ? (
              <CircularProgress size={24} />
            ) : (
              selectedNotification ? 'Atualizar' : 'Criar'
            )}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para mensagens de sucesso/erro */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default NotificationManager; 