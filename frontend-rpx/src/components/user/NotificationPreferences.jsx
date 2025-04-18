import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormGroup,
  FormControlLabel,
  Button,
  Divider,
  Container,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Tooltip,
  Chip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationIcon from '../common/NotificationIcon';
import {
  Info as InfoIcon,
  Save as SaveIcon,
  AccessTime as AccessTimeIcon,
  DoNotDisturb as DoNotDisturbIcon
} from '@mui/icons-material';

const NOTIFICATION_TYPES = [
  { id: 'announcement', label: 'Anúncios', description: 'Notificações gerais e comunicados da plataforma' },
  { id: 'system', label: 'Sistema', description: 'Atualizações e alterações no sistema' },
  { id: 'game', label: 'Jogos', description: 'Novidades e eventos relacionados a jogos' },
  { id: 'tournament', label: 'Torneios', description: 'Informações sobre competições e torneios' },
  { id: 'team', label: 'Equipes', description: 'Atualizações sobre suas equipes' },
  { id: 'message', label: 'Mensagens', description: 'Mensagens diretas de outros usuários' }
];

const NOTIFICATION_CHANNELS = [
  { id: 'email', label: 'E-mail', description: 'Receber notificações por e-mail' },
  { id: 'push', label: 'Push', description: 'Receber notificações no navegador' },
  { id: 'app', label: 'No App', description: 'Visualizar notificações dentro do aplicativo' }
];

const TIME_PERIODS = [
  { value: 'always', label: 'Sempre' },
  { value: 'quiet_hours', label: 'Fora do horário de silêncio' },
  { value: 'never', label: 'Nunca' }
];

const NotificationPreferences = () => {
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    enabled: true,
    channels: {
      email: true,
      push: true,
      app: true
    },
    types: {
      announcement: {
        enabled: true,
        email: true,
        push: true,
        app: true
      },
      system: {
        enabled: true,
        email: true,
        push: true,
        app: true
      },
      game: {
        enabled: true,
        email: true,
        push: false,
        app: true
      },
      tournament: {
        enabled: true,
        email: true,
        push: true,
        app: true
      },
      team: {
        enabled: true,
        email: true,
        push: true,
        app: true
      },
      message: {
        enabled: true,
        email: false,
        push: true,
        app: true
      }
    },
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

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
      // Os dados já estão pré-carregados no state inicial
      setLoading(false);
    }, 1000);
  }, []);

  const handleMasterToggle = (event) => {
    setPreferences({
      ...preferences,
      enabled: event.target.checked
    });
  };

  const handleChannelToggle = (channelId) => {
    setPreferences(prev => {
      const updatedChannels = {
        ...prev.channels,
        [channelId]: !prev.channels[channelId]
      };
      
      // Atualizar também as configurações dos tipos para este canal
      const updatedTypes = {};
      Object.keys(prev.types).forEach(typeId => {
        updatedTypes[typeId] = {
          ...prev.types[typeId],
          [channelId]: updatedChannels[channelId] && prev.types[typeId][channelId]
        };
      });
      
      return {
        ...prev,
        channels: updatedChannels,
        types: updatedTypes
      };
    });
  };

  const handleTypeToggle = (typeId) => {
    setPreferences(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [typeId]: {
          ...prev.types[typeId],
          enabled: !prev.types[typeId].enabled
        }
      }
    }));
  };

  const handleTypeChannelToggle = (typeId, channelId) => {
    // Só pode ser ativado se o canal principal estiver ativo
    if (!preferences.channels[channelId]) return;
    
    setPreferences(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [typeId]: {
          ...prev.types[typeId],
          [channelId]: !prev.types[typeId][channelId]
        }
      }
    }));
  };

  const handleQuietHoursToggle = () => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled: !prev.quietHours.enabled
      }
    }));
  };

  const handleQuietHoursChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }));
  };

  const handleSavePreferences = () => {
    setSaveLoading(true);
    
    // Simulação de chamada API
    setTimeout(() => {
      setSaveLoading(false);
      setSnackbar({
        open: true,
        message: 'Preferências salvas com sucesso!',
        severity: 'success'
      });
    }, 1500);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  const isTypeEnabled = (typeId) => {
    return preferences.enabled && preferences.types[typeId].enabled;
  };

  const isChannelEnabledForType = (typeId, channelId) => {
    return (
      preferences.enabled && 
      preferences.channels[channelId] && 
      preferences.types[typeId].enabled && 
      preferences.types[typeId][channelId]
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <NotificationsIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="h5" component="h1" fontWeight="bold">
          Preferências de Notificações
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ mb: 4 }}>
        <FormControlLabel
          control={
            <Switch
              checked={preferences.enabled}
              onChange={handleMasterToggle}
              color="primary"
            />
          }
          label={
            <Typography variant="subtitle1" fontWeight="medium">
              Ativar todas as notificações
            </Typography>
          }
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Ative ou desative todas as notificações da plataforma de uma vez.
        </Typography>
      </Box>
      
      <Grid container spacing={4}>
        {/* Canais de Notificação */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                <Typography variant="h6" component="h2">
                  Canais de Notificação
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Escolha como deseja receber suas notificações.
              </Typography>
              
              <FormGroup>
                {NOTIFICATION_CHANNELS.map(channel => (
                  <FormControlLabel
                    key={channel.id}
                    control={
                      <Switch
                        checked={preferences.channels[channel.id] && preferences.enabled}
                        onChange={() => handleChannelToggle(channel.id)}
                        disabled={!preferences.enabled}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body1">{channel.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {channel.description}
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 1 }}
                  />
                ))}
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Horário de Silêncio */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccessTimeIcon sx={{ mr: 1, color: 'primary.main' }} fontSize="small" />
                <Typography variant="h6" component="h2">
                  Horário de Silêncio
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure um período em que você não deseja receber notificações.
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.quietHours.enabled && preferences.enabled}
                    onChange={handleQuietHoursToggle}
                    disabled={!preferences.enabled}
                    color="primary"
                  />
                }
                label="Ativar horário de silêncio"
                sx={{ mb: 2 }}
              />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" gutterBottom>
                    Início
                  </Typography>
                  <input
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                    disabled={!preferences.quietHours.enabled || !preferences.enabled}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ccc', 
                      borderRadius: '4px' 
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" gutterBottom>
                    Fim
                  </Typography>
                  <input
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                    disabled={!preferences.quietHours.enabled || !preferences.enabled}
                    style={{ 
                      width: '100%', 
                      padding: '8px', 
                      border: '1px solid #ccc', 
                      borderRadius: '4px' 
                    }}
                  />
                </Grid>
              </Grid>
              
              {preferences.quietHours.enabled && preferences.enabled && (
                <Box sx={{ mt: 2, p: 1, bgcolor: 'info.50', borderRadius: 1, display: 'flex', alignItems: 'center' }}>
                  <InfoIcon color="info" fontSize="small" sx={{ mr: 1 }} />
                  <Typography variant="body2">
                    Notificações silenciadas das {preferences.quietHours.start} às {preferences.quietHours.end}.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Configurações por Tipo de Notificação */}
      <Typography variant="h6" component="h2" sx={{ mt: 4, mb: 2 }}>
        Configurações por Tipo de Notificação
      </Typography>
      
      <List sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        {NOTIFICATION_TYPES.map((type) => (
          <React.Fragment key={type.id}>
            <ListItem>
              <ListItemIcon>
                <NotificationIcon type={type.id} size="medium" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {type.label}
                    </Typography>
                    {!isTypeEnabled(type.id) && (
                      <Chip 
                        icon={<DoNotDisturbIcon fontSize="small" />} 
                        label="Desativado" 
                        size="small" 
                        color="default" 
                        sx={{ ml: 1 }} 
                      />
                    )}
                  </Box>
                }
                secondary={type.description}
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={isTypeEnabled(type.id)}
                  onChange={() => handleTypeToggle(type.id)}
                  disabled={!preferences.enabled}
                />
              </ListItemSecondaryAction>
            </ListItem>
            
            {isTypeEnabled(type.id) && (
              <Box sx={{ ml: 9, mr: 4, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Receber por:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {NOTIFICATION_CHANNELS.map(channel => (
                    <Tooltip key={channel.id} title={channel.description}>
                      <Box>
                        <Chip
                          label={channel.label}
                          color={isChannelEnabledForType(type.id, channel.id) ? "primary" : "default"}
                          variant={isChannelEnabledForType(type.id, channel.id) ? "filled" : "outlined"}
                          size="small"
                          onClick={() => handleTypeChannelToggle(type.id, channel.id)}
                          disabled={!preferences.channels[channel.id] || !preferences.enabled}
                          sx={{ opacity: !preferences.channels[channel.id] ? 0.5 : 1 }}
                        />
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            )}
            
            <Divider component="li" />
          </React.Fragment>
        ))}
      </List>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={handleSavePreferences}
          disabled={saveLoading}
        >
          {saveLoading ? <CircularProgress size={24} /> : 'Salvar Preferências'}
        </Button>
      </Box>
      
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

export default NotificationPreferences; 