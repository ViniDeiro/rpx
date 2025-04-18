import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Save as SaveIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  PhoneAndroid as PhoneAndroidIcon,
  Help as HelpIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import NotificationIcon from '../../components/common/NotificationIcon';

const NotificationPreferences = () => {
  // Estado para as preferências de notificações
  const [preferences, setPreferences] = useState({
    // Preferências por tipo de notificação
    announcement: {
      inApp: true,
      email: true,
      push: true
    },
    system: {
      inApp: true,
      email: true,
      push: true
    },
    game: {
      inApp: true,
      email: false,
      push: true
    },
    tournament: {
      inApp: true,
      email: true,
      push: true
    },
    team: {
      inApp: true,
      email: true,
      push: true
    },
    message: {
      inApp: true,
      email: true,
      push: true
    },
    // Preferências globais
    global: {
      emailDigest: true,
      emailDigestFrequency: 'daily', // 'daily' ou 'weekly'
      doNotDisturb: false,
      doNotDisturbStart: '22:00',
      doNotDisturbEnd: '08:00',
      soundEnabled: true
    }
  });
  
  // Estado para feedback de salvamento
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estado para controlar se houve alterações
  const [hasChanges, setHasChanges] = useState(false);
  
  // Tipos de notificação com descrições
  const notificationTypes = [
    { 
      id: 'announcement', 
      label: 'Anúncios', 
      description: 'Informações sobre novidades, promoções e atualizações da plataforma.'
    },
    { 
      id: 'system', 
      label: 'Sistema', 
      description: 'Manutenções programadas, mudanças nos termos de serviço e segurança.'
    },
    { 
      id: 'game', 
      label: 'Jogos', 
      description: 'Novos jogos adicionados, atualizações de jogos e eventos in-game.'
    },
    { 
      id: 'tournament', 
      label: 'Torneios', 
      description: 'Registros, resultados, convites e informações sobre torneios.'
    },
    { 
      id: 'team', 
      label: 'Time', 
      description: 'Convites para times, atualizações de membros e eventos de equipe.'
    },
    { 
      id: 'message', 
      label: 'Mensagens', 
      description: 'Mensagens diretas de outros usuários da plataforma.'
    }
  ];
  
  // Simula a busca das preferências do usuário do servidor
  useEffect(() => {
    // Em um caso real, faria uma chamada API aqui
    // Usando o setTimeout para simular um carregamento assíncrono
    setTimeout(() => {
      // Já iniciamos com o estado padrão, então não precisamos fazer nada
      // setPreferences seria chamado com a resposta da API
    }, 500);
  }, []);
  
  // Atualiza uma preferência de tipo específico
  const handleChangeTypePreference = (type, channel, value) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: value
      }
    }));
    setHasChanges(true);
  };
  
  // Atualiza uma preferência global
  const handleChangeGlobalPreference = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      global: {
        ...prev.global,
        [key]: value
      }
    }));
    setHasChanges(true);
  };
  
  // Função para desativar todas as notificações de um determinado canal
  const handleDisableAllChannel = (channel) => {
    const updatedPreferences = { ...preferences };
    
    notificationTypes.forEach(type => {
      updatedPreferences[type.id][channel] = false;
    });
    
    setPreferences(updatedPreferences);
    setHasChanges(true);
  };
  
  // Função para ativar todas as notificações de um determinado canal
  const handleEnableAllChannel = (channel) => {
    const updatedPreferences = { ...preferences };
    
    notificationTypes.forEach(type => {
      updatedPreferences[type.id][channel] = true;
    });
    
    setPreferences(updatedPreferences);
    setHasChanges(true);
  };
  
  // Salva as preferências no servidor
  const handleSavePreferences = () => {
    // Em um caso real, faria uma chamada API aqui
    
    // Simulando um salvamento com sucesso
    setTimeout(() => {
      setSnackbar({
        open: true,
        message: 'Preferências de notificação salvas com sucesso!',
        severity: 'success'
      });
      setHasChanges(false);
    }, 1000);
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Preferências de Notificações
        </Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSavePreferences}
          disabled={!hasChanges}
        >
          Salvar Preferências
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Preferências por tipo de notificação */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Receber notificações por tipo
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure quais tipos de notificações você deseja receber e por quais canais.
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    <NotificationsIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    No aplicativo
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => handleEnableAllChannel('inApp')}>Ativar tudo</Button>
                    <Button size="small" onClick={() => handleDisableAllChannel('inApp')}>Desativar tudo</Button>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Email
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => handleEnableAllChannel('email')}>Ativar tudo</Button>
                    <Button size="small" onClick={() => handleDisableAllChannel('email')}>Desativar tudo</Button>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    <PhoneAndroidIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    Push
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" onClick={() => handleEnableAllChannel('push')}>Ativar tudo</Button>
                    <Button size="small" onClick={() => handleDisableAllChannel('push')}>Desativar tudo</Button>
                  </Box>
                </Box>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {notificationTypes.map((type, index) => (
              <Box key={type.id} sx={{ mb: index < notificationTypes.length - 1 ? 3 : 0 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={5}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <NotificationIcon type={type.id} size="medium" />
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="subtitle1">{type.label}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {type.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={7}>
                    <Grid container spacing={1}>
                      <Grid item xs={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences[type.id].inApp}
                              onChange={(e) => handleChangeTypePreference(type.id, 'inApp', e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <NotificationsIcon fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">No app</Typography>
                            </Box>
                          }
                        />
                      </Grid>
                      
                      <Grid item xs={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences[type.id].email}
                              onChange={(e) => handleChangeTypePreference(type.id, 'email', e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <EmailIcon fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">Email</Typography>
                            </Box>
                          }
                        />
                      </Grid>
                      
                      <Grid item xs={4}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={preferences[type.id].push}
                              onChange={(e) => handleChangeTypePreference(type.id, 'push', e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneAndroidIcon fontSize="small" sx={{ mr: 0.5 }} />
                              <Typography variant="body2">Push</Typography>
                            </Box>
                          }
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
                
                {index < notificationTypes.length - 1 && (
                  <Divider sx={{ mt: 2, mb: 2 }} />
                )}
              </Box>
            ))}
          </Paper>
        </Grid>
        
        {/* Configurações globais */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Resumo por Email" 
              subheader="Configurações para emails de resumo de atividades"
            />
            <CardContent>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.global.emailDigest}
                      onChange={(e) => handleChangeGlobalPreference('emailDigest', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Receber resumo por email"
                />
                
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Frequência de envio:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant={preferences.global.emailDigestFrequency === 'daily' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => handleChangeGlobalPreference('emailDigestFrequency', 'daily')}
                      disabled={!preferences.global.emailDigest}
                    >
                      Diariamente
                    </Button>
                    <Button
                      variant={preferences.global.emailDigestFrequency === 'weekly' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => handleChangeGlobalPreference('emailDigestFrequency', 'weekly')}
                      disabled={!preferences.global.emailDigest}
                    >
                      Semanalmente
                    </Button>
                  </Box>
                </Box>
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Não Perturbe" 
              subheader="Configure horários para silenciar notificações push"
              action={
                <Tooltip title="As notificações ainda serão recebidas no aplicativo quando você abri-lo">
                  <IconButton>
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <CardContent>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.global.doNotDisturb}
                      onChange={(e) => handleChangeGlobalPreference('doNotDisturb', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Ativar modo Não Perturbe"
                />
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" gutterBottom>
                      Início:
                    </Typography>
                    <input
                      type="time"
                      value={preferences.global.doNotDisturbStart}
                      onChange={(e) => handleChangeGlobalPreference('doNotDisturbStart', e.target.value)}
                      disabled={!preferences.global.doNotDisturb}
                      style={{ 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ccc',
                        width: '100%' 
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" gutterBottom>
                      Fim:
                    </Typography>
                    <input
                      type="time"
                      value={preferences.global.doNotDisturbEnd}
                      onChange={(e) => handleChangeGlobalPreference('doNotDisturbEnd', e.target.value)}
                      disabled={!preferences.global.doNotDisturb}
                      style={{ 
                        padding: '8px', 
                        borderRadius: '4px', 
                        border: '1px solid #ccc',
                        width: '100%' 
                      }}
                    />
                  </Grid>
                </Grid>
              </FormGroup>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              As preferências de notificação são aplicadas a todas as suas sessões e dispositivos.
              Você pode alterar essas configurações a qualquer momento.
            </Typography>
          </Alert>
        </Grid>
        
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSavePreferences}
            disabled={!hasChanges}
          >
            Salvar Preferências
          </Button>
        </Grid>
      </Grid>
      
      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationPreferences; 