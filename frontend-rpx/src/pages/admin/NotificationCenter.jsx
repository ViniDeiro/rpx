import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Send as SendIcon,
  Preview as PreviewIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import NotificationIcon from '../../components/common/NotificationIcon';

const NotificationCenter = () => {
  // Estados para gerenciar a lista de notificações
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para o modal de nova notificação
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' ou 'edit'
  const [currentNotification, setCurrentNotification] = useState({
    title: '',
    message: '',
    type: 'announcement',
    targetGroups: [],
    scheduledDate: null
  });
  
  // Estado para o snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    searchQuery: ''
  });
  
  // Dados simulados para usuários/grupos alvo
  const availableTargetGroups = [
    { id: 'all_users', name: 'Todos os Usuários' },
    { id: 'premium_users', name: 'Usuários Premium' },
    { id: 'free_users', name: 'Usuários Gratuitos' },
    { id: 'inactive_users', name: 'Usuários Inativos (30+ dias)' },
    { id: 'new_users', name: 'Novos Usuários (< 7 dias)' },
    { id: 'team_captains', name: 'Capitães de Time' }
  ];
  
  // Tipos de notificação
  const notificationTypes = [
    { id: 'announcement', label: 'Anúncio' },
    { id: 'system', label: 'Sistema' },
    { id: 'game', label: 'Jogo' },
    { id: 'tournament', label: 'Torneio' },
    { id: 'team', label: 'Time' },
    { id: 'message', label: 'Mensagem' }
  ];
  
  // Função para buscar notificações do servidor
  const fetchNotifications = async () => {
    setLoading(true);
    
    // Simulando uma chamada à API
    setTimeout(() => {
      const mockNotifications = [
        {
          id: 1,
          title: 'Manutenção Programada',
          message: 'O sistema estará indisponível das 02:00 às 04:00 para manutenção.',
          type: 'system',
          createdAt: '2023-09-15T10:00:00',
          sentAt: '2023-09-15T10:00:00',
          status: 'sent',
          recipients: 1250,
          targetGroups: ['all_users']
        },
        {
          id: 2,
          title: 'Novo Torneio Disponível',
          message: 'O torneio "Copa RPX de Verão" já está disponível para inscrições!',
          type: 'tournament',
          createdAt: '2023-09-14T14:30:00',
          sentAt: '2023-09-14T15:00:00',
          status: 'sent',
          recipients: 876,
          targetGroups: ['premium_users', 'team_captains']
        },
        {
          id: 3,
          title: 'Atualização de Jogos',
          message: 'Novos jogos foram adicionados à plataforma! Confira agora.',
          type: 'game',
          createdAt: '2023-09-12T11:20:00',
          scheduledDate: '2023-09-20T09:00:00',
          status: 'scheduled',
          recipients: null,
          targetGroups: ['all_users']
        }
      ];
      
      setNotifications(mockNotifications);
      setLoading(false);
    }, 1000);
  };
  
  // Função para filtrar notificações
  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      // Filtrar por tipo
      if (filters.type !== 'all' && notification.type !== filters.type) return false;
      
      // Filtrar por status
      if (filters.status !== 'all' && notification.status !== filters.status) return false;
      
      // Filtrar por busca
      if (filters.searchQuery && !notification.title.toLowerCase().includes(filters.searchQuery.toLowerCase())) return false;
      
      return true;
    });
  };
  
  // Carregar notificações na inicialização
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  // Manipuladores para a paginação
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Manipuladores para o modal
  const handleOpenDialog = (mode, notification = null) => {
    setDialogMode(mode);
    if (notification) {
      setCurrentNotification({...notification});
    } else {
      setCurrentNotification({
        title: '',
        message: '',
        type: 'announcement',
        targetGroups: [],
        scheduledDate: null
      });
    }
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentNotification(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleTargetGroupsChange = (event, newValue) => {
    setCurrentNotification(prev => ({
      ...prev,
      targetGroups: newValue.map(item => item.id)
    }));
  };
  
  // Manipulador para enviar ou agendar uma notificação
  const handleSaveNotification = () => {
    // Aqui você implementaria a lógica real para enviar ao servidor
    
    // Simulando uma resposta bem-sucedida
    const newNotification = {
      ...currentNotification,
      id: dialogMode === 'edit' ? currentNotification.id : Date.now(),
      createdAt: new Date().toISOString(),
      status: currentNotification.scheduledDate ? 'scheduled' : 'sent',
      sentAt: currentNotification.scheduledDate ? null : new Date().toISOString(),
      recipients: currentNotification.scheduledDate ? null : Math.floor(Math.random() * 1000) + 500
    };
    
    if (dialogMode === 'edit') {
      setNotifications(prev => prev.map(item => 
        item.id === newNotification.id ? newNotification : item
      ));
      setSnackbar({
        open: true,
        message: 'Notificação atualizada com sucesso!',
        severity: 'success'
      });
    } else {
      setNotifications(prev => [newNotification, ...prev]);
      setSnackbar({
        open: true,
        message: newNotification.scheduledDate 
          ? 'Notificação agendada com sucesso!' 
          : 'Notificação enviada com sucesso!',
        severity: 'success'
      });
    }
    
    handleCloseDialog();
  };
  
  // Manipulador para excluir uma notificação
  const handleDeleteNotification = (id) => {
    // Aqui você implementaria a lógica real para excluir no servidor
    
    setNotifications(prev => prev.filter(item => item.id !== id));
    setSnackbar({
      open: true,
      message: 'Notificação excluída com sucesso!',
      severity: 'success'
    });
  };
  
  // Manipuladores para filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPage(0); // Voltar para a primeira página ao filtrar
  };
  
  const handleSearchChange = (e) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: e.target.value
    }));
    setPage(0); // Voltar para a primeira página ao buscar
  };
  
  // Fechar o snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Filtrar e paginar notificações
  const filteredNotifications = getFilteredNotifications();
  const paginatedNotifications = filteredNotifications.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Central de Notificações
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('create')}
        >
          Nova Notificação
        </Button>
      </Box>
      
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="type-filter-label">Tipo</InputLabel>
              <Select
                labelId="type-filter-label"
                id="type-filter"
                name="type"
                value={filters.type}
                label="Tipo"
                onChange={handleFilterChange}
              >
                <MenuItem value="all">Todos os tipos</MenuItem>
                {notificationTypes.map(type => (
                  <MenuItem value={type.id} key={type.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <NotificationIcon type={type.id} size="small" />
                      <Box sx={{ ml: 1 }}>{type.label}</Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                name="status"
                value={filters.status}
                label="Status"
                onChange={handleFilterChange}
              >
                <MenuItem value="all">Todos os status</MenuItem>
                <MenuItem value="draft">Rascunho</MenuItem>
                <MenuItem value="scheduled">Agendada</MenuItem>
                <MenuItem value="sent">Enviada</MenuItem>
                <MenuItem value="failed">Falha</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={12} md={6}>
            <TextField
              fullWidth
              size="small"
              label="Buscar notificações"
              variant="outlined"
              value={filters.searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                endAdornment: (
                  <IconButton size="small">
                    <SearchIcon />
                  </IconButton>
                ),
              }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabela de notificações */}
      <Paper>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data de Criação</TableCell>
                <TableCell>Enviada/Agendada</TableCell>
                <TableCell>Destinatários</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Carregando...</TableCell>
                </TableRow>
              ) : paginatedNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Nenhuma notificação encontrada</TableCell>
                </TableRow>
              ) : (
                paginatedNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <NotificationIcon type={notification.type} size="small" />
                        <Box sx={{ ml: 1 }}>
                          {notificationTypes.find(t => t.id === notification.type)?.label}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{notification.title}</TableCell>
                    <TableCell>
                      <Chip 
                        label={
                          notification.status === 'sent' ? 'Enviada' :
                          notification.status === 'scheduled' ? 'Agendada' :
                          notification.status === 'draft' ? 'Rascunho' :
                          notification.status === 'failed' ? 'Falha' : notification.status
                        }
                        color={
                          notification.status === 'sent' ? 'success' :
                          notification.status === 'scheduled' ? 'primary' :
                          notification.status === 'draft' ? 'default' :
                          notification.status === 'failed' ? 'error' : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {notification.sentAt ? 
                        new Date(notification.sentAt).toLocaleDateString('pt-BR') : 
                        notification.scheduledDate ? 
                          new Date(notification.scheduledDate).toLocaleDateString('pt-BR') : 
                          '-'
                      }
                    </TableCell>
                    <TableCell>
                      {notification.recipients || '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleOpenDialog('edit', notification)}
                        disabled={notification.status === 'sent'}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteNotification(notification.id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredNotifications.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
      
      {/* Modal para criar/editar notificação */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {dialogMode === 'create' ? 'Criar Nova Notificação' : 'Editar Notificação'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                name="title"
                value={currentNotification.title}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="type-label">Tipo de Notificação</InputLabel>
                <Select
                  labelId="type-label"
                  id="type"
                  name="type"
                  value={currentNotification.type}
                  label="Tipo de Notificação"
                  onChange={handleInputChange}
                >
                  {notificationTypes.map(type => (
                    <MenuItem value={type.id} key={type.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <NotificationIcon type={type.id} size="small" />
                        <Box sx={{ ml: 1 }}>{type.label}</Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Agendamento (opcional)"
                name="scheduledDate"
                type="datetime-local"
                value={currentNotification.scheduledDate || ''}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Autocomplete
                multiple
                id="targetGroups"
                options={availableTargetGroups}
                getOptionLabel={(option) => option.name}
                value={availableTargetGroups.filter(group => 
                  currentNotification.targetGroups?.includes(group.id)
                )}
                onChange={handleTargetGroupsChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Grupos de Destinatários"
                    placeholder="Selecione os grupos"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      key={option.id}
                    />
                  ))
                }
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mensagem"
                name="message"
                value={currentNotification.message}
                onChange={handleInputChange}
                multiline
                rows={4}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSaveNotification} 
            variant="contained" 
            startIcon={currentNotification.scheduledDate ? <HistoryIcon /> : <SendIcon />}
          >
            {currentNotification.scheduledDate ? 'Agendar' : 'Enviar Agora'}
          </Button>
        </DialogActions>
      </Dialog>
      
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

export default NotificationCenter; 